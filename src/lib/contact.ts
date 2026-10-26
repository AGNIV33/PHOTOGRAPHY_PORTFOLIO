// Rules for the contact form, used by the form on the page.

export const SUBJECTS = [
  "A question",
  "Exhibition or feature",
  "Buying or licensing a photograph",
  "Working together",
  "Something else",
] as const;

export const LIMITS = { name: 80, email: 200, message: 2000, minMessage: 10 };

export type ContactValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactField = keyof ContactValues;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Removes control characters and trims. A message may keep its line breaks.
export function clean(value: string, keepNewlines = false) {
  const pattern = keepNewlines ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.replace(pattern, "").trim();
}

// Returns the first problem found, or null when everything is fine.
export function validateContact(v: ContactValues): { field: ContactField; text: string } | null {
  const name = clean(v.name);
  const email = clean(v.email);
  const message = clean(v.message, true);
  if (name.length < 2) return { field: "name", text: "Please write your name." };
  if (name.length > LIMITS.name) return { field: "name", text: `Please keep your name under ${LIMITS.name} letters.` };
  if (!EMAIL.test(email) || email.length > LIMITS.email) return { field: "email", text: "That email address doesn't look right." };
  if (!(SUBJECTS as readonly string[]).includes(v.subject)) return { field: "subject", text: "Please choose what your message is about." };
  if (message.length < LIMITS.minMessage) return { field: "message", text: "Please write a little more, so I can help." };
  if (message.length > LIMITS.message) return { field: "message", text: `Please keep the message under ${LIMITS.message} letters.` };
  return null;
}

// The three EmailJS values. They are public by design (EmailJS uses them in the browser);
// the template and the email address that receives the messages are set in the EmailJS dashboard.
export const emailjsConfig = {
  serviceId: (process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "").trim(),
  templateId: (process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "").trim(),
  publicKey: (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "").trim(),
};

export const emailjsReady = Boolean(emailjsConfig.serviceId && emailjsConfig.templateId && emailjsConfig.publicKey);
