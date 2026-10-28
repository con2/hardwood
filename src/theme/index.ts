import { cookies } from "next/headers";

export const themeCookieName = "theme";
export const themes = ["dark", "light", "system"] as const;
export type Theme = (typeof themes)[number];
/** Some things are better left in darkness. */
export const defaultTheme: Theme = "dark";

export function isTheme(value: unknown): value is Theme {
  return (themes as readonly unknown[]).includes(value);
}

/** The viewer's theme preference from the `theme` cookie. */
export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(themeCookieName)?.value;
  return isTheme(value) ? value : defaultTheme;
}
