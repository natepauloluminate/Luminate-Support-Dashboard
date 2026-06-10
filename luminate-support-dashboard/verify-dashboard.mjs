import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

// ── Overview ────────────────────────────────────────────────
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const overviewShot = await page.screenshot({ path: 'verify-overview.png', fullPage: true });

// Check background colour
const bodyBg = await page.evaluate(() =>
  getComputedStyle(document.body).backgroundColor
);
console.log('body bg:', bodyBg);

// Count MetricCards (grid cells in main)
const cardCount = await page.locator('main > div').count();
console.log('card count:', cardCount);

// Check gradient rule (should be between header bar and filterbar)
const gradientEl = await page.locator('div[style*="linear-gradient"]').first();
const gradientBg = await gradientEl.evaluate(el => el.style.background);
console.log('gradient rule:', gradientBg.substring(0, 80));

// Check active tab is purple
const activeTab = await page.locator('button:has-text("Overview")');
const tabBg = await activeTab.evaluate(el => el.style.background);
console.log('overview tab bg:', tabBg);

// Check row 1 card border-top (purple)
const firstCard = await page.locator('main > div').first();
const firstBorderTop = await firstCard.evaluate(el => el.style.borderTop);
console.log('row1 card borderTop:', firstBorderTop);

// Check row 2 card border-top (cyan) — index 4
const row2Card = await page.locator('main > div').nth(4);
const row2BorderTop = await row2Card.evaluate(el => el.style.borderTop);
console.log('row2 card borderTop:', row2BorderTop);

// Check card 11 for tech badge with david.heerse
const techBadgeText = await page.locator('main > div').nth(10).textContent();
console.log('card 11 contains david.heerse:', techBadgeText.includes('david.heerse'));

// Check card 12 for "none" muted badge
const card12Text = await page.locator('main > div').nth(11).textContent();
console.log('card 12 contains "none":', card12Text.includes('none'));

// Check no horizontal scrollbar
const hasHScroll = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth
);
console.log('has horizontal scroll:', hasHScroll);

// ── Analytics ───────────────────────────────────────────────
await page.click('button:has-text("Analytics")');
await page.waitForTimeout(800);
const analyticsShot = await page.screenshot({ path: 'verify-analytics.png', fullPage: true });

// Check analytics tab is now active
const analyticsTab = await page.locator('button:has-text("Analytics")');
const analyticsTabBg = await analyticsTab.evaluate(el => el.style.background);
console.log('analytics tab bg:', analyticsTabBg);

// Check 4 chart sections (1 full width + 3 in a grid)
const chartCards = await page.locator('main [style*="borderTop: 2px solid rgb(124, 58, 237)"]').count();
console.log('chart cards with purple accent:', chartCards);

// Donut center total
const donutCenter = await page.locator('text=2,647').first();
const donutVisible = await donutCenter.isVisible().catch(() => false);
console.log('donut center 2,647 visible:', donutVisible);

await browser.close();
console.log('Screenshots saved: verify-overview.png, verify-analytics.png');
