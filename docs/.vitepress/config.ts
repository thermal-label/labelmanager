import { defineConfig } from "vitepress";
import { fileURLToPath } from "node:url";

export default defineConfig({
  title: "labelmanager-ts",
  description: "TypeScript driver for DYMO D1 label printers",
  base: "/labelmanager-ts/",
  ignoreDeadLinks: [
    /^\.\/LICENSE$/,
    /^\.\/(cli|core|node|web)\/dist\/README$/,
    /^\.\/(cli|core|node|web)\/dist\/src\/README$/
  ],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/introduction" },
      { text: "Node.js", link: "/node/" },
      { text: "CLI", link: "/cli/" },
      { text: "Web", link: "/web/" },
      { text: "API", link: "/api/core" }
    ],
    sidebar: {
      "/guide/": [
        { text: "Introduction", link: "/guide/introduction" },
        { text: "Getting Started", link: "/guide/getting-started" },
        { text: "Linux Setup", link: "/guide/linux-setup" }
      ],
      "/node/": [
        { text: "Overview", link: "/node/" },
        { text: "Printing Text", link: "/node/printing-text" },
        { text: "Printing Images", link: "/node/printing-images" },
        { text: "Multi Printer", link: "/node/multi-printer" }
      ],
      "/cli/": [
        { text: "Overview", link: "/cli/" },
        { text: "Commands", link: "/cli/commands" }
      ],
      "/web/": [
        { text: "Overview", link: "/web/" },
        { text: "Quick Start", link: "/web/quick-start" },
        { text: "React Example", link: "/web/react-example" }
      ],
      "/api/": [
        { text: "Core", link: "/api/core" },
        { text: "Node", link: "/api/node" },
        { text: "CLI", link: "/api/cli" },
        { text: "Web", link: "/api/web" }
      ]
    },
    socialLinks: [{ icon: "github", link: "https://github.com/thermal-label/labelmanager" }],
    search: { provider: "local" }
  },
  vite: {
    resolve: {
      alias: {
        "@thermal-label/labelmanager-web": fileURLToPath(
          new URL("../../packages/web/src/index.ts", import.meta.url)
        )
      }
    }
  }
});
