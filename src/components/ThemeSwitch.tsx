"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import NavDropdown from "react-bootstrap/NavDropdown";

import { setTheme } from "@/app/actions/theme";
import type { Theme } from "@/theme";
import type { Translations } from "@/translations";

interface Props {
  theme: Theme;
  messages: Translations["AppBar"]["theme"];
}

const options: Theme[] = ["dark", "light", "system"];

/** Dark/Light/System items for the profile menu. The choice is kept in the `theme` cookie. */
export function ThemeSwitch({ theme, messages }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return options.map((option) => (
    <NavDropdown.Item
      key={option}
      as="button"
      active={option === theme}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await setTheme(option);
          router.refresh();
        })
      }
    >
      {messages[option]}
    </NavDropdown.Item>
  ));
}
