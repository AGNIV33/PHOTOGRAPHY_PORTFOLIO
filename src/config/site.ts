// One place for the details that appear across the site.
// TODO(confirm): city, email and social links.
export const site = {
  name: "Suvrajit Sarkar",
  shortName: "Suvrajit",
  role: "Photographer",
  kicker: "Visual stories",
  tagline: "Stories, moments and the world through my lens.",
  city: "Kolkata",
  intro: "Street photographs made on foot, in the lanes, markets and tram routes of the city.",
  // Main menu, as in the landing page design.
  nav: [
    { href: "/", label: "Home", match: ["/"] },
    { href: "/gallery", label: "Work", match: ["/gallery", "/albums"] },
    { href: "/about", label: "About", match: ["/about", "/achievements", "/gear"] },
    { href: "/contact", label: "Contact", match: ["/contact"] },
  ],
  // Everything else, linked from the footer.
  more: [
    { href: "/gallery", label: "Gallery" },
    { href: "/albums", label: "Albums" },
    { href: "/blog", label: "Journal" },
    { href: "/achievements", label: "Achievements" },
    { href: "/gear", label: "Gear" },
  ],
  social: [
    { label: "Instagram", href: "" },
    { label: "Facebook", href: "" },
  ],
} as const;
