import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../exports/hifi');
const base = process.env.ACCESSFLOW_BASE || 'http://127.0.0.1:5173';

async function seed(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('accessflow.p03.confirmed', '1');
    localStorage.setItem('accessflow-p02-info-dismissed', '1');
    localStorage.setItem('accessflow-p03-info-dismissed', '1');
    localStorage.setItem('accessflow-p04-info-dismissed', '1');
    localStorage.setItem('accessflow-p05-info-dismissed', '1');
  });
}

async function blockF01Nav(page) {
  await page.evaluate(() => {
    const block = (url) => String(url || '').includes('/f01');
    const replace = window.history.replaceState.bind(window.history);
    window.history.replaceState = (...args) => {
      if (block(args[2])) return;
      return replace(...args);
    };
    const push = window.history.pushState.bind(window.history);
    window.history.pushState = (...args) => {
      if (block(args[2])) return;
      return push(...args);
    };
  });
}

async function shot(page, name) {
  await page.waitForSelector('.ds-page-title', { timeout: 15000 });
  await page.waitForTimeout(500);

  const height = await page.evaluate(() => {
    const content = document.querySelector('main.content');
    const layout = document.querySelector('.side-layout');
    const h = Math.max(
      content?.scrollHeight || 0,
      layout?.scrollHeight || 0,
      document.documentElement.scrollHeight,
      900,
    );
    return Math.min(h + 48, 8000);
  });
  await page.setViewportSize({ width: 1440, height });
  await page.waitForTimeout(300);

  const title = await page.locator('.ds-page-title').first().innerText();
  console.log(`${name} → ${title} (${height}px)`);
  const file = path.join(outDir, `${name}.png`);
  await page.locator('.side-layout').screenshot({ path: file, type: 'png' });
  console.log('saved', file);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await seed(page);

  await page.goto(`${base}/plan`, { waitUntil: 'networkidle' });
  await shot(page, 'P-02-开通方案审阅');

  await page.goto(`${base}/confirm`, { waitUntil: 'networkidle' });
  await shot(page, 'P-03-权限与执行确认');

  await page.goto(`${base}/progress`, { waitUntil: 'domcontentloaded' });
  await blockF01Nav(page);
  await page.waitForTimeout(2500);
  await shot(page, 'P-04-执行进度');

  await page.goto(`${base}/f01`, { waitUntil: 'networkidle' });
  await shot(page, 'P-05-执行结果-F01');

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
