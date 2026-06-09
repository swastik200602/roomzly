import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist", "client");
const indexPath = join(distDir, "index.html");
const deployedUrl = process.argv[2]?.replace(/\/$/, "");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

async function listFiles(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(full, rel);
      const info = await stat(full);
      return [{ rel, size: info.size }];
    }),
  );
  return files.flat();
}

function printHeaders(headers) {
  const interesting = [
    "cache-control",
    "content-type",
    "cross-origin-opener-policy",
    "etag",
    "last-modified",
  ];
  for (const key of interesting) {
    const value = headers.get(key);
    if (value) console.log(`  ${key}: ${value}`);
  }
}

const localIndex = await readFile(indexPath, "utf8");
const localScripts = [...localIndex.matchAll(/src="([^"]+\.js)"/g)].map((match) => match[1]);
const localStyles = [...localIndex.matchAll(/href="([^"]+\.css)"/g)].map((match) => match[1]);
const files = await listFiles(distDir);
const total = files.reduce((sum, file) => sum + file.size, 0);
const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 12);

console.log("Firebase build inspection");
console.log(`Local dist: ${distDir}`);
console.log(`Total files: ${files.length}`);
console.log(`Total size: ${formatBytes(total)}`);
console.log(`index.html sha256: ${sha256(localIndex)}`);
console.log("");
console.log("Entrypoints from local index.html:");
for (const file of [...localScripts, ...localStyles]) console.log(`  ${file}`);
console.log("");
console.log("Largest local files:");
for (const file of largest) console.log(`  ${formatBytes(file.size).padStart(9)}  ${file.rel}`);

if (deployedUrl) {
  console.log("");
  console.log(`Deployed checks for ${deployedUrl}`);
  const routes = ["/", "/explore", "/auth/login"];

  for (const route of routes) {
    const response = await fetch(`${deployedUrl}${route}`, { cache: "no-store" });
    const text = await response.text();
    const scripts = [...text.matchAll(/src="([^"]+\.js)"/g)].map((match) => match[1]);
    console.log(`${route}: ${response.status} index sha256 ${sha256(text)}`);
    printHeaders(response.headers);
    if (scripts.length) console.log(`  scripts: ${scripts.join(", ")}`);
  }

  const mainScript = localScripts[0];
  if (mainScript) {
    const response = await fetch(`${deployedUrl}${mainScript}`, { method: "HEAD", cache: "no-store" });
    console.log(`${mainScript}: ${response.status}`);
    printHeaders(response.headers);
  }
}
