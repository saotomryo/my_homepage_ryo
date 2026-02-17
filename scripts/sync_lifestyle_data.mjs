import fs from 'node:fs';
import path from 'node:path';

const LIFESTYLE_ROOT = '/Users/saotome2/develop/LifeStyle';
const OUT_DIR = '/Users/saotome2/develop/MyPage/src/content/generated/ja';

const INPUTS = {
  profiles: path.join(LIFESTYLE_ROOT, 'links/profiles.md'),
  catalog: path.join(LIFESTYLE_ROOT, 'publications/articles/catalog.md'),
  projects: path.join(LIFESTYLE_ROOT, 'inventory/develop/projects.json'),
  projectsMd: path.join(LIFESTYLE_ROOT, 'inventory/develop/projects.md')
};

const CATEGORY_SKILL_PATH = '/Users/saotome2/develop/MyPage/scripts/category_skill.json';

const FALLBACK_CATEGORY_RULES = [
  {
    key: 'politics',
    patterns: [
      '政治', '政党', '選挙', 'マニフェスト', '国会', '行政', '政策', '予算', '政府',
      '国のお金の使い方', '立憲民主党', '公明党', '衆院選', '参院選',
      'politic', 'party', 'election', 'manifesto', 'policy', 'government', 'parliament', 'budget'
    ]
  },
  {
    key: 'robotics',
    patterns: ['gemini robotics', 'robot', 'robotics', 'drone', 'px4', 'hakoniwa', 'ros', 'ロボット', 'ドローン', '自動運転']
  },
  {
    key: 'ai',
    patterns: [
      'ai', 'llm', 'gpt', 'openai', 'gemini', 'prompt', 'machine learning', 'deep learning',
      '生成ai', '画像認識', 'ocr', 'nlp', 'realtime api'
    ]
  },
  {
    key: 'hobby',
    patterns: ['music', 'song', 'guitar', 'piano', 'haiku', '短歌', '俳句', '猫', '黒猫', 'cat', 'shorts', '趣味']
  }
];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJsonIfExists(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function parseBulletLinks(lines) {
  const items = [];
  for (const line of lines) {
    const m = line.match(/^\s*-\s*(.+?):\s*(https?:\/\/\S+)\s*$/u);
    if (!m) continue;
    items.push({ label: m[1].trim(), url: m[2].trim() });
  }
  return items;
}

function splitSections(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const sections = new Map();
  let current = 'root';
  sections.set(current, []);

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/u);
    if (h2) {
      current = h2[1].trim();
      sections.set(current, []);
      continue;
    }
    sections.get(current).push(line);
  }
  return sections;
}

function parseProfile(markdown) {
  const sections = splitSections(markdown);
  const links = [];
  const workContacts = [];

  const profileSections = ['発信/プロフィール', 'コミュニティ/実績'];
  for (const name of profileSections) {
    const lines = sections.get(name) || [];
    for (const item of parseBulletLinks(lines)) {
      links.push({ category: name, ...item });
    }
  }

  const workSections = ['受託窓口（国内）', '受託窓口（海外）'];
  for (const name of workSections) {
    const lines = sections.get(name) || [];
    for (const item of parseBulletLinks(lines)) {
      workContacts.push({ category: name, ...item });
    }
  }

  return {
    name: 'Ryo Saotome',
    headline: 'AI Engineer / Builder / Writer',
    summary:
      'AI開発・記事発信・動画制作を横断して、実装と検証を高速に回しながら価値提供するエンジニア。',
    links,
    work_contacts: workContacts
  };
}

function loadCategorySkill() {
  const fallback = { default_category: 'other_tech', rules: FALLBACK_CATEGORY_RULES };
  try {
    if (!fs.existsSync(CATEGORY_SKILL_PATH)) return fallback;
    const raw = JSON.parse(fs.readFileSync(CATEGORY_SKILL_PATH, 'utf8'));
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.rules)) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

const CATEGORY_SKILL = loadCategorySkill();

function classifyCategory(text) {
  const src = String(text || '').toLowerCase();
  for (const rule of CATEGORY_SKILL.rules) {
    if (rule.patterns.some((p) => src.includes(String(p).toLowerCase()))) {
      return rule.key;
    }
  }
  return CATEGORY_SKILL.default_category || 'other_tech';
}

function parseCatalog(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const sourceMap = new Map([
    ['Qiita', 'qiita'],
    ['Zenn', 'zenn'],
    ['Note', 'note']
  ]);
  let currentSource = 'unknown';
  const items = [];

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/u);
    if (h2) {
      currentSource = sourceMap.get(h2[1].trim()) || 'unknown';
      continue;
    }

    const bullet = line.match(/^\s*-\s*(\d{4}-\d{2}-\d{2}):\s*\[(.+)\]\((https?:\/\/\S+)\)\s*$/u);
    if (!bullet) continue;

    items.push({
      date: bullet[1],
      title: bullet[2].trim(),
      url: bullet[3].trim(),
      source: currentSource,
      category_key: classifyCategory(`${bullet[2]} ${currentSource}`)
    });
  }

  items.sort((a, b) => b.date.localeCompare(a.date));
  return { items };
}

function parseProjectSummariesFromMarkdown(markdown) {
  const byName = new Map();
  const byPath = new Map();
  const lines = String(markdown || '').split(/\r?\n/u);
  const headerLine = lines.find((line) => /^\|/.test(line) && line.includes('Project') && line.includes('Summary'));
  if (!headerLine) return { byName, byPath };

  const headers = headerLine
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean);
  const projectIdx = headers.findIndex((x) => x === 'Project');
  const pathIdx = headers.findIndex((x) => x === 'Path');
  const summaryIdx = headers.findIndex((x) => x === 'Summary');
  if (projectIdx < 0 || summaryIdx < 0) return { byName, byPath };

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    if (line.includes('|---')) continue;
    const cells = line
      .split('|')
      .map((x) => x.trim())
      .filter(Boolean);
    if (cells.length <= summaryIdx) continue;

    const name = cells[projectIdx];
    const pathCell = pathIdx >= 0 ? cells[pathIdx] : '';
    const summary = cells[summaryIdx];
    if (!name || !summary || summary === 'Summary') continue;

    const cleanPath = pathCell.replace(/^`|`$/g, '');
    byName.set(name, summary);
    if (cleanPath) byPath.set(cleanPath, summary);
  }

  return { byName, byPath };
}

function normalizeRepoUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  const raw = url.trim();
  let out = raw;

  const scpLike = raw.match(/^git@github\.com:(.+)$/u);
  if (scpLike) out = `https://github.com/${scpLike[1]}`;

  const sshLike = raw.match(/^ssh:\/\/git@github\.com\/(.+)$/u);
  if (sshLike) out = `https://github.com/${sshLike[1]}`;

  if (/^github\.com\//iu.test(out)) {
    out = `https://${out}`;
  }

  if (/^https?:\/\/github\.com\//iu.test(out)) {
    out = out.replace(/\.git$/u, '');
  }

  return out;
}

function mergeArticleMetadata(nextArticles, prevArticles) {
  const prevItems = Array.isArray(prevArticles?.items) ? prevArticles.items : [];
  const prevByUrl = new Map(prevItems.map((x) => [x.url, x]));

  return {
    items: nextArticles.items.map((item) => {
      const prev = prevByUrl.get(item.url);
      if (!prev) return item;
      return {
        ...item,
        ...(prev.thumbnail_url ? { thumbnail_url: prev.thumbnail_url } : {}),
        ...(prev.og_title ? { og_title: prev.og_title } : {}),
        ...(prev.og_description ? { og_description: prev.og_description } : {}),
        ...(prev.og_url ? { og_url: prev.og_url } : {})
      };
    })
  };
}

function parseProjects(jsonText, projectsMarkdown = '') {
  const raw = JSON.parse(jsonText);
  const summaryMaps = parseProjectSummariesFromMarkdown(projectsMarkdown);
  const items = [];

  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    if (row.status === 'archived') continue;

    const repoUrls = Array.isArray(row.repos)
      ? row.repos
          .map((repo) => repo?.origin)
          .map((origin) => normalizeRepoUrl(origin))
          .filter((origin) => typeof origin === 'string' && origin.length > 0)
      : [];

    const summary =
      (typeof row.summary === 'string' && row.summary.trim()) ||
      summaryMaps.byPath.get(String(row.path || '')) ||
      summaryMaps.byName.get(String(row.name || '')) ||
      '';

    items.push({
      name: row.name || 'Unnamed Project',
      summary,
      status: row.status || 'unknown',
      last_activity: row.last_activity || '',
      repo_urls: repoUrls,
      tags: Array.isArray(row.tech_hints) ? row.tech_hints : [],
      category_key: classifyCategory(`${row.name || ''} ${(Array.isArray(row.tech_hints) ? row.tech_hints.join(' ') : '')}`)
    });
  }

  items.sort((a, b) => {
    const byStatus = statusOrder(a.status) - statusOrder(b.status);
    if (byStatus !== 0) return byStatus;
    return String(b.last_activity).localeCompare(String(a.last_activity));
  });

  return { items };
}

function statusOrder(status) {
  if (status === 'active') return 0;
  if (status === 'warm') return 1;
  if (status === 'stale') return 2;
  return 3;
}

function buildSiteMeta(profile, articles, projects) {
  return {
    updated_at: new Date().toISOString(),
    counts: {
      articles: articles.items.length,
      projects: projects.items.length,
      links: profile.links.length,
      work_contacts: profile.work_contacts.length
    }
  };
}

function writeJson(fileName, data) {
  const outPath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function main() {
  ensureDir(OUT_DIR);
  const prevArticles = readJsonIfExists(path.join(OUT_DIR, 'articles.json'), { items: [] });
  const prevMedia = readJsonIfExists(path.join(OUT_DIR, 'media.json'), null);

  const profile = parseProfile(readText(INPUTS.profiles));
  const rawArticles = parseCatalog(readText(INPUTS.catalog));
  const articles = mergeArticleMetadata(rawArticles, prevArticles);
  const projects = parseProjects(readText(INPUTS.projects), readText(INPUTS.projectsMd));
  const siteMeta = buildSiteMeta(profile, articles, projects);
  const media = prevMedia && typeof prevMedia === 'object' ? {
    ...prevMedia,
    youtube_channel_url: profile.links.find((x) => String(x.label).toLowerCase() === 'youtube')?.url || null,
    latest_video: prevMedia.latest_video || null,
    videos: Array.isArray(prevMedia.videos) ? prevMedia.videos : []
  } : {
    youtube_channel_url: profile.links.find((x) => String(x.label).toLowerCase() === 'youtube')?.url || null,
    latest_video: null,
    videos: []
  };

  writeJson('profile.json', profile);
  writeJson('articles.json', articles);
  writeJson('projects.json', projects);
  writeJson('site-meta.json', siteMeta);
  writeJson('media.json', media);

  console.log('sync:lifestyle success');
  console.log(`inputs: 3, articles: ${articles.items.length}, projects: ${projects.items.length}`);
}

main();
