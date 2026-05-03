---
layout: home

hero:
  name: '@thermal-label/labelmanager'
  text: DYMO D1 label printing without the bloat
  tagline: No vendor software. No proprietary drivers. Just USB, TypeScript, and a clean API — from Node.js or the browser.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: brand
      text: Try it now →
      link: /demo
    - theme: alt
      text: GitHub
      link: https://github.com/thermal-label/labelmanager

features:
  - icon: 🟢
    title: Node.js
    details: Direct USB bulk-transfer printing from Node.js servers and desktop apps. Zero native dependencies beyond the usb package.
    link: /node
    linkText: Node.js guide
  - icon: 🌐
    title: Browser
    details: WebUSB printing directly from Chrome or Edge — no server, no install, no driver swap required.
    link: /web
    linkText: Web guide
  - icon: 🔌
    title: PrinterAdapter
    details: The node and web packages share the same PrinterAdapter interface. Wire once, swap transports without changing call sites.
    link: /core
    linkText: Core & protocol
---

<div class="home-extra">

<div class="ref-links">
  <a href="./hardware.html" class="ref-link">
    <span class="ref-icon">🖨️</span>
    <span class="ref-body">
      <strong>Supported hardware</strong>
      <span>Device list, USB PIDs, tape widths</span>
    </span>
    <span class="ref-arrow">→</span>
  </a>
  <a href="./protocol.html" class="ref-link">
    <span class="ref-icon">📡</span>
    <span class="ref-body">
      <strong>D1 tape protocol</strong>
      <span>USB topology, ESC sequences, status bits, porting guide</span>
    </span>
    <span class="ref-arrow">→</span>
  </a>
  <a href="./core.html" class="ref-link">
    <span class="ref-icon">🧰</span>
    <span class="ref-body">
      <strong>Core API</strong>
      <span>Encoder, parser, types, registries</span>
    </span>
    <span class="ref-arrow">→</span>
  </a>
</div>

<div class="ecosystem">
  <p class="ecosystem-label">Also in this ecosystem</p>
  <div class="ecosystem-links">
    <a href="https://thermal-label.github.io/labelwriter/" class="ecosystem-link" target="_blank" rel="noopener">
      <span class="eco-name">labelwriter</span>
      <span class="eco-desc">DYMO LabelWriter series</span>
    </a>
    <a href="https://thermal-label.github.io/brother-ql/" class="ecosystem-link" target="_blank" rel="noopener">
      <span class="eco-name">brother-ql</span>
      <span class="eco-desc">Brother QL label printers</span>
    </a>
  </div>
</div>

</div>
