// "Kolkata Trams" → "kolkata-trams", for web addresses.
export function slugify(title: string, fallback = "item") {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 60) || fallback
  );
}

// Adds -2, -3, ... until the slug is not in `used`.
export function uniqueSlug(base: string, used: Set<string>) {
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}
