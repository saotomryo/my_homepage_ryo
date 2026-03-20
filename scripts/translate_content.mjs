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
  ['Lancers（プロフィール）', 'Lancers (Profile)'],
  ['Lancers（メニュー）', 'Lancers (Service Menu)'],
  ['動画生成', 'Video Generation'],
  ['国家版資金丸見えツール', 'National Budget Visualization Tool'],
  ['各政党の考え方を可視化するアプリケーション', 'Political Position Visualization Application'],
  ['デジタル民主主義：新しい民主主義のカタチ', 'Digital Democracy: A New Form of Democracy'],
  ['自動で日本の市況を海外に発信する', 'Automatically Share Japanese Market Conditions Overseas'],
  ['ADHD的な私のAI活用法', 'How I Use AI with My ADHD-like Work Style'],
  ['立憲民主党と公明党の合併報道が出たので比べてみた', 'Comparing the Constitutional Democratic Party and Komeito After the Merger Reports'],
  ['政党の「方針・姿勢」を可視化して比べる', 'Visualizing and Comparing Political Party Positions'],
  ['アプリケーションを作ってWebで公開しよう！', 'Build an Application and Publish It on the Web'],
  ['プロンプトベース画像検査アプリの可能性', 'The Potential of Prompt-based Image Inspection Apps'],
  ['多党化時代の政治メディアについて', 'Political Media in the Age of Multi-party Politics'],
  ['生成AIで「政党の公式発信」から政策スタンスを相対評価して可視化する', 'Using Generative AI to Visualize Policy Stances from Official Political Party Messaging'],
  ['Gemini Robotics-ER で動作するサンプルロボットシミュレータを作成', 'Building a Sample Robot Simulator Powered by Gemini Robotics-ER'],
  ['画像検査自動生成アプリケーション', 'Automatic Image Inspection App Generator'],
  ['チーム未来のマニュフェストを投稿してみた。', 'I Tried Publishing Team Mirai\'s Manifesto'],
  ['OpenAIのrealtime apiを使ってchatGPTでサンプルコードを書かせてみました。', 'Using the OpenAI Realtime API to Generate Sample Code with ChatGPT'],
  ['AIの学習についての考察', 'Thoughts on Learning AI'],
  ['本音と建前を出力するGPTs', 'A GPTs App that Outputs True Feelings and Formal Responses'],
  ['単眼Depth推定を試してみました。', 'Trying Monocular Depth Estimation'],
  ['ロボットに個性を持たせる', 'Giving Robots Personality'],
  ['AIにボードゲームをさせてみる', 'Letting AI Play Board Games'],
  ['手作りAIロボットに俳句や短歌を詠ませる', 'Making a Handmade AI Robot Compose Haiku and Tanka'],
  ['手作りでAIロボットを作成', 'Building an AI Robot by Hand'],
  ['海外クラウドソーシングへの挑戦①', 'Taking on Overseas Crowdsourcing 1'],
  ['Open MMLabの画像解析の記事及びサンプルコードのまとめ', 'A Roundup of OpenMMLab Image Analysis Articles and Sample Code'],
  ['MMGenerationを利用したGANの学習(cycle GAN)', 'Training a GAN with MMGeneration (CycleGAN)'],
  ['MMGenerationを利用した画像生成（サンプルコード編）', 'Image Generation with MMGeneration (Sample Code Edition)'],
  ['Pycaret3.0の時系列分析を試してみた', 'Trying Time Series Analysis with PyCaret 3.0'],
  ['MMOCRを使ってOCRを作成する（Text Recognation)②', 'Building OCR with MMOCR (Text Recognition) 2'],
  ['MMOCRを使ってOCRを作成する（Text Detection)③', 'Building OCR with MMOCR (Text Detection) 3'],
  ['MMOCRを使ってOCRを作成する（Text Recognation)①', 'Building OCR with MMOCR (Text Recognition) 1'],
  ['ほぼ自動で画像認識アプリケーションを作ろう', 'Build an Image Recognition Application Almost Automatically'],
  ['MMDETECTIONをgoogle colabolatoryで使うサンプルコード集', 'Sample Code for Using MMDetection on Google Colab'],
  ['MMSegmentationを使ってみた　オリジナルデータトレーニング編', 'Trying MMSegmentation: Custom Data Training Edition'],
  ['MMSegmentationを使ってみた　Training編', 'Trying MMSegmentation: Training Edition'],
  ['MMSgmentationをGoogle Collaboratoryで使ってみた', 'Trying MMSegmentation on Google Colab'],
  ['Pycaretを使って複数モデルをマージして予測してみました', 'Using PyCaret to Merge Multiple Models for Prediction'],
  ['E-statAPIを使ってPythonで分析をしてみる', 'Analyzing Data in Python with the e-Stat API'],
  ['AIエンジニアの実装スキルを証明するための項目について', 'Items That Demonstrate an AI Engineer\'s Implementation Skills'],
  ['Streamlitによる為替チャートの作成', 'Creating an Exchange Rate Chart with Streamlit'],
  ['MMdetectionでポリゴンの予測を実施する', 'Running Polygon Prediction with MMDetection'],
  ['MMDetectionで独自のCOCOデータセットを利用する', 'Using a Custom COCO Dataset with MMDetection'],
  ['PyTorchで画像分析により為替(FX）予測　②', 'Foreign Exchange (FX) Prediction with Image Analysis in PyTorch 2'],
  ['PyTorchで画像分析により為替(FX）予測　①', 'Foreign Exchange (FX) Prediction with Image Analysis in PyTorch 1'],
  ['JDLA E資格取得までの学習内容のまとめ', 'A Summary of My Study Process for the JDLA E Qualification'],
  ['各政党の方針・姿勢のAIによる見える化アプリケーションについて（2026年衆院選マニュフェストより）', 'AI visualization app for policy positions of political parties (from the 2026 lower house election manifestos)'],
  ['国のお金の使い方を考える', 'Rethinking how national budgets are used'],
  ['そもそも国は何にお金を使っているのかを分析する', 'Analyzing what the government actually spends money on'],
  ['国のお金の使い方を考える（行政事業レビュー見える化アプリケーション）_対話編', 'Rethinking How National Budgets Are Used (Administrative Project Review App) - Dialogue Edition'],
  ['国のお金の使い方を考える（行政事業レビュー見える化アプリケーション）', 'Rethinking How National Budgets Are Used (Administrative Project Review App)'],
  ['記事（Markdown）をベースに、解説動画（長尺）を半自動で生成し、必要なら Shorts（縦動画）も切り出すためのリポジトリです。', 'A repository for semi-automatically generating long-form explainer videos from Markdown articles, with optional Shorts generation.'],
  ['行政事業レビュー（RSシステム）から取得したCSV（特に 2-2「予算種別・歳出予算項目」）を、ブラウザだけで可視化するための静的Webアプ。', 'A static web app for visualizing budget review CSV data from the RS system entirely in the browser.'],
  ['仕様書に基づき、政党・政治家の立場を公式一次情報から可視化するアプリケーションの開発リポジトリです。', 'A development repository for an application that visualizes political parties and politicians from primary official sources based on a specification.'],
  ['人工生命シミュレーションを操作・観察するための PySide6 製 GUI アプリケーションです。', 'A PySide6 GUI application for operating and observing an artificial life simulation.'],
  ['ブログ記事向けの「公開手順を説明できる」サンプルアプリを2つまとめたリポジトリです。', 'A repository bundling two sample apps that can be used in blog posts explaining publishing workflows.'],
  ['LLM駆動の完全自律型 強化学習フレームワーク。', 'A fully autonomous reinforcement learning framework driven by LLMs.'],
  ['NHK学生ロボコン2025「XROBOCON」のシミュレーター環境。', 'A simulator environment for NHK Student Robocon 2025 XROBOCON.'],
  ['Gemini Robotics-ER を使った自律ロボット制御デモ。', 'An autonomous robot control demo using Gemini Robotics-ER.'],
  ['このプロジェクトは、**画像アップロード → 日本語仕様の入力**を受け。', 'This project accepts image uploads and Japanese specification inputs for automated visual inspection workflows.'],
  ['黒猫の大冒険', 'Black Cat Adventure']
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
  if (/^黒猫の大冒険/u.test(text)) {
    return text
      .replace(/^黒猫の大冒険/u, 'Black Cat Adventure')
      .replace(/番外編/u, 'Special Edition')
      .replace(/予告編/u, 'Trailer')
      .replace(/#ねこ/gu, '#cat')
      .replace(/^Black Cat Adventure(?=\d)/u, 'Black Cat Adventure ')
      .replace(/Adventure　/gu, 'Adventure ')
      .trim();
  }
  if (shouldKeep(text)) return value;

  // Fallback: preserve original to avoid breaking proper nouns and URLs.
  return value;
}

function deepTranslate(node, keyHint = '') {
  if (typeof node === 'string') {
    const protectedKeys = new Set(['url', 'repo_urls']);
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
