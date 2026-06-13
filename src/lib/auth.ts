const INTERNAL_EMAIL_DOMAIN = "internal.skilltrade.app";

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim().replace(/\s+/g, "");
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`;
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (normalized.length < 3) return "Username must be at least 3 characters.";
  if (normalized.length > 20) return "Username must be 20 characters or less.";
  if (!/^[a-z0-9_]+$/.test(normalized))
    return "Username can only contain letters, numbers, and underscores.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}
