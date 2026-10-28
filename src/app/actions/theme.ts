"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { themeCookieName, themes } from "@/theme";

const themeSchema = z.enum(themes);

export async function setTheme(theme: string) {
  const value = themeSchema.parse(theme);
  (await cookies()).set(themeCookieName, value, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
  });
}
