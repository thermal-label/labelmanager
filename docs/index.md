---
layout: home

hero:
  name: labelmanager
  text: TypeScript driver for DYMO D1 label printers
  tagline: Node.js · CLI · Browser — one protocol, three ways to print
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/thermal-label/labelmanager

features:
  - icon: 🟢
    title: Node.js
    details: Direct USB printing from Node.js server, desktop, and backend apps. Print text and images with a single async call.
    link: /node
    linkText: Node.js guide
  - icon: ⌨️
    title: CLI
    details: One-line label printing from the terminal. Great for scripting, cron jobs, ad-hoc labels, and Linux udev setup.
    link: /cli
    linkText: CLI guide
  - icon: 🌐
    title: Browser
    details: WebUSB printing directly from Chrome or Edge — no server, no native dependencies. Same protocol, pure web stack.
    link: /web
    linkText: Web guide
---

<div class="home-extra">

<div class="ref-links">
  <a href="/hardware" class="ref-link">
    <span class="ref-icon">🖨️</span>
    <span class="ref-body">
      <strong>Supported hardware</strong>
      <span>Device list, USB PIDs, tape widths</span>
    </span>
    <span class="ref-arrow">→</span>
  </a>
  <a href="/core" class="ref-link">
    <span class="ref-icon">📡</span>
    <span class="ref-body">
      <strong>Protocol & Core API</strong>
      <span>ESC sequences, bitmap encoding, porting guide</span>
    </span>
    <span class="ref-arrow">→</span>
  </a>
</div>

## Try it in your browser

<LiveDemo />

</div>
