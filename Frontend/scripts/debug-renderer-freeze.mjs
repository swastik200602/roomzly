import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const targetUrl = process.argv[2] ?? "http://127.0.0.1:4175/explore";
const chromePath =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = Number(process.env.CDP_PORT ?? 9666);
const headed = process.argv.includes("--headed");
const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg?.slice("--mode=".length) ?? "all";
const userDataDir = join(tmpdir(), `roomzly-freeze-debug-${port}`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function withTimeout(promise, label, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function connectWebSocket(url) {
  const socket = new WebSocket(url);
  let nextId = 0;
  const pending = new Map();
  const eventWaiters = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }

    const waiters = eventWaiters.get(message.method);
    if (!waiters?.length) return;
    eventWaiters.set(
      message.method,
      waiters.filter((waiter) => {
        if (!waiter.predicate(message.params)) return true;
        waiter.resolve(message.params);
        return false;
      }),
    );
  });

  return {
    opened: new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    send(method, params = {}, timeoutMs = 5000) {
      const id = ++nextId;
      socket.send(JSON.stringify({ id, method, params }));
      return withTimeout(
        new Promise((resolve, reject) => pending.set(id, { resolve, reject })),
        method,
        timeoutMs,
      );
    },
    waitForEvent(method, predicate = () => true, timeoutMs = 5000) {
      return withTimeout(
        new Promise((resolve) => {
          const waiters = eventWaiters.get(method) ?? [];
          waiters.push({ predicate, resolve });
          eventWaiters.set(method, waiters);
        }),
        method,
        timeoutMs,
      );
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
      return await getJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome DevTools Protocol did not start.");
}

async function evaluate(client, expression, timeoutMs = 5000) {
  const result = await client.send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    timeoutMs,
  );
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime exception");
  }
  return result.result?.value;
}

function summarizeFrames(callFrames = []) {
  return callFrames.slice(0, 20).map((frame, index) => ({
    index,
    functionName: frame.functionName || "(anonymous)",
    url: frame.url,
    line: frame.location?.lineNumber,
    column: frame.location?.columnNumber,
  }));
}

async function evaluateFrame(client, callFrameId, expression) {
  const result = await client.send(
    "Debugger.evaluateOnCallFrame",
    { callFrameId, expression, returnByValue: true },
    2000,
  );
  if (result.exceptionDetails) return { error: result.exceptionDetails.text };
  return result.result?.value;
}

function domProbeExpression(name) {
  return `(() => {
    const value = typeof ${name} === "undefined" ? undefined : ${name};
    const describeNode = (node) => {
      if (!node || typeof node !== "object") return node;
      const reactKeys = Object.keys(node).filter((key) => key.startsWith("__react"));
      let previousSiblingCount = 0;
      let previous = node.previousSibling;
      while (previous && previousSiblingCount < 2000) {
        previousSiblingCount += 1;
        previous = previous.previousSibling;
      }
      return {
        nodeType: node.nodeType,
        nodeName: node.nodeName,
        tagName: node.tagName,
        id: node.id,
        className: typeof node.className === "string" ? node.className.slice(0, 200) : String(node.className ?? ""),
        data: node.data,
        textContent: node.textContent?.slice(0, 120),
        value: node.value,
        type: node.type,
        parentNodeName: node.parentNode?.nodeName,
        parentTagName: node.parentElement?.tagName,
        parentId: node.parentElement?.id,
        parentClassName: node.parentElement?.className,
        previousSiblingCount,
        previousSiblingScanTerminated: previous === null,
        reactKeys,
      };
    };

    if (value && typeof Event !== "undefined" && value instanceof Event) {
      return {
        eventType: value.type,
        target: describeNode(value.target),
        currentTarget: describeNode(value.currentTarget),
        relatedTarget: describeNode(value.relatedTarget),
      };
    }

    return describeNode(value);
  })()`;
}

async function main() {
  await rm(userDataDir, { recursive: true, force: true });
  await mkdir(userDataDir, { recursive: true });

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
  ];

  if (!headed) args.push("--headless=new");
  args.push(targetUrl);

  console.log(`Launching ${headed ? "headed" : "headless"} Chrome at ${targetUrl}`);
  const chrome = spawn(chromePath, args, { stdio: "ignore" });

  try {
    await waitForDebugger();
    const tabs = await getJson(`http://127.0.0.1:${port}/json`);
    const page = tabs.find((tab) => tab.type === "page");
    if (!page?.webSocketDebuggerUrl) throw new Error("No debuggable page target found.");

    const client = connectWebSocket(page.webSocketDebuggerUrl);
    await client.opened;
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Debugger.enable");
    await client.send("Profiler.enable");

    await client.waitForEvent("Page.loadEventFired", undefined, 15000).catch(() => undefined);
    await sleep(1500);

    const before = await evaluate(
      client,
      `({
        href: location.href,
        readyState: document.readyState,
        title: document.title,
        inputs: document.querySelectorAll("input, textarea, select").length,
        rootChildTags: [...document.getElementById("root")?.children ?? []].map((node) => node.tagName),
        nestedDocumentTags: document.querySelectorAll("#root html, #root head, #root body").length,
        firstInputProbe: (() => {
          const input = document.querySelector("input");
          if (!input) return null;
          const reactKeys = (node) => Object.keys(node).filter((key) => key.startsWith("__react"));
          let previousSiblingCount = 0;
          let previous = input.previousSibling;
          while (previous && previousSiblingCount < 1000) {
            previousSiblingCount += 1;
            previous = previous.previousSibling;
          }
          return {
            tag: input.tagName,
            type: input.type,
            parentTag: input.parentElement?.tagName,
            inputReactKeys: reactKeys(input),
            parentReactKeys: input.parentElement ? reactKeys(input.parentElement) : [],
            previousSiblingCount,
            previousSiblingScanTerminated: previous === null,
          };
        })(),
        rootHtml: document.getElementById("root")?.outerHTML.slice(0, 1000),
        bodyText: document.body.innerText.slice(0, 500),
      })`,
      5000,
    );
    console.log("Before interaction:", before);

    await client.send("Profiler.start");

    console.log(`Running interaction mode: ${mode}`);
    const interaction = await evaluate(
      client,
      `(() => {
        const mode = ${JSON.stringify(mode)};
        const input = document.querySelector("input");
        if (mode === "nav") {
          const link = document.querySelector('a[href="/explore"]');
          if (!link) return { ok: false, reason: "no explore link" };
          link.click();
          return { ok: true, mode, href: location.href, text: link.textContent?.trim() };
        }

        if (!input) return { ok: false, reason: "no input" };
        const rect = input.getBoundingClientRect();
        const point = { bubbles: true, clientX: rect.left + 20, clientY: rect.top + rect.height / 2 };

        if (mode === "focus" || mode === "all") input.focus();
        if (mode === "pointer" || mode === "all") {
          input.dispatchEvent(new PointerEvent("pointerdown", point));
          input.dispatchEvent(new PointerEvent("pointerup", point));
        }
        if (mode === "mouse" || mode === "all") {
          input.dispatchEvent(new MouseEvent("mousedown", point));
          input.dispatchEvent(new MouseEvent("mouseup", point));
        }
        if (mode === "click" || mode === "all") {
          input.dispatchEvent(new MouseEvent("click", point));
        }
        if (mode === "input") {
          input.value = "test";
          input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "test", inputType: "insertText" }));
        }

        return { ok: true, mode, active: document.activeElement === input, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
      })()`,
      5000,
    );
    console.log("Interaction returned:", interaction);

    await sleep(2500);

    let responsive = false;
    try {
      const heartbeat = await evaluate(client, `({ now: Date.now(), active: document.activeElement?.tagName })`, 2000);
      responsive = true;
      console.log("Heartbeat after interaction:", heartbeat);
    } catch (error) {
      console.log("Heartbeat failed:", error.message);
    }

    if (!responsive) {
      console.log("Renderer looks busy. Asking debugger to pause...");
      await client.send("Debugger.pause", {}, 5000).catch((error) => {
        console.log("Debugger.pause failed:", error.message);
      });
      const paused = await client.waitForEvent("Debugger.paused", undefined, 5000).catch(() => null);
      if (paused) {
        console.log("Paused call frames:", summarizeFrames(paused.callFrames));
        for (const frame of paused.callFrames.slice(0, 5)) {
          console.log(`Frame probe: ${frame.functionName || "(anonymous)"}`);
          for (const name of ["n", "a", "s", "c", "d", "p", "v", "w"]) {
            const value = await evaluateFrame(client, frame.callFrameId, domProbeExpression(name)).catch(
              (error) => ({ error: error.message }),
            );
            console.log(`  ${name}:`, value);
          }
        }
        await client.send("Debugger.resume", {}, 2000).catch(() => undefined);
      } else {
        console.log("Debugger did not pause; the hang may be browser rendering/native code, not JS.");
      }
    }

    const profile = await client.send("Profiler.stop", {}, 5000).catch((error) => {
      console.log("Profiler.stop failed:", error.message);
      return null;
    });
    if (profile?.profile?.nodes) {
      const hot = profile.profile.nodes
        .map((node) => ({
          id: node.id,
          hitCount: node.hitCount ?? 0,
          functionName: node.callFrame?.functionName || "(anonymous)",
          url: node.callFrame?.url || "",
          line: node.callFrame?.lineNumber,
        }))
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, 20);
      console.log("Profiler hot nodes:", hot);
    }

    client.close();
  } finally {
    chrome.kill();
    await rm(userDataDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
