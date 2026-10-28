"use client";

import Link from "next/link";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

import type { Theme } from "@/theme";
import type { Translations } from "@/translations";

import { ThemeSwitch } from "./ThemeSwitch";

export interface AppBarViewer {
  /** Display name from the viewer's own vetting response. */
  name: string | null;
  isGm: boolean;
}

interface Props {
  eventName: string;
  /** Null when signed out: only the brand is shown. */
  viewer: AppBarViewer | null;
  theme: Theme;
  messages: Translations["AppBar"];
}

/**
 * Brand (not a link), the main views on the left, GM views and the profile menu on the right.
 * Which main views the viewer may open is decided by the pages themselves.
 */
export function AppBar({ eventName, viewer, theme, messages }: Props) {
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
              <Nav className="me-auto">
                <Nav.Link as={Link} href="/signup">
                  {messages.signUp}
                </Nav.Link>
                <Nav.Link as={Link} href="/flagging">
                  {messages.flagging}
                </Nav.Link>
                <Nav.Link as={Link} href="/practical">
                  {messages.practical}
                </Nav.Link>
                <Nav.Link as={Link} href="/privacy">
                  {messages.privacy}
                </Nav.Link>
              </Nav>
              <Nav>
                {viewer.isGm ? (
                  <>
                    <Nav.Link as={Link} href="/structure/vetting">
                      {messages.structure}
                    </Nav.Link>
                    <Nav.Link as={Link} href="/players">
                      {messages.players}
                    </Nav.Link>
                  </>
                ) : null}
                <NavDropdown
                  title={viewer.name ?? <em>{messages.profile}</em>}
                  id="AppBar-profile"
                  align="end"
                >
                  <NavDropdown.Item as={Link} href="/profile/password">
                    {messages.changePassword}
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <ThemeSwitch theme={theme} messages={messages.theme} />
                  <NavDropdown.Divider />
                  {/* Becomes a form posting to the sign-out action in M1. */}
                  <NavDropdown.Item as={Link} href="/signout">
                    {messages.signOut}
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </>
        ) : null}
      </Container>
    </Navbar>
  );
}
