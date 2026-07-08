import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

function frame(content, bg = "#f5f2eb") {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#ddd9d0"/>
      </linearGradient>
      <pattern id="paper" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.5" fill="#111" opacity=".06"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#paper)"/>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = wrap(subtitle, 35);
  return `
    <text x="72" y="110" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#666">BASE PROOF BOOTH</text>
    <text x="72" y="232" font-family="Arial, sans-serif" font-size="92" font-weight="900" fill="#151515">${esc(title)}</text>
    ${lines.map((line, index) => `<text x="76" y="${308 + index * 44}" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#555">${esc(line)}</text>`).join("")}
  `;
}

function pill(x, y, text, fill, fg = "#151515") {
  return `
    <rect x="${x}" y="${y}" rx="28" width="${text.length * 16 + 70}" height="56" fill="${fill}" stroke="#151515" stroke-width="3"/>
    <text x="${x + 30}" y="${y + 37}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function receipt(x, y, width, height, title, lines, dark = false) {
  const bg = dark ? "#151515" : "#fffdf8";
  const fg = dark ? "#fff" : "#151515";
  const sub = dark ? "#eee" : "#555";
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="${bg}" stroke="#151515" stroke-width="4"/>
      <text x="${x + 24}" y="${y + 52}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${sub}">${esc(title)}</text>
      ${lines.map((line, index) => `<text x="${x + 24}" y="${y + 112 + index * 38}" font-family="Arial, sans-serif" font-size="32" font-weight="${index === 0 ? 900 : 700}" fill="${index === 0 ? fg : sub}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function button(x, y, width, text, fill, fg = "#151515") {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="96" rx="48" fill="${fill}" stroke="#151515" stroke-width="4"/>
    <text x="${x + width / 2}" y="${y + 61}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function screenshot1() {
  const content = `
    ${header("Print a proof slip.", "Write one short statement, send it onchain, and keep a receipt that can be looked up later.")}
    ${pill(72, 408, "Printer flow", "#fff")}
    ${pill(250, 408, "One receipt", "#f1d6a8")}
    ${receipt(72, 540, 1140, 286, "Print proof", ["Title: Builder promise", "Statement: I will ship the thing, not just talk about it."], false)}
    ${receipt(72, 872, 548, 246, "Why it works", ["Clean one-line commitment", "Timestamped proof receipt"], false)}
    ${receipt(664, 872, 548, 246, "Proof rules", ["One title", "One statement", "One onchain receipt"], true)}
    ${receipt(72, 1166, 1140, 290, "Receipt preview", ["Author: 0x9936...9652", "Date: May 13, 2026", "Status: ready to print"], true)}
    ${button(72, 2522, 1140, "Print on Base", "#151515", "#fff")}
  `;
  return frame(content);
}

function screenshot2() {
  const content = `
    ${header("The receipt is live.", "After printing, the proof feels like a real booth receipt: compact, readable, and easy to verify.")}
    ${pill(72, 408, "Receipt view", "#f1d6a8")}
    ${pill(230, 408, "Printed on Base", "#fff")}
    ${receipt(72, 540, 1140, 312, "Proof receipt", ["Builder promise", "I will ship the thing, not just talk about it.", "Author: 0x9936...9652"], true)}
    ${receipt(72, 896, 548, 238, "Timestamp", ["May 13, 2026", "Stored onchain"], false)}
    ${receipt(664, 896, 548, 238, "Receipt state", ["Visible", "Lookup ready"], false)}
    ${receipt(72, 1180, 1140, 286, "Booth status", ["The proof receipt is now part of the Base record.", "It can be loaded again by ID."], false)}
    ${button(72, 2522, 1140, "Load receipt", "#f1d6a8")}
  `;
  return frame(content, "#efe8db");
}

function screenshot3() {
  const content = `
    ${header("Look up one proof.", "Users can retrieve a receipt by ID and see exactly who said what and when it was printed.")}
    ${pill(72, 408, "Proof ID 12", "#fff")}
    ${pill(242, 408, "Lookup mode", "#f1d6a8")}
    ${receipt(72, 540, 1140, 286, "Proof lookup", ["Title: Builder promise", "Author: 0x9936...9652", "Date: May 13, 2026"], false)}
    ${receipt(72, 872, 1140, 276, "Statement", ["I will ship the thing, not just talk about it, and I want the receipt to prove I said that out loud."], true)}
    ${receipt(72, 1188, 548, 238, "Lookup state", ["Receipt found", "Printable record"], false)}
    ${receipt(664, 1188, 548, 238, "Booth note", ["A compact onchain proof slip", "Easy to scan on mobile"], false)}
    ${button(72, 2522, 1140, "Print another proof", "#151515", "#fff")}
  `;
  return frame(content, "#f2ede5");
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#f5f2eb"/>
    <rect x="138" y="138" width="748" height="748" rx="96" fill="#fffdf8" stroke="#151515" stroke-width="22"/>
    <rect x="224" y="220" width="576" height="240" rx="24" fill="#151515"/>
    <rect x="224" y="500" width="576" height="188" rx="20" fill="#f1d6a8" stroke="#151515" stroke-width="14"/>
    <rect x="224" y="724" width="576" height="86" rx="18" fill="#fff" stroke="#151515" stroke-width="14"/>
    <path d="M282 558h460" stroke="#151515" stroke-width="16" stroke-linecap="round"/>
    <path d="M282 616h316" stroke="#151515" stroke-width="16" stroke-linecap="round"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f5f2eb"/>
        <stop offset="100%" stop-color="#ddd9d0"/>
      </linearGradient>
    </defs>
    <rect width="1910" height="1000" fill="url(#bg)"/>
    <text x="96" y="198" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="#151515">Base Proof Booth</text>
    <text x="100" y="292" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#555">Print one statement, keep the receipt, and look it up later on Base.</text>
    ${pill(100, 348, "Thermal receipt", "#f1d6a8")}
    ${pill(340, 348, "Proof lookup", "#fff")}
    ${button(100, 448, 430, "Print proof", "#151515", "#fff")}
    ${button(560, 448, 430, "Load receipt", "#f1d6a8")}
    ${receipt(1186, 124, 624, 250, "Live proof", ["Builder promise", "May 13, 2026", "Author: 0x9936...9652"], true)}
    ${receipt(1186, 420, 624, 250, "Lookup mode", ["Receipt remains readable", "Clean mobile verification"], false)}
    ${receipt(1186, 734, 624, 180, "Booth style", ["Minimal, printed, and clearly unlike the wall/pasteboard apps"], false)}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

for (const file of files) {
  console.log(file);
}
