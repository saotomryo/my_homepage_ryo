# MyPage

Astro + GitHub Pages で公開する個人ホームページです。

## セットアップ

```bash
npm install
npm run sync:lifestyle
npm run enrich:media
npm run translate:en
npm run build
```

## 運用フロー（手動）

```bash
npm run sync:lifestyle
npm run enrich:media
npm run translate:en
npm run build
```

## 分類スキル

- `scripts/category_skill.json` を分類スキルとして使用
- 記事・プロジェクトは `sync:lifestyle` 実行時に分類
- 動画は `enrich:media` 実行時に分類（`other_tech` は `video_override` で `hobby` へ移動可能）

## データ入力元

- `/Users/saotome2/develop/LifeStyle/links/profiles.md`
- `/Users/saotome2/develop/LifeStyle/publications/articles/catalog.md`
- `/Users/saotome2/develop/LifeStyle/inventory/develop/projects.json`

## 公開

- GitHub Pages を利用
- 独自ドメインは `public/CNAME` を実ドメインに更新
