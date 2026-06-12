// デモ用のサンプルデータを投入するスクリプト (npm run seed)
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ReportStore } from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataFile = process.env.DATA_FILE || join(__dirname, "..", "data", "reports.json");

const samples = [
  { lat: 35.6595, lng: 139.7005, status: "forbidden", storeName: "渋谷センター街店", chain: "セブン-イレブン", comment: "張り紙で使用禁止" },
  { lat: 35.6617, lng: 139.7040, status: "ask", storeName: "渋谷宮益坂店", chain: "ファミリーマート", comment: "店員さんに一声かければOK" },
  { lat: 35.6938, lng: 139.7034, status: "forbidden", storeName: "新宿歌舞伎町店", chain: "ローソン", comment: "終日使用不可" },
  { lat: 35.6896, lng: 139.6921, status: "ask", storeName: "西新宿駅前店", chain: "セブン-イレブン", comment: "" },
  { lat: 35.7148, lng: 139.7967, status: "free", storeName: "浅草雷門前店", chain: "ファミリーマート", comment: "自由に使えた。きれい" },
  { lat: 35.6284, lng: 139.7387, status: "free", storeName: "目黒駅東口店", chain: "ローソン", comment: "" },
  { lat: 35.6072, lng: 139.6680, status: "free", storeName: "自由が丘駅前店", chain: "セブン-イレブン", comment: "声かけ不要" },
  { lat: 35.7295, lng: 139.7109, status: "free", storeName: "目白通り店", chain: "ミニストップ", comment: "" },
  { lat: 35.6580, lng: 139.7016, status: "none", storeName: "渋谷道玄坂店", chain: "NewDays", comment: "そもそもトイレなし" },
];

const store = new ReportStore(dataFile);
for (const s of samples) store.add(s);
console.log(`${samples.length} 件のサンプルデータを ${dataFile} に追加しました`);
