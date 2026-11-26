import { writeFileSync } from "node:fs";

const [, , url, out, optsJson] = process.argv;
const opts = JSON.parse(optsJson || "{}");
const width = opts.width || 1440;
const height = opts.height || 1000;
const scrollY = opts.scrollY || 0;
const fullPage = !!opts.fullPage;
const port = opts.port || 9223;

const res = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
if (!res.ok) throw new Error("Could not create target: " + res.status);
const target = await res.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let id = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url });

  // Wait for document ready
  for (let i = 0; i < 80; i++) {
    await sleep(150);
    const r = await send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true,
    });
    if (r.result.value === "complete") break;
  }
  await send("Runtime.evaluate", {
    expression: "document.fonts ? document.fonts.ready.then(() => true) : true",
    awaitPromise: true,
    returnByValue: true,
  });
  await sleep(700);

  // Reveal everything and disable smooth scrolling
  await send("Runtime.evaluate", {
    expression: `
      document.documentElement.style.scrollBehavior = 'auto';
      document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-in'));
      document.querySelectorAll('iframe').forEach(f => { try { f.contentWindow.scrollTo(0,0); } catch(e){} });
      true;
    `,
    returnByValue: true,
  });
  await sleep(250);

  if (scrollY) {
    await send("Runtime.evaluate", {
      expression: `window.scrollTo(0, ${scrollY}); true;`,
      returnByValue: true,
    });
    await sleep(500);
  }

  let params = { format: "png", captureBeyondViewport: fullPage };
  if (fullPage) {
    const metrics = await send("Page.getLayoutMetrics");
    const h = Math.min(Math.ceil(metrics.cssContentSize.height), 16000);
    params.clip = { x: 0, y: 0, width, height: h, scale: 1 };
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: h,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(500);
  }
  const shot = await send("Page.captureScreenshot", params);
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log("wrote", out);
} finally {
  ws.close();
  try {
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  } catch {}
}
