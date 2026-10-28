import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import type { ReactNode } from "react";

import {
  canSeeFlagging,
  canSeePractical,
  hasAccepted,
} from "@/auth/permissions";
import { getViewer } from "@/auth/viewer";
import { AppBar } from "@/components/AppBar";
import { StatusBanner } from "@/components/StatusBanner";
import { eventLocale, eventName, publicUrl } from "@/config";
import { getTheme } from "@/theme";
import { getTranslations } from "@/translations";

import "./globals.scss";

const roboto = Roboto({
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: eventName,
  robots: { index: false, follow: false },
};

/**
 * Resolves the "system" theme before first paint and follows the OS setting while the page is
 * open. Explicit dark/light choices are rendered on the server and need no script.
 */
const systemThemeScript = `(function(){var m=window.matchMedia("(prefers-color-scheme: dark)");function a(){document.documentElement.setAttribute("data-bs-theme",m.matches?"dark":"light")}a();m.addEventListener("change",a)})();`;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const theme = await getTheme();
  const viewer = await getViewer();
  const t = getTranslations();
  const now = new Date();
  return (
    <html
      lang={eventLocale}
      className={roboto.variable}
      data-bs-theme={theme === "system" ? "dark" : theme}
      // The system theme script changes data-bs-theme before hydration.
      suppressHydrationWarning
    >
      <head>
        {theme === "system" ? (
          <script dangerouslySetInnerHTML={{ __html: systemThemeScript }} />
        ) : null}
      </head>
      <body>
        <AppBar
          eventName={eventName}
          viewer={
            viewer
              ? {
                  name: viewer.name,
                  isGm: viewer.user.isGm,
                  hasAccepted: hasAccepted(viewer),
                  canSeeFlagging: canSeeFlagging(viewer, now),
                  canSeePractical: canSeePractical(viewer, now),
                }
              : null
          }
          theme={theme}
          messages={t.AppBar}
        />
        <main>
          {viewer && hasAccepted(viewer) ? (
            <StatusBanner
              status={viewer.user.status}
              castingResult={viewer.castingResult}
              messages={t.StatusBanner}
            />
          ) : null}
          {children}
        </main>
      </body>
    </html>
  );
}
