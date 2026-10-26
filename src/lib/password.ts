// Same rule in the browser (instant hint) and on the server (the real check).
export function passwordProblem(password: string) {
  if (password.length < 8) return "Use at least 8 characters for the password.";
  if (password.length > 72) return "Use at most 72 characters for the password.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Use both letters and numbers in the password.";
  return null;
}

// 0 to 4, for the strength bar.
export function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) score++;
  return score;
}
