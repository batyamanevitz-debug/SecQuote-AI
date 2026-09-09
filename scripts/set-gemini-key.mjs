/**
 * Writes GEMINI_API_KEY into .env so the key never has to be edited by hand.
 *
 *   npm run gemini AIza...      set the key
 *   npm run gemini -- --off     clear it (back to the local summary)
 *
 * .env is gitignored, so the key stays on this machine only.
 */
import fs from 'fs';

const LINE = 'GEMINI_API_KEY';
const arg = process.argv[2];

if (!arg) {
  console.log('');
  console.log('  שימוש:  npm run gemini <המפתח>');
  console.log('  ניקוי:  npm run gemini -- --off');
  console.log('');
  console.log('  מפתח מתקבל כאן: https://aistudio.google.com/apikey');
  console.log('');
  process.exit(1);
}

const clearing = arg === '--off' || arg === 'off';
const key = clearing ? '' : arg.trim().replace(/^["']|["']$/g, '');

if (!clearing && !key.startsWith('AIza')) {
  console.error('');
  console.error('  זה לא נראה כמו מפתח Gemini — מפתח תקין מתחיל ב-AIza');
  console.error('');
  process.exit(1);
}

let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const eol = env.includes('\r\n') ? '\r\n' : '\n';
const lines = env.split(/\r?\n/);
const idx = lines.findIndex((l) => l.trimStart().startsWith(LINE + '='));
const next = LINE + '="' + key + '"';

if (idx >= 0) {
  lines[idx] = next;
} else {
  if (lines.length && lines[lines.length - 1] !== '') lines.push('');
  lines.push('# --- Gemini (optional) ---', next);
}

fs.writeFileSync('.env', lines.join(eol));

console.log('');
if (clearing) {
  console.log('  ✓ המפתח נוקה. ההצעה תנוסח מקומית, בלי קריאה למודל.');
} else {
  console.log('  ✓ המפתח נשמר ב-.env (לא נכנס ל-git).');
}
console.log('  הפעילי מחדש את השרת:  npm run dev');
console.log('  ובדיקה:  http://localhost:3000/api/health');
console.log('');
