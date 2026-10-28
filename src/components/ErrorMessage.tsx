import type { ReactNode } from "react";

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div className="container pt-5">
      <div className="alert alert-danger" role="alert">
        {children}
      </div>
    </div>
  );
}
