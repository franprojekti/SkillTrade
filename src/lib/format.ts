export function getDisplayName(p: { display_name: string | null; username: string }): string {
  return p.display_name || p.username;
}

export function formatLocation(p: {
  location_area?: string | null;
  location_city?: string | null;
  location_country?: string | null;
}): string {
  return [p.location_area, p.location_city, p.location_country].filter(Boolean).join(", ");
}

export function formatConnectionPref(pref: string): string {
  if (pref === "in-person") return "In-person";
  if (pref === "online") return "Online";
  return "In-person or online";
}
