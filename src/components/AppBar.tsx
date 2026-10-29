"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

import { signOut, signOutEverywhere } from "@/app/actions/session";
import type { Theme } from "@/theme";
import type { Translations } from "@/translations";

import { ThemeSwitch } from "./ThemeSwitch";

export interface AppBarViewer {
  /** Display name from the viewer's own vetting response. */
  name: string | null;
  isGm: boolean;
  /** False while the invitation is not accepted (or a GM-led password reset is pending). */
  hasAccepted: boolean;
}

interface Props {
  eventName: string;
  /** Null when signed out: only the brand is shown. */
  viewer: AppBarViewer | null;
  theme: Theme;
  messages: Translations["AppBar"];
}

const navHrefs = [
  "/signup",
  "/flagging",
  "/practical",
  "/privacy",
  "/structure",
  "/players",
];

/** The nav link whose href the current path is at or under; its sub-views count as it. */
function activeLink(pathname: string): string | undefined {
  return navHrefs.find(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

/**
 * Brand (not a link), the main views on the left, GM views and the profile menu on the right.
 * Users who have not accepted their invitation only see Privacy. Flagging and Practical are shown
 * before they open, so that invitees learn they exist; the pages say when they will open.
 */
export function AppBar({ eventName, viewer, theme, messages }: Props) {
  // Controlled: without `activeKey` the Nav highlights whichever link was clicked last. An empty
  // string keeps it controlled on pages outside the bar (undefined would not).
  const activeKey = activeLink(usePathname()) ?? "";

  return (
    <Navbar className="AppBar border-bottom" expand="md">
      <Container fluid>
        <Navbar.Brand as="span">{eventName}</Navbar.Brand>

        {viewer ? (
          <>
            <Navbar.Toggle
              aria-controls="AppBar-nav"
              aria-label={messages.toggleNavigation}
            />
            <Navbar.Collapse id="AppBar-nav">
              <Nav className="me-auto" activeKey={activeKey}>
                {viewer.hasAccepted ? (
                  <>
                    <Nav.Link as={Link} href="/signup">
                      {messages.signUp}
                    </Nav.Link>
                    <Nav.Link as={Link} href="/flagging">
                      {messages.flagging}
                    </Nav.Link>
                    <Nav.Link as={Link} href="/practical">
                      {messages.practical}
                    </Nav.Link>
                  </>
                ) : null}
                <Nav.Link as={Link} href="/privacy">
                  {messages.privacy}
                </Nav.Link>
              </Nav>
              <Nav activeKey={activeKey}>
                {viewer.isGm && viewer.hasAccepted ? (
                  <>
                    <Nav.Link as={Link} href="/structure">
                      {messages.structure}
                    </Nav.Link>
                    <Nav.Link as={Link} href="/players">
                      {messages.players}
                    </Nav.Link>
                  </>
                ) : null}
                <NavDropdown
                  title={viewer.name ?? <em>{messages.unnamed}</em>}
                  id="AppBar-profile"
                  align="end"
                >
                  {viewer.hasAccepted ? (
                    <>
                      <NavDropdown.Item as={Link} href="/profile/password">
                        {messages.changePassword}
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                    </>
                  ) : null}
                  <ThemeSwitch theme={theme} messages={messages.theme} />
                  <NavDropdown.Divider />
                  <form action={signOut}>
                    <NavDropdown.Item as="button" type="submit">
                      {messages.signOut}
                    </NavDropdown.Item>
                  </form>
                  <form action={signOutEverywhere}>
                    <NavDropdown.Item as="button" type="submit">
                      {messages.signOutEverywhere}
                    </NavDropdown.Item>
                  </form>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </>
        ) : null}
      </Container>
    </Navbar>
  );
}
