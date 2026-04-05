const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const COOKIES_DB = 'C:/Users/drrob/AppData/Local/Google/Chrome/User Data/Default/Cookies';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

const pages = [
  { name: 'dashboard', url: 'https://www.fundflowos.com/operator/dashboard' },
  { name: 'contacts',  url: 'https://www.fundflowos.com/operator/contacts' },
  { name: 'deals',     url: 'https://www.fundflowos.com/operator/deals' },
  { name: 'funds',     url: 'https://www.fundflowos.com/operator/funds' },
  { name: 'ai',        url: 'https://www.fundflowos.com/operator/ai' },
  { name: 'communication', url: 'https://www.fundflowos.com/operator/communication' },
  { name: 'documents', url: 'https://www.fundflowos.com/operator/documents' },
  { name: 'loans',     url: 'https://www.fundflowos.com/operator/loans' },
  { name: 'reports',   url: 'https://www.fundflowos.com/operator/reports' },
  { name: 'automations', url: 'https://www.fundflowos.com/operator/automations' },
  { name: 'pitch-decks', url: 'https://www.fundflowos.com/operator/pitch-decks' },
  { name: 'syndications', url: 'https://www.fundflowos.com/operator/7-day-syndications' },
  { name: 'landing-pages', url: 'https://www.fundflowos.com/operator/landing-pages' },
];

(async () => {
  // Strategy: Launch Chrome with remote debugging, then connect Puppeteer
  // Use a temp user data dir but steal cookies from the real one via sqlite

  // Step 1: Extract cookies from Chrome's cookie DB
  let cookies = [];
  try {
    // Copy the cookies DB so we don't lock the running Chrome
    const tmpCookies = path.join(process.env.TEMP, 'chrome_cookies_copy');
    fs.copyFileSync(COOKIES_DB, tmpCookies);

    // Use sqlite3 to extract fundflowos cookies
    // Try with PowerShell and System.Data.SQLite or with sqlite3 CLI
    const sqliteQuery = `SELECT name, value, host_key, path, is_secure, is_httponly, expires_utc FROM cookies WHERE host_key LIKE '%fundflowos%'`;

    // Try using better-sqlite3 if available, otherwise use python
    let cookieData;
    try {
      cookieData = execSync(
        `python -c "import sqlite3,json;conn=sqlite3.connect(r'${tmpCookies}');c=conn.cursor();c.execute(\\"${sqliteQuery}\\");rows=c.fetchall();print(json.dumps([{'name':r[0],'value':r[1],'domain':r[2],'path':r[3],'secure':bool(r[4]),'httpOnly':bool(r[5])} for r in rows]));conn.close()"`,
        { encoding: 'utf-8' }
      ).trim();
    } catch (e) {
      // Try python3
      cookieData = execSync(
        `python3 -c "import sqlite3,json;conn=sqlite3.connect(r'${tmpCookies}');c=conn.cursor();c.execute(\\"${sqliteQuery}\\");rows=c.fetchall();print(json.dumps([{'name':r[0],'value':r[1],'domain':r[2],'path':r[3],'secure':bool(r[4]),'httpOnly':bool(r[5])} for r in rows]));conn.close()"`,
        { encoding: 'utf-8' }
      ).trim();
    }

    cookies = JSON.parse(cookieData);
    console.log(`Extracted ${cookies.length} cookies for fundflowos.com`);

    // Clean up
    fs.unlinkSync(tmpCookies);
  } catch (err) {
    console.log('Cookie extraction failed:', err.message);
    console.log('Trying alternative approach...');
  }

  // Step 2: Launch headless Chrome with a temp profile
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--window-size=1400,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Step 3: Set cookies if we extracted any
  if (cookies.length > 0) {
    // Set cookies on the domain
    const puppeteerCookies = cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || '/',
      secure: c.secure,
      httpOnly: c.httpOnly,
    }));
    await page.setCookie(...puppeteerCookies);
    console.log('Cookies set.');
  }

  // Step 4: Test authentication
  await page.goto('https://www.fundflowos.com/', { waitUntil: 'networkidle2', timeout: 15000 });
  const currentUrl = page.url();
  console.log('Landed on:', currentUrl);

  if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
    console.log('NOT AUTHENTICATED even with cookies.');
    console.log('Note: Chrome encrypts cookie values on Windows — raw sqlite values are encrypted.');
    console.log('You need to use the authenticated Chrome browser directly.');
    await browser.close();
    process.exit(1);
  }

  console.log('Authenticated! Capturing screenshots...');

  for (const p of pages) {
    try {
      console.log(`Capturing ${p.name}...`);
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000));

      const filePath = path.join(OUTPUT_DIR, `${p.name}.jpg`);
      await page.screenshot({ path: filePath, type: 'jpeg', quality: 90 });
      console.log(`  ✓ Saved ${filePath}`);
    } catch (err) {
      console.log(`  ✗ Failed ${p.name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('Done!');
})();
