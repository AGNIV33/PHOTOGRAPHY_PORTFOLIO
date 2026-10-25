// One place for the details that appear across the site.
// TODO(confirm): photographer's full name, city and social links.
export const site = {
  name: "Suvra",
  fullName: "Suvra",
  role: "Street photographer",
  city: "Kolkata",
  intro:
    "Street photographs made on foot, mostly in the lanes, markets and tram routes of the city.",
  nav: [
    { href: "/gallery", label: "Gallery" },
    { href: "/albums", label: "Albums" },
    { href: "/blog", label: "Journal" },
    { href: "/achievements", label: "Achievements" },
    { href: "/gear", label: "Gear" },
    { href: "/about", label: "About" },
  ],
  social: [
    { label: "Instagram", href: "" },
    { label: "Facebook", href: "" },
  ],
} as const;
