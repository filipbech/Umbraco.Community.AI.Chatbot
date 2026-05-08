import { defineConfig } from "vite";
import { resolve } from "path";

// We have two output bundles from one project:
//   - `umbraco-community-chatbot-manifests`: backoffice extension manifests + workspace UI.
//     Externalises @umbraco-cms/* and @umbraco-ai/* (resolved via Umbraco's import map at runtime).
//   - `widget`: the public-facing chat widget for embedding via <script src> on a website.
//     Bundles lit inline so it stands alone with no import map.
//
// The shared rollup `external` only matches @umbraco-* — backoffice code uses
// @umbraco-cms/backoffice/external/lit (still externalised) so lit doesn't double-bundle there.
export default defineConfig({
  build: {
    lib: {
      entry: {
        "umbraco-community-chatbot-manifests": resolve(__dirname, "src/manifests.ts"),
        widget: resolve(__dirname, "src/widget/widget.ts"),
      },
      formats: ["es"],
    },
    outDir: "../wwwroot",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [/^@umbraco/, /^@umbraco-ai/],
    },
  },
});
