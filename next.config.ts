import type { NextConfig } from "next";
import path from "node:path";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // The parent directory may hold other lockfiles; keep the workspace root here so standalone output is flat.
  turbopack: { root: path.resolve(import.meta.dirname) },
  reactCompiler: true,
  transpilePackages: ["@con2/components"],
  sassOptions: {
    // bootstrap still uses the legacy @import API
    silenceDeprecations: [
      "legacy-js-api",
      "import",
      "global-builtin",
      "color-functions",
      "if-function",
    ],
  },
};

export default nextConfig;
