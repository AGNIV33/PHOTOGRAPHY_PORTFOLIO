// If Supabase sends a sign-in link to the wrong page (it falls back to the "Site URL" when
// the requested address isn't on its allowed list), the session arrives after "#" on that
// page. Hand it to /auth/finish, which knows what to do with it.
if (location.pathname !== "/auth/finish" && /(^|[#&])(access_token|error_code)=/.test(location.hash)) {
  location.replace(`/auth/finish${location.search}${location.hash}`);
}

// Runs in the browser before React hydrates the page.
// Some browser extensions (e.g. Bitdefender's) stamp attributes like bis_skin_checked onto
// every element, which Next.js reports as hydration "Issues" in development. Strip them as
// they appear. Development only; visitors never see these warnings.
if (process.env.NODE_ENV === "development") {
  const bad = (n: string) => n === "bis_skin_checked" || n === "bis_register" || n.startsWith("__processed_");
  const clean = (el: Element) => {
    for (const a of Array.from(el.attributes)) if (bad(a.name)) el.removeAttribute(a.name);
  };
  document.querySelectorAll("*").forEach(clean);
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes" && r.attributeName && bad(r.attributeName)) {
        (r.target as Element).removeAttribute(r.attributeName);
      }
      r.addedNodes.forEach((n) => {
        if (n instanceof Element) {
          clean(n);
          n.querySelectorAll("*").forEach(clean);
        }
      });
    }
  }).observe(document.documentElement, { attributes: true, childList: true, subtree: true });
}
