import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const targetUrl = process.argv[2] ?? "http://127.0.0.1:4175";
const chromePath =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = Number(process.env.CDP_PORT ?? 9223);
const userDataDir = join(tmpdir(), `roomzly-clean-chrome-${port}`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function json(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function connectWebSocket(url) {
  const socket = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const events = [];

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      payload.error ? reject(new Error(payload.error.message)) : resolve(payload.result);
      return;
    }
    events.push(payload);
  });

  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    opened,
    events,
    send(method, params = {}) {
      const messageId = ++id;
      socket.send(JSON.stringify({ id: messageId, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
        setTimeout(() => {
          if (!pending.has(messageId)) return;
          pending.delete(messageId);
          reject(new Error(`${method} timed out`));
        }, 5000);
      });
    },
    close() {
      socket.close();
    },
  };
}

async function waitForDebugger() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      return await json(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome DevTools Protocol did not start.");
}

async function waitForLoad(client) {
  await client.send("Runtime.evaluate", {
    expression: `new Promise((resolve) => {
      if (document.readyState === "complete") resolve(true);
      else {
        window.addEventListener("load", () => resolve(true), { once: true });
        setTimeout(() => resolve(document.readyState), 5000);
      }
    })`,
    awaitPromise: true,
    returnByValue: true,
  });
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime exception");
  }
  return result.result?.value;
}

async function main() {
  console.log(`Probing ${targetUrl} with clean Chrome on CDP port ${port}`);
  await rm(userDataDir, { recursive: true, force: true });
  await mkdir(userDataDir, { recursive: true });

  console.log("Launching Chrome without extensions...");
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--no-first-run",
    "--no-default-browser-check",
    `${targetUrl}/`,
  ], { stdio: "ignore", detached: true });

  chrome.unref();

  console.log("Waiting for Chrome DevTools Protocol...");
  const version = await waitForDebugger();
  console.log("DevTools connected.");
  const tabs = await json(`http://127.0.0.1:${port}/json`);
  const page = tabs.find((tab) => tab.type === "page") ?? tabs[0];
  console.log(`Using tab: ${page.url}`);
  const client = connectWebSocket(page.webSocketDebuggerUrl ?? version.webSocketDebuggerUrl);
  await client.opened;

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  console.log("Waiting for home load...");
  await waitForLoad(client);

  console.log("Evaluating home page...");
  const homeProbe = await evaluate(client, `({
    href: location.href,
    title: document.title,
    inputs: document.querySelectorAll("input, textarea, select").length,
    injectedButtons: [...document.querySelectorAll("button, [role=button]")].map((node) => node.textContent?.trim()).filter(Boolean).slice(-5),
  })`);
  console.log("Home responded:", homeProbe);

  console.log("Focusing first input...");
  await evaluate(client, `
    const input = document.querySelector("input");
    input?.focus();
    input?.dispatchEvent(new InputEvent("input", { bubbles: true, data: "d" }));
    true;
  `);
  const afterInput = await evaluate(client, `({ active: document.activeElement?.tagName, href: location.href, now: Date.now() })`);
  console.log("After input focus responded:", afterInput);

  console.log("Navigating to /explore...");
  await client.send("Page.navigate", { url: `${targetUrl}/explore` });
  await waitForLoad(client);
  await sleep(1500);

  console.log("Evaluating explore page...");
  const exploreProbe = await evaluate(client, `({
    href: location.href,
    title: document.title,
    readyState: document.readyState,
    inputCount: document.querySelectorAll("input, textarea, select").length,
    hasBrainWidget: /brain|free|model|ai/i.test(document.body.innerText),
    buttons: [...document.querySelectorAll("button")].map((node) => node.textContent?.trim()).filter(Boolean).slice(0, 8),
  })`);
  console.log("Explore responded:", exploreProbe);

  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
