// Strip Max-Age/Expires so the auth cookie expires on browser close (session-only).
// Limitation: browsers with "Restore previous session" may retain it across restarts.
export function toSessionOptions<T extends object>(options: T): Omit<T, "maxAge" | "expires"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { maxAge: _m, expires: _e, ...rest } = options as T & { maxAge?: unknown; expires?: unknown };
  return rest as Omit<T, "maxAge" | "expires">;
}
