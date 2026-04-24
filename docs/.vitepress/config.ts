import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  title: '@thermal-label/labelmanager',
  description:
    'DYMO D1 label printing for Node.js and the browser — no vendor drivers or software required',
  base: '/labelmanager/',
  ignoreDeadLinks: [
    /^\.\/LICENSE$/,
    /^\.\/(core|node|web)\/dist\/README$/,
    /^\.\/(core|node|web)\/dist\/src\/README$/,
  ],
  themeConfig: {
    nav: [
      { text: 'Get started', link: '/getting-started' },
      { text: 'Node.js', link: '/node' },
      { text: 'Web', link: '/web' },
      { text: 'Core', link: '/core' },
    ],
    sidebar: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Node.js', link: '/node' },
      { text: 'Web', link: '/web' },
      { text: 'Hardware', link: '/hardware' },
      { text: 'Core', link: '/core' },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/thermal-label/labelmanager' }],
    search: { provider: 'local' },
  },
  vite: {
    resolve: {
      alias: {
        '@thermal-label/labelmanager-web': fileURLToPath(
          new URL('../../packages/web/src/index.ts', import.meta.url),
        ),
        '@thermal-label/labelmanager-core': fileURLToPath(
          new URL('../../packages/core/src/index.ts', import.meta.url),
        ),
      },
    },
  },
});
