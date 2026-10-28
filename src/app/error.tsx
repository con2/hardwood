"use client";

import { ErrorMessage } from "@/components/ErrorMessage";

/**
 * Client components cannot read server config, so this message is fixed. It carries only the
 * digest, never the error message, which might contain personal data.
 */
export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <ErrorMessage>
      Something went wrong / Jokin meni pieleen.
      {error.digest ? ` (${error.digest})` : null}
    </ErrorMessage>
  );
}
