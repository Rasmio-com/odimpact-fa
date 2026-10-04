// پلیر صفحه‌ی اول را در یک فایل جاوااسکریپت (IIFE) می‌بندد:
//   site/assets/js/showreel.js
// خروجی در مخزن ثبت می‌شود تا انتشار سایت همچنان بدون مرحله‌ی بیلد بماند.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const out = path.resolve(ROOT, '..', 'site', 'assets', 'js', 'showreel.js');

const result = await build({
  entryPoints: [path.join(ROOT, 'src', 'player', 'main.tsx')],
  outfile: out,
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020', 'chrome90', 'firefox90', 'safari14'],
  jsx: 'automatic',
  charset: 'utf8',
  legalComments: 'eof',
  define: { 'process.env.NODE_ENV': '"production"' },
  metafile: true,
  logLevel: 'warning',
});

const bytes = Object.values(result.metafile.outputs)[0].bytes;
console.log(`→ ${path.relative(path.resolve(ROOT, '..'), out)} (${(bytes / 1024).toFixed(0)}KB)`);
