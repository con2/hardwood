import { ServerTabs, type Tab } from "@con2/components";
import type { ReactNode } from "react";

import type { Translations } from "@/translations";

export type StructureTab =
  "vetting" | "practical" | "choices" | "timeline" | "privacyPolicy";

const hrefs: Record<StructureTab, string> = {
  vetting: "/structure/vetting",
  practical: "/structure/practical",
  choices: "/structure/choices",
  timeline: "/structure/timeline",
  privacyPolicy: "/structure/privacy-policy",
};

interface Props {
  active: StructureTab;
  messages: Translations["Structure"];
  /** `?success=1`: the previous save went through. */
  saved?: boolean;
  /** `?error=…`: the previous save failed. */
  error?: boolean;
  children: ReactNode;
}

/** Heading and tabs shared by the tabs of the Structure view (GM only). */
export function StructureView({
  active,
  messages,
  saved,
  error,
  children,
}: Props) {
  const tabs: Tab[] = (Object.keys(hrefs) as StructureTab[]).map((slug) => ({
    slug,
    href: hrefs[slug],
    title: messages.tabs[slug],
  }));

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{messages.title}</h1>
      <ServerTabs tabs={tabs} active={active} />
      <div className="pt-3">
        {saved ? (
          <div className="alert alert-success" role="status">
            {messages.saved}
          </div>
        ) : null}
        {error ? (
          <div className="alert alert-danger" role="alert">
            {messages.errors.invalid}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/** Reads the `success` and `error` search params of a Structure tab. */
export async function readStatus(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<{ saved: boolean; error: boolean }> {
  const params = await searchParams;
  return { saved: params.success === "1", error: !!params.error };
}
