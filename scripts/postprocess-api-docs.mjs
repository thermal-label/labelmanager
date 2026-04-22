import { readFile, writeFile } from "node:fs/promises";

const apiReadmePath = new URL("../docs/api/README.md", import.meta.url);
const modulesPath = new URL("../docs/api/modules.md", import.meta.url);
const apiIndexPages = [
  {
    name: "core",
    title: "Core API",
    pkg: "@thermal-label/labelmanager-core"
  },
  {
    name: "node",
    title: "Node API",
    pkg: "@thermal-label/labelmanager-node"
  },
  {
    name: "cli",
    title: "CLI API",
    pkg: "@thermal-label/labelmanager-cli"
  },
  {
    name: "web",
    title: "Web API",
    pkg: "@thermal-label/labelmanager-web"
  }
];

async function patchApiReadme() {
  const raw = await readFile(apiReadmePath, "utf8");
  const next = raw.replace("(LICENSE)", "(https://github.com/thermal-label/labelmanager/blob/main/LICENSE)");
  if (next !== raw) {
    await writeFile(apiReadmePath, next, "utf8");
  }
}

async function patchModules() {
  const raw = await readFile(modulesPath, "utf8");
  const next = [
    "[**labelmanager**](README.md)",
    "",
    "***",
    "",
    "# API Modules",
    "",
    "- [Core](core.md)",
    "- [Node](node.md)",
    "- [CLI](cli.md)",
    "- [Web](web.md)",
    ""
  ].join("\n");
  if (next !== raw) {
    await writeFile(modulesPath, next, "utf8");
  }
}

async function writeApiLandingPages() {
  for (const page of apiIndexPages) {
    const fileUrl = new URL(`../docs/api/${page.name}.md`, import.meta.url);
    const content = [
      `# ${page.title}`,
      "",
      `Package: \`${page.pkg}\``,
      "",
      "Generated API content is produced by:",
      "",
      "```bash",
      "pnpm docs:api",
      "```",
      ""
    ].join("\n");
    await writeFile(fileUrl, content, "utf8");
  }
}

await patchApiReadme();
await patchModules();
await writeApiLandingPages();
