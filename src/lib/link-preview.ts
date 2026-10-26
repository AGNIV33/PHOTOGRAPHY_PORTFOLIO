import "server-only";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

// Reads the title, description and picture a web page shares for link previews
// (its "Open Graph" tags). The website's server visits the address, so it must never be
// tricked into visiting something private. Protections:
// - only http and https, only the normal web ports
// - the address is checked when the connection is made (not just beforehand), so a name that
//   secretly points to an internal address is refused
// - every redirect is checked the same way, at most 4
// - 8 second limit, and only the first 600 KB of a page is read

const MAX_BYTES = 600_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 4;

export type LinkPreview = {
  site: string;
  title: string;
  description: string;
  image: string | null;
};

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    if (v.startsWith("::ffff:")) return true;
    return /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith("ff");
  }
  return true;
}

// Used by Node when it connects: refuses any name that resolves to a private address.
const safeLookup = ((hostname: string, options: dns.LookupOptions, callback: (...args: unknown[]) => void) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = addresses as dns.LookupAddress[];
    if (!list.length || list.some((a) => isPrivateAddress(a.address))) {
      return callback(new Error("That address is not allowed."));
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}) as unknown as net.LookupFunction;

export function parseWebAddress(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That doesn't look like a web address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only web addresses (http or https) are allowed.");
  if (url.username || url.password) throw new Error("Addresses with a password in them are not allowed.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("That address uses an unusual port, so it is not allowed.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isPrivateAddress(host)) throw new Error("That address is not allowed.");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new Error("That address is not allowed.");
  }
  return url;
}

type Page = { status: number; location?: string; type: string; html: string };

function getOnce(url: URL): Promise<Page> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    let settled = false;
    const done = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: safeLookup,
        timeout: TIMEOUT_MS,
        headers: {
          // A friendly, honest name. Some sites only share previews with link-preview bots.
          "user-agent": "Mozilla/5.0 (compatible; SuvrajitSarkarPortfolio/1.0; link preview)",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "en",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const type = String(res.headers["content-type"] ?? "");
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return done(() => resolve({ status, location: String(res.headers.location), type, html: "" }));
        }
        if (!/text\/html|application\/xhtml/i.test(type)) {
          res.resume();
          return done(() => resolve({ status, type, html: "" }));
        }
        const chunks: Buffer[] = [];
        let size = 0;
        const finish = () => done(() => resolve({ status, type, html: Buffer.concat(chunks).toString("utf8") }));
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            res.destroy();
            finish();
          } else {
            chunks.push(chunk);
          }
        });
        res.on("end", finish);
        res.on("close", finish);
        res.on("error", finish);
      },
    );
    req.on("timeout", () => req.destroy(new Error("The website took too long to answer.")));
    req.on("error", (e) => done(() => reject(e)));
    req.end();
  });
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function safeChar(code: number) {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

function metaTags(html: string) {
  const head = html.slice(0, html.search(/<\/head>/i) > 0 ? html.search(/<\/head>/i) : 300_000);
  const tags: Record<string, string> = {};
  for (const m of head.matchAll(/<meta\s[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const a of m[0].matchAll(/([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5] ?? "";
    }
    const key = (attrs.property || attrs.name || "").toLowerCase();
    if (key && attrs.content !== undefined && !(key in tags)) tags[key] = decode(attrs.content);
  }
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return { tags, title: title ? decode(title) : "" };
}

// Pages that only say "log in" tell us nothing about the post itself.
const GENERIC_TITLE = /^(facebook|instagram|log in|login|sign in|log into facebook|meta|x|twitter|just a moment\.{0,3}|access denied|forbidden)$/i;
const LOGIN_WALL = /log in or sign up|log into facebook|see posts, photos and more on facebook|please enable javascript/i;

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview & { note?: string }> {
  let url = parseWebAddress(rawUrl);
  let page: Page | null = null;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    page = await getOnce(url);
    if (page.location) {
      if (hop === MAX_REDIRECTS) throw new Error("That address redirects too many times.");
      url = parseWebAddress(new URL(page.location, url).toString());
      continue;
    }
    break;
  }
  const empty = { site: url.hostname.replace(/^www\./, ""), title: "", description: "", image: null };
  if (!page || !page.html) {
    return { ...empty, note: "That site didn't share a preview." };
  }

  const { tags, title: pageTitle } = metaTags(page.html);
  let title = tags["og:title"] || tags["twitter:title"] || pageTitle || "";
  let description = tags["og:description"] || tags["twitter:description"] || tags["description"] || "";
  let image: string | null = tags["og:image"] || tags["og:image:url"] || tags["twitter:image"] || tags["twitter:image:src"] || null;

  if (GENERIC_TITLE.test(title) || LOGIN_WALL.test(title) || LOGIN_WALL.test(description)) {
    title = "";
    description = "";
    image = null;
  }
  if (image) {
    try {
      const abs = new URL(image, url);
      image = abs.protocol === "http:" || abs.protocol === "https:" ? abs.toString() : null;
    } catch {
      image = null;
    }
  }
  const site = tags["og:site_name"] || empty.site;
  const preview = { site: site.slice(0, 80), title: title.slice(0, 200), description: description.slice(0, 400), image };
  if (!preview.title && !preview.image) {
    return { ...preview, note: "That site didn't share a preview. Facebook and Instagram often don't." };
  }
  return preview;
}
