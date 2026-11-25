/**
 * axe-Prüfung der AMPEL-UI in allen Ansichten und Zuständen.
 *
 * Voraussetzung: Produktions-Build (`npm run build`).
 * Start: `npm run a11y` (baut vorher) oder `node a11y/axe.mjs`.
 * Browser: Playwright-Chromium; mit A11Y_BROWSER_CHANNEL=chrome das installierte Chrome.
 */
/* global console, customElements, document, process, setTimeout */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

import { startMockBackend } from './mock-backend.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOCK_PORT = 4510;
const APP_PORT = 4511;
const APP = `http://127.0.0.1:${APP_PORT}`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const APP_SUFFIX = ' – AMPEL-CDSS';

/** Fokussiertes Element inklusive Shadow-DOM, als lesbare Kurzbeschreibung. */
const focused = (page) =>
  page.evaluate(() => {
    let el = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    const host = el?.getRootNode()?.host;
    return `${host?.tagName.toLowerCase() ?? ''}>${el?.tagName.toLowerCase()}:${(el?.getAttribute('aria-label') ?? el?.textContent ?? '').trim().slice(0, 40)}`;
  });

const openDetails = async (page) => {
  await page.getByRole('button', { name: /Details zu AKI anzeigen/ }).click();
  await page.getByRole('table', { name: 'Messwerte im Verlauf' }).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(300);
};

const scenarios = [
  { name: 'Übersicht', url: '/alerts/cases/ok' },
  {
    name: 'Übersicht, unauffällige Zustände aufgeklappt',
    url: '/alerts/cases/ok',
    act: async (page) => {
      await page
        .locator('kol-details')
        .getByText(/Unauffällige Zustände/)
        .click();
      await page.getByRole('heading', { name: 'Anämie' }).waitFor();
    },
  },
  {
    name: 'Detailansicht mit Tabelle',
    url: '/alerts/cases/ok',
    act: async (page, issues) => {
      await openDetails(page);
      const target = await focused(page);
      if (!target.startsWith('kol-input-checkbox>input')) {
        issues.push(
          `Fokus nach Öffnen liegt auf ${target}, erwartet: Schalter „Als Diagramm anzeigen“`,
        );
      }
    },
  },
  {
    name: 'Detailansicht per Escape schließen',
    url: '/alerts/cases/ok',
    act: async (page, issues) => {
      await openDetails(page);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      if (await page.getByRole('table', { name: 'Messwerte im Verlauf' }).count()) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      if (await page.getByRole('dialog').count()) issues.push('Drawer schließt nicht per Escape');
      const target = await focused(page);
      if (!target.includes('Details zu AKI anzeigen')) {
        issues.push(`Fokus nach Schließen liegt auf ${target}, erwartet: auslösender Button`);
      }
    },
  },
  {
    name: 'Detailansicht mit Diagramm',
    url: '/alerts/cases/ok',
    act: async (page) => {
      await openDetails(page);
      await page.getByRole('checkbox', { name: 'Als Diagramm anzeigen' }).click();
      await page.locator('.recharts-wrapper').waitFor();
    },
  },
  {
    name: 'Ladezustand',
    url: '/alerts/cases/slow',
    waitUntil: 'commit',
    act: async (page, issues) => {
      const status = page.getByRole('status').filter({ hasText: /geladen/ });
      await status.first().waitFor({ timeout: 3_000 });
      if (!(await status.first().isVisible())) issues.push('Ladehinweis ist nicht sichtbar');
    },
    skipStructureChecks: true,
  },
  {
    name: 'Übersicht, Handy (390 px)',
    url: '/alerts/cases/ok',
    viewport: { width: 390, height: 844 },
  },
  {
    name: 'Detailansicht, Handy (390 px)',
    url: '/alerts/cases/ok',
    viewport: { width: 390, height: 844 },
    act: openDetails,
  },
  { name: 'Keine CDSS-Daten', url: '/alerts/cases/empty' },
  { name: 'Patientendaten 400', url: '/alerts/cases/meta-400' },
  { name: 'Patientendaten 502', url: '/alerts/cases/meta-502' },
  { name: 'Ergebnisse 401', url: '/alerts/cases/alerts-401' },
  { name: 'Ergebnisse 403', url: '/alerts/cases/alerts-403' },
  { name: 'Ergebnisse 404', url: '/alerts/cases/alerts-404' },
  { name: 'Ergebnisse 408', url: '/alerts/cases/alerts-408' },
  { name: 'Ergebnisse 429', url: '/alerts/cases/alerts-429' },
  { name: 'Ergebnisse 500', url: '/alerts/cases/alerts-500' },
  { name: 'Ergebnisse 503', url: '/alerts/cases/alerts-503' },
  { name: 'Unbekannte Adresse', url: '/gibt/es/nicht' },
];

function waitForPort(port, timeoutMs = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`Port ${port} nicht erreichbar`));
        else setTimeout(tryConnect, 250);
      });
    };
    tryConnect();
  });
}

function startApp() {
  const child = spawn(
    process.execPath,
    [path.join(ROOT, 'node_modules/@react-router/serve/bin.js'), 'build/server/index.js'],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(APP_PORT),
        HOST: '127.0.0.1',
        BASE_API_URL: `http://127.0.0.1:${MOCK_PORT}`,
        HEADER_TICKET_LINK: 'https://example.org/stoermeldung',
        HEADER_INSTRUCTIONS_LINK: 'https://example.org/gebrauchsanweisung.pdf',
        HEADER_CONTACT_PHONE: '0341 97-12345',
        HEADER_MT_NUMBER: 'MT-0815',
      },
      stdio: ['ignore', 'ignore', 'inherit'],
    },
  );
  return child;
}

async function main() {
  const mock = await startMockBackend(MOCK_PORT);
  const app = startApp();
  const results = [];

  try {
    await waitForPort(APP_PORT);
    const browser = await chromium.launch({ channel: process.env.A11Y_BROWSER_CHANNEL });

    for (const scenario of scenarios) {
      const context = await browser.newContext({
        locale: 'de-DE',
        viewport: scenario.viewport ?? { width: 1280, height: 900 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));

      await page.goto(APP + scenario.url, { waitUntil: scenario.waitUntil ?? 'networkidle' });
      if (scenario.waitUntil !== 'commit') {
        await page.waitForFunction(() => customElements.get('kol-heading') !== undefined, null, {
          timeout: 10_000,
        });
        await page.waitForTimeout(500);
      }
      if (scenario.act) {
        try {
          await scenario.act(page, errors);
        } catch (error) {
          errors.push(`Interaktion fehlgeschlagen: ${String(error).split('\n')[0]}`);
        }
      }
      await page.waitForTimeout(300);

      if (!scenario.skipStructureChecks) {
        const h1 = await page.getByRole('heading', { level: 1 }).count();
        if (h1 !== 1) errors.push(`${h1} Überschriften der Ebene 1, erwartet genau eine`);
        const title = await page.title();
        if (!title.endsWith(APP_SUFFIX) || title === APP_SUFFIX.slice(3)) {
          errors.push(`Seitentitel „${title}“ benennt nicht die Seite`);
        }
      }

      const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      results.push({
        scenario: scenario.name,
        url: scenario.url,
        title: await page.title(),
        pageErrors: errors,
        violations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.map((n) => ({ target: n.target, html: n.html.slice(0, 200) })),
        })),
        incomplete: axe.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      });
      await context.close();
    }

    await browser.close();
  } finally {
    app.kill();
    mock.close();
  }

  await mkdir(path.join(ROOT, 'a11y/results'), { recursive: true });
  await writeFile(
    path.join(ROOT, 'a11y/results/axe-report.json'),
    JSON.stringify(results, null, 2),
  );

  let failed = 0;
  for (const result of results) {
    const count = result.violations.length + result.pageErrors.length;
    failed += count;
    console.log(`${count === 0 ? '✓' : '✗'} ${result.scenario}  [${result.title}]`);
    for (const v of result.violations) {
      console.log(`    ${v.impact ?? '-'} ${v.id}: ${v.help}`);
      for (const node of v.nodes.slice(0, 3)) console.log(`      ${JSON.stringify(node.target)}`);
    }
    for (const error of result.pageErrors) console.log(`    Befund: ${error}`);
  }
  console.log(
    `\n${results.length} Ansichten geprüft, ${failed} Befunde. Bericht: a11y/results/axe-report.json`,
  );
  process.exitCode = failed > 0 ? 1 : 0;
}

await main();
