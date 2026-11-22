import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const [base, out] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const report = [];
try {
  for (const width of [1360, 760, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 940 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.url()); });
    page.on('requestfailed', r => errors.push(r.url()));
    await page.goto(base + '/assets/labs/convex-hull.html', { waitUntil: 'networkidle' });
    const canvas = page.locator('#scene');
    const play = page.getByRole('button', { name: 'Play', exact: true });
    const step = page.getByRole('button', { name: 'Step frame', exact: true });
    await play.waitFor();
    assert.equal(await canvas.getAttribute('data-wireframes'), 'false');
    assert.equal(await canvas.getAttribute('data-boxes'), 'false');
    assert.match(await page.locator('#summary').textContent(), /[1-9]\d* box-only hits avoided · 60 pairs/);
    const pixels = () => canvas.evaluate(node => node.toDataURL());
    const original = await pixels();
    const wireframes = page.getByRole('checkbox', { name: 'Hulls and normals' });
    await wireframes.focus();
    await page.keyboard.press('Space');
    assert.equal(await canvas.getAttribute('data-wireframes'), 'true');
    const outlined = await pixels();
    assert.notEqual(outlined, original);
    await page.getByRole('checkbox', { name: 'Minimum boxes' }).check();
    assert.equal(await canvas.getAttribute('data-boxes'), 'true');
    assert.notEqual(await pixels(), outlined);

    let frame = Number(await canvas.getAttribute('data-frame'));
    await step.click();
    assert.equal(Number(await canvas.getAttribute('data-frame')), frame + 1);
    await play.click();
    assert.ok(await step.isDisabled());
    await page.waitForFunction(n => +document.querySelector('#scene').dataset.frame > n, frame + 3);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    frame = Number(await canvas.getAttribute('data-frame'));
    await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))));
    assert.equal(Number(await canvas.getAttribute('data-frame')), frame);

    await page.getByRole('button', { name: 'Measure 60 pairs' }).click();
    const measured = await page.locator('#timings').textContent();
    const match = /60 pairs × (\d+) batches · median ([\d.]+) ms · p95 ([\d.]+) ms · (\d+) contacts/.exec(measured);
    assert.ok(match, measured);
    const [, batches, rawMedianMs, rawP95Ms, contacts] = match;
    assert.equal(Number(batches), 240);
    assert.ok(Number(rawP95Ms) < 1, measured);
    assert.ok(Number(contacts) > 1000);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    if (width === 1360 || width === 390) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: out + '/lab-' + width + '.png', animations: 'disabled' });
    }
    report.push({ width, batches: Number(batches), pairs: 60, medianMs: Number(rawMedianMs), p95Ms: Number(rawP95Ms),
      hits: Number(contacts), overlayPixelsChanged: true, keyboardToggle: true, framePauseAndStep: true, errors });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(out + '/report.json', JSON.stringify({ hardware: process.env.HARDWARE_LABEL, samples: report }, null, 2) + '\n');
