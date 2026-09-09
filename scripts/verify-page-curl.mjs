/**
 * Drives the paper-curl interaction in a real browser and writes screenshots so the
 * geometry and shading can be checked, plus asserts the theme actually persists.
 *
 * Usage: `npm run dev` in one terminal, then `node scripts/verify-page-curl.mjs`.
 */
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.CURL_URL ?? "http://localhost:3000/";
const OUT = process.env.CURL_OUT ?? "./.curl-shots";

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--no-sandbox",
    "--hide-scrollbars",
  ],
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const problems = [];
const report = {};

function watch(page) {
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      problems.push(`[${message.type()}] ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`[pageerror] ${error.message}`));
}

function probe() {
  const layer = document.querySelector("[inert]");
  return {
    canvas: Boolean(document.querySelector("canvas")),
    revealTheme: layer?.className.split(" ")[0] ?? null,
    revealClip: layer?.style.clipPath ?? null,
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    stored: localStorage.getItem("theme"),
  };
}

/** Width of the reveal along the top edge, i.e. how much of the sheet has turned. */
function revealReach() {
  const clip = document.querySelector("[inert]")?.style.clipPath ?? "";
  const first = clip.match(/polygon\((-?[\d.]+)px/);
  return first ? Math.round(window.innerWidth - Number(first[1])) : null;
}

/**
 * Force the light theme back on without going through the gesture.
 *
 * The screenshots are far easier to read from a known starting theme: the revealed layer
 * is always the opposite of the current one, so a frame captured mid-sequence can show a
 * dark page with a light reveal and look inverted when nothing is wrong.
 */
async function resetToLight(page) {
  // Clearing the key rather than writing "light" into it, so the reload lands on exactly
  // the same state as a first-ever visit, which the provider resolves to light.
  await page.evaluate(() => localStorage.removeItem("theme"));
  await page.reload({ waitUntil: "networkidle0" });
  await wait(900);
  return page.evaluate(probe);
}

async function drag(page, path, { release = true, trace } = {}) {
  const [start, ...rest] = path;
  await page.mouse.move(start[0], start[1]);
  await page.mouse.down();
  for (const [x, y] of rest) {
    await page.mouse.move(x, y);
    await wait(70);
    if (trace) trace.push(`${x},${y} -> reach ${await page.evaluate(revealReach)}`);
  }
  if (release) {
    await page.mouse.up();
    if (trace) {
      await wait(60);
      const t = await page.evaluate(probe);
      trace.push(`released -> theme ${t.theme}, reach ${await page.evaluate(revealReach)}`);
    }
    await wait(1400);
  }
}

/* ------------------------------------------------------------------- desktop */

const page = await browser.newPage();
watch(page);
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 4 });
await page.goto(URL, { waitUntil: "networkidle0" });
await wait(1200);

const corner = (name, box) => page.screenshot({ path: `${OUT}/${name}.png`, clip: box });

report.idle = await page.evaluate(probe);
await page.screenshot({ path: `${OUT}/00-idle-full.png` });
await corner("01-idle", { x: 1080, y: 0, width: 200, height: 200 });

await page.mouse.move(1240, 40);
await wait(600);
report.hover = await page.evaluate(probe);
await corner("02-hover", { x: 1030, y: 0, width: 250, height: 250 });

// Screenshotting resizes the page, which legitimately cancels a gesture, so each drag
// gets at most one screenshot and the trace runs on its own.
report.dragTrace = [];
await drag(
  page,
  [
    [1274, 6],
    [1250, 30],
    [1210, 70],
    [1170, 110],
    [1080, 200],
    [1000, 300],
    [900, 380],
  ],
  { release: false, trace: report.dragTrace },
);
await page.mouse.up();
await wait(1400);

await resetToLight(page);
await drag(
  page,
  [
    [1274, 6],
    [1250, 30],
    [1210, 70],
    [1170, 110],
  ],
  { release: false },
);
await wait(400);
await corner("03-drag-small", { x: 980, y: 0, width: 300, height: 300 });
await page.mouse.up();
await wait(1400);

await resetToLight(page);
await drag(
  page,
  [
    [1274, 6],
    [1180, 90],
    [1060, 210],
    [960, 320],
  ],
  { release: false },
);
await wait(400);
await corner("04-drag-mid", { x: 640, y: 0, width: 640, height: 640 });
await page.mouse.up();
await wait(1400);

// The revealed copy is a fixed layer, so it has to be offset to match document scroll.
await resetToLight(page);
await page.evaluate(() => window.scrollTo(0, 600));
await wait(300);
await drag(
  page,
  [
    [1274, 6],
    [1180, 90],
    [1060, 210],
    [960, 320],
  ],
  { release: false },
);
await wait(300);
report.scrollSync = await page.evaluate(() => {
  const inner = document.querySelector("[inert] > div");
  return { scrollY: window.scrollY, transform: inner?.style.transform ?? null };
});
await corner("05-scrolled", { x: 640, y: 0, width: 640, height: 640 });
await page.mouse.up();
await wait(1400);
await page.evaluate(() => window.scrollTo(0, 0));
await wait(300);

// Released well short of the threshold: must spring back without changing the theme.
report.beforeSnapBack = await resetToLight(page);
report.snapBackTrace = [];
await drag(
  page,
  [
    [1274, 6],
    [1240, 40],
    [1200, 80],
    [1230, 40],
  ],
  { trace: report.snapBackTrace },
);
report.afterSnapBack = await page.evaluate(probe);

// Released past the threshold: must carry through and persist.
await drag(page, [
  [1274, 6],
  [1180, 90],
  [1000, 260],
  [760, 470],
  [480, 700],
]);
report.afterCommit = await page.evaluate(probe);
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
await page.screenshot({ path: `${OUT}/06-dark-full.png` });
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 4 });
await wait(400);
await corner("07-dark-idle", { x: 1080, y: 0, width: 200, height: 200 });

// And back again.
await drag(page, [
  [1274, 6],
  [1180, 90],
  [1000, 260],
  [760, 470],
  [480, 700],
]);
report.afterReverse = await page.evaluate(probe);

/**
 * A second gesture grabbed while the first is still turning must not queue a second
 * flip. Both are committing pulls, and the second starts immediately after the first is
 * released, so it lands mid commit animation. Exactly one flip should come out.
 *
 * Recorded either side of the second gesture, because one before-and-after reading
 * cannot tell nothing happening apart from it happening twice.
 */
const committingPull = [
  [1274, 6],
  [1100, 160],
  [640, 600],
  [420, 780],
];

report.rapid = { before: (await page.evaluate(probe)).theme };
await drag(page, committingPull, { release: false });
await page.mouse.up();

await page.mouse.move(1274, 6);
await page.mouse.down();
for (const [x, y] of committingPull.slice(1)) {
  await page.mouse.move(x, y);
  await wait(25);
}
await page.mouse.up();
await wait(2200);
report.rapid.afterBoth = (await page.evaluate(probe)).theme;

await page.keyboard.press("Tab");
await wait(150);
report.firstTabStop = await page.evaluate(() =>
  document.activeElement
    ? `${document.activeElement.tagName}: ${document.activeElement.textContent?.trim()}`
    : null,
);

/* -------------------------------------------------------------------- mobile */

const mobile = await browser.newPage();
watch(mobile);
await mobile.setViewport({
  width: 390,
  height: 844,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(URL, { waitUntil: "networkidle0" });
await wait(1200);
await mobile.screenshot({ path: `${OUT}/08-mobile.png` });

await mobile.touchscreen.touchStart(378, 8);
for (const [x, y] of [
  [340, 60],
  [260, 200],
  [160, 400],
  [60, 640],
]) {
  await mobile.touchscreen.touchMove(x, y);
  await wait(70);
}
await mobile.touchscreen.touchEnd();
await wait(1600);
report.mobileAfterSwipe = await mobile.evaluate(probe);

/* ------------------------------------------------------------ reduced motion */

const reduced = await browser.newPage();
watch(reduced);
await reduced.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
await reduced.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
await reduced.goto(URL, { waitUntil: "networkidle0" });
await wait(900);
report.reducedMotionIdle = await reduced.evaluate(probe);

await reduced.mouse.click(1240, 40);
await wait(1400);
report.reducedMotionAfterClick = await reduced.evaluate(probe);

console.log(JSON.stringify(report, null, 2));
console.log("\n--- console output ---");
console.log(problems.length ? problems.join("\n") : "(clean)");

await browser.close();
