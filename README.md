# 🚽 トイレピース 🕊️ (toilet-peace)

「その土地の治安は、コンビニのトイレが**自由に使えるか** / **声をかける必要があるか** / **使用禁止か**を見ればわかる」——という都市伝説を、みんなの投稿で実際に可視化するウェブサービスです。

## 仕組み

- 地図上のコンビニに、トイレの利用状況を投稿できます
  - 🟢 **自由に使える**(スコア 100)
  - 🟡 **声かけが必要**(スコア 50)
  - 🔴 **使用禁止**(スコア 0)
  - ⚪ **トイレなし**(スコア対象外)
- 投稿は色分けマーカーとして地図に表示されます
- 表示中の範囲の投稿スコアを平均した「**ピース指数**」(0〜100)で、その地域の"平和度"がひと目でわかります

## 起動方法

```bash
npm install
npm run seed   # (任意) 東京近辺のデモデータを投入
npm start      # http://localhost:3000
```

開発時は `npm run dev`(ファイル変更で自動再起動)。

## 技術構成

- **バックエンド**: Node.js + Express。投稿は JSON ファイル(`data/reports.json`)に保存
- **フロントエンド**: バニラ JS + [Leaflet](https://leafletjs.com/) + OpenStreetMap(API キー不要)
- **テスト**: `node:test`(`npm test`)

## API

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/reports` | 投稿一覧。`?bbox=west,south,east,north` で範囲絞り込み |
| POST | `/api/reports` | 投稿。`{ lat, lng, status, storeName?, chain?, comment? }` |
| GET | `/api/peace-index?bbox=...` | 範囲内のピース指数 `{ index, sampleSize }` |
| GET | `/api/statuses` | ステータス定義 |

`status` は `free` / `ask` / `forbidden` / `none` のいずれか。

## 今後のアイデア

- 同一店舗への複数投稿の集約(最新優先・多数決など)と鮮度による重み付け
- メッシュ単位のヒートマップ表示
- Overpass API(OpenStreetMap)からコンビニ店舗位置を取得して投稿位置をスナップ
- 投稿の通報・モデレーション、荒らし対策(レートリミット等)
- DB を SQLite/PostgreSQL に移行

## 注意

ピース指数はあくまで都市伝説に基づくエンタメ指標です。実際の治安を保証するものではありません。
