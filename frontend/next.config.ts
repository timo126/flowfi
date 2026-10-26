import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (`.next/standalone`) carrying only the
  // traced production dependencies. The production Docker image copies this
  // instead of the full `.next` tree + node_modules, keeping the runtime image
  // small (issue #1335).
  output: "standalone",
  // The workspace root lives one level above this directory. Pinning it here
  // prevents Turbopack from inferring a wrong root when stray package-lock
  // files exist outside the repo (e.g. ~/package-lock.json).
  //
  // This must be computed without importing node:path or using __dirname:
  // those references are only safe when `next.config.compiled.js` is actually
  // transpiled to CommonJS (native SWC binding). When Next falls back to the
  // WASM SWC binding — e.g. in CI when the platform-specific
  // `@next/swc-linux-x64-gnu` optional dependency was skipped by npm — the
  // module transform is skipped and the compiled config is evaluated with the
  // import/`__dirname` bindings missing, failing the build with
  // "Failed to load next.config.ts ... path is not defined". `process.cwd()`
  // and the global `URL` are available in every evaluation context.
  turbopack: {
    root: new URL("../", `file://${process.cwd()}/`).pathname,
  },
  // Enable tree-shaking for icon/utility libraries to reduce per-route
  // bundle sizes (Issue #1254).
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tanstack/react-query",
      "@tanstack/react-virtual",
    ],
  },
  async redirects() {
    return [
      {
        // Redirect legacy duplicated route `/streams/streams/:streamId` → `/streams/:id`
        // See: https://github.com/LabsCrypt/flowfi/issues/1084
        source: "/streams/streams/:streamId",
        destination: "/streams/:streamId",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
