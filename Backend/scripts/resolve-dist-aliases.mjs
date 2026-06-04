import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const aliasPattern = /((?:from\s*)|(?:import\s*\(\s*))(["'])@\/([^"']+)\2/g;

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listJavaScriptFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
    }),
  );
  return files.flat();
}

function toRuntimeSpecifier(filePath, aliasedPath) {
  const targetPath = path.join(dist, aliasedPath);
  const relativePath = path.relative(path.dirname(filePath), targetPath).replaceAll(path.sep, "/");
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

for (const filePath of await listJavaScriptFiles(dist)) {
  const source = await readFile(filePath, "utf8");
  const next = source.replace(aliasPattern, (match, prefix, quote, aliasedPath) => {
    return `${prefix}${quote}${toRuntimeSpecifier(filePath, aliasedPath)}${quote}`;
  });
  if (next !== source) await writeFile(filePath, next);
}

