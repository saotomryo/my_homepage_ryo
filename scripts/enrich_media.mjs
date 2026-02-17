import fs from 'node:fs';
import path from 'node:path';

const LIFESTYLE_ROOT = '/Users/saotome2/develop/LifeStyle';
const JA_DIR = '/Users/saotome2/develop/MyPage/src/content/generated/ja';
const PROFILE_PATH = path.join(JA_DIR, 'profile.json');
const ARTICLES_PATH = path.join(JA_DIR, 'articles.json');
const MEDIA_PATH = path.join(JA_DIR, 'media.json');
const KURONEKO_PLAYLIST_META_PATH = path.join(
  LIFESTYLE_ROOT,
  'publications/youtube/metadata/playlist_kuroneko_videos.json'
);
const CHANNEL_META_PATH = path.join(
  LIFESTYLE_ROOT,
  'publications/youtube/metadata/channel_videos.json'
);
const KURONEKO_PLAYLIST_EMBED_SI = '4yWuDHW-jbvnrjqw';
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

const UA = 'Mozilla/5.0 (compatible; MyPageBot/1.0)';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonIfExists(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function loadCategorySkill() {
  const fallback = { default_category: 'other_tech', rules: FALLBACK_CATEGORY_RULES, video_override: { other_tech_to: 'hobby' } };
  try {
    if (!fs.existsSync(CATEGORY_SKILL_PATH)) return fallback;
    const raw = JSON.parse(fs.readFileSync(CATEGORY_SKILL_PATH, 'utf8'));
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.rules)) return fallback;
    return { ...fallback, ...raw };
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

function classifyVideoCategory(text) {
  const key = classifyCategory(text);
  if (key === 'other_tech') {
    return CATEGORY_SKILL.video_override?.other_tech_to || 'hobby';
  }
  return key;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': UA,
      'accept-language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.text();
}

function extractYoutubeChannelId(url) {
  const m = String(url || '').match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/u);
  return m ? m[1] : null;
}

function extractPlaylistId(url) {
  const m = String(url || '').match(/[?&]list=([A-Za-z0-9_-]+)/u);
  return m ? m[1] : null;
}

function parseYoutubeEntries(xml, limit = 12) {
  const entries = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gu)) {
    const body = m[1];
    const title = body.match(/<title>([\s\S]*?)<\/title>/u)?.[1]?.trim() || '';
    const videoId = body.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/u)?.[1]?.trim() || '';
    const watchUrl = body.match(/<link[^>]+href="([^"]+)"/u)?.[1]?.trim() || '';
    const publishedAt = body.match(/<published>([\s\S]*?)<\/published>/u)?.[1]?.trim() || '';
    if (!videoId) continue;
    entries.push({
      title,
      video_id: videoId,
      watch_url: watchUrl || `https://www.youtube.com/watch?v=${videoId}`,
      embed_url: `https://www.youtube.com/embed/${videoId}`,
      thumbnail_url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      published_at: publishedAt,
      category_key: classifyVideoCategory(title)
    });
    if (entries.length >= limit) break;
  }
  return entries;
}

function parseMetaTags(html) {
  const tags = html.match(/<meta\s+[^>]*>/giu) || [];
  const out = [];

  for (const tag of tags) {
    const attrs = {};
    for (const m of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gu)) {
      attrs[m[1].toLowerCase()] = m[3];
    }
    out.push(attrs);
  }
  return out;
}

function pickMeta(metaTags, keys, nameKinds = ['property', 'name']) {
  const normalized = new Set(keys.map((x) => x.toLowerCase()));
  for (const tag of metaTags) {
    for (const kind of nameKinds) {
      const key = String(tag[kind] || '').toLowerCase();
      if (normalized.has(key)) {
        const content = tag.content;
        if (typeof content === 'string' && content.trim()) {
          return content.trim();
        }
      }
    }
  }
  return null;
}

async function fetchArticleOgp(url) {
  try {
    const html = await fetchText(url);
    const metaTags = parseMetaTags(html);
    return {
      og_title: pickMeta(metaTags, ['og:title', 'twitter:title']),
      og_description: pickMeta(metaTags, ['og:description', 'description', 'twitter:description']),
      og_image: pickMeta(metaTags, ['og:image', 'twitter:image', 'twitter:image:src']),
      og_url: pickMeta(metaTags, ['og:url'])
    };
  } catch {
    return {
      og_title: null,
      og_description: null,
      og_image: null,
      og_url: null
    };
  }
}

function normalizeKuronekoPlaylist(meta) {
  if (!meta || typeof meta !== 'object') return null;
  const source = String(meta.source || '');
  const playlistId = extractPlaylistId(source);
  if (!playlistId) return null;

  const rows = Array.isArray(meta.videos) ? meta.videos : [];
  const videos = rows.slice(0, 50).map((v, idx) => ({
    index: idx,
    title: String(v.title || ''),
    video_id: String(v.id || ''),
    watch_url: String(v.url || (v.id ? `https://www.youtube.com/watch?v=${v.id}` : '')),
    embed_url: v.id ? `https://www.youtube.com/embed/${v.id}?list=${playlistId}&index=${idx}&rel=0` : '',
    thumbnail_url: v.id ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : '',
    uploaded_at: String(v.upload_date || ''),
    category_key: 'hobby'
  })).filter((x) => x.video_id);

  return {
    title: '黒猫の大冒険',
    playlist_id: playlistId,
    playlist_url: source,
    embed_url: `https://www.youtube.com/embed/videoseries?si=${KURONEKO_PLAYLIST_EMBED_SI}&list=${playlistId}`,
    videos
  };
}

function normalizeChannelMeta(meta) {
  if (!meta || typeof meta !== 'object') return [];
  const rows = Array.isArray(meta.videos) ? meta.videos : [];
  return rows.slice(0, 100).map((v) => {
    const videoId = String(v.id || '');
    return {
      title: String(v.title || ''),
      video_id: videoId,
      watch_url: String(v.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '')),
      embed_url: videoId ? `https://www.youtube.com/embed/${videoId}` : '',
      thumbnail_url: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
      published_at: String(v.upload_date || ''),
      category_key: classifyVideoCategory(`${v.title || ''} ${v.description || ''}`)
    };
  }).filter((x) => x.video_id);
}

async function main() {
  const profile = readJson(PROFILE_PATH);
  const articlesData = readJson(ARTICLES_PATH);
  const prevMedia = readJsonIfExists(MEDIA_PATH, {});

  const youtubeLink = (profile.links || []).find((x) => String(x.label).toLowerCase() === 'youtube');
  const channelUrl = youtubeLink?.url || null;
  const channelId = channelUrl ? extractYoutubeChannelId(channelUrl) : null;

  let latestVideo = null;
  let channelVideos = [];
  if (channelId) {
    try {
      const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
      channelVideos = parseYoutubeEntries(xml, 20);
      latestVideo = channelVideos[0] || null;
    } catch {
      latestVideo = null;
      channelVideos = [];
    }
  }

  const playlistMeta = readJsonIfExists(KURONEKO_PLAYLIST_META_PATH, null);
  const kuronekoPlaylist = normalizeKuronekoPlaylist(playlistMeta) || prevMedia.playlist_kuroneko || null;
  const kuronekoIds = new Set((kuronekoPlaylist?.videos || []).map((v) => v.video_id).filter(Boolean));
  channelVideos = channelVideos.filter((v) => !kuronekoIds.has(v.video_id));
  if (channelVideos.length === 0) {
    const channelMetaVideos = normalizeChannelMeta(readJsonIfExists(CHANNEL_META_PATH, null));
    channelVideos = channelMetaVideos.filter((v) => !kuronekoIds.has(v.video_id)).slice(0, 20);
  }
  latestVideo = channelVideos[0] || null;

  const items = Array.isArray(articlesData.items) ? articlesData.items : [];
  const targets = items.slice(0, 24);

  for (const item of targets) {
    const ogp = await fetchArticleOgp(item.url);
    item.thumbnail_url = ogp.og_image;
    item.og_title = ogp.og_title;
    item.og_description = ogp.og_description;
    item.og_url = ogp.og_url;
  }

  writeJson(ARTICLES_PATH, { items });

  const media = {
    youtube_channel_url: channelUrl,
    latest_video: latestVideo,
    channel_videos: channelVideos,
    videos: channelVideos,
    playlist_kuroneko: kuronekoPlaylist
  };
  writeJson(MEDIA_PATH, media);

  console.log('enrich:media success');
  console.log(
    `youtube_channel: ${latestVideo ? 'fetched' : 'not-found'}, channel_videos: ${channelVideos.length}, playlist_videos: ${kuronekoPlaylist?.videos?.length || 0}, article_thumbnails_checked: ${targets.length}`
  );
}

main();
