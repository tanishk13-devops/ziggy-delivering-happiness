const fs = require('node:fs');
const path = require('node:path');

const envPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
const configuredApiUrl = process.env.NG_APP_API_URL || process.env.API_URL;

let apiUrl = configuredApiUrl;

if (!apiUrl) {
  console.warn('\x1b[33m%s\x1b[0m', '[set-prod-api-url] WARNING: NG_APP_API_URL is not set!');
  console.warn('\x1b[33m%s\x1b[0m', 'Please configure the NG_APP_API_URL environment variable in your Vercel project settings.');
  // Hardcoded fallback to help local or initial deploy, but we warn the user.
  apiUrl = 'https://ziggy-u65z.onrender.com/api';
}

console.log(`[set-prod-api-url] Resolving apiUrl: ${apiUrl}`);

const normalized = apiUrl.replace(/\/$/, '');
const content = `export const environment = {\n  production: true,\n  apiUrl: '${normalized}'\n};\n`;

fs.writeFileSync(envPath, content, 'utf8');
console.log(`[set-prod-api-url] environment.prod.ts successfully generated with apiUrl=${normalized}`);

