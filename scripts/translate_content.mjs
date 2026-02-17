import fs from 'node:fs';
import path from 'node:path';

const JA_DIR = '/Users/saotome2/develop/MyPage/src/content/generated/ja';
const EN_DIR = '/Users/saotome2/develop/MyPage/src/content/generated/en';

const DICT = new Map([
  ['AI開発・記事発信・動画制作を横断して、実装と検証を高速に回しながら価値提供するエンジニア。', 'An AI engineer delivering value by combining product development, writing, and video creation with fast implementation and validation cycles.'],
  ['発信/プロフィール', 'Publishing / Profile'],
  ['コミュニティ/実績', 'Community / Achievements'],
  ['受託窓口（国内）', 'Work Contact (Japan)'],
  ['受託窓口（海外）', 'Work Contact (Global)'],
  ['受託窓口', 'Work Contact'],
  ['各政党の方針・姿勢のAIによる見える化アプリケーションについて（2026年衆院選マニュフェストより）', 'AI visualization app for policy positions of political parties (from the 2026 lower house election manifestos)'],
  ['国のお金の使い方を考える', 'Rethinking how national budgets are used'],
  ['そもそも国は何にお金を使っているのかを分析する', 'Analyzing what the government actually spends money on']
]);

const NO_TRANSLATE_PATTERNS = [
  /^https?:\/\//u,
  /github\.com/iu,
  /qiita\.com/iu,
  /zenn\.dev/iu,
  /note\.com/iu,
  /youtube\.com/iu,
  /lancers\.jp/iu,
  /crowdworks\.jp/iu,
  /freelancer\.com/iu,
  /^[A-Za-z0-9_.\-/]+$/u
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(fileName, data) {
  const outPath = path.join(EN_DIR, fileName);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function shouldKeep(text) {
  return NO_TRANSLATE_PATTERNS.some((re) => re.test(text));
}

function pseudoTranslateText(value) {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text) return value;
  if (DICT.has(text)) return DICT.get(text);
  if (shouldKeep(text)) return value;

  // Fallback: preserve original to avoid breaking proper nouns and URLs.
  return value;
}

function deepTranslate(node, keyHint = '') {
  if (typeof node === 'string') {
    const protectedKeys = new Set(['label', 'name', 'title', 'url', 'repo_urls']);
    if (protectedKeys.has(keyHint)) {
      return node;
    }
    return pseudoTranslateText(node);
  }

  if (Array.isArray(node)) {
    return node.map((item) => deepTranslate(item, keyHint));
  }

  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = deepTranslate(v, k);
    }
    return out;
  }

  return node;
}

function main() {
  ensureDir(EN_DIR);

  const files = ['profile.json', 'articles.json', 'projects.json', 'site-meta.json', 'media.json'];
  let count = 0;
  for (const file of files) {
    const srcPath = path.join(JA_DIR, file);
    if (!fs.existsSync(srcPath)) continue;
    const src = readJson(srcPath);
    const translated = deepTranslate(src);
    writeJson(file, translated);
    count += 1;
  }

  console.log('translate:en success');
  console.log(`inputs: ${count}, outputs: ${count}`);
}

main();
