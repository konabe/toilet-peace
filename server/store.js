import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

// トイレの利用状況。都市伝説に基づく「治安シグナル」の3段階 + トイレなし
export const STATUSES = Object.freeze({
  free: { label: "自由に使える", score: 100 },
  ask: { label: "声かけが必要", score: 50 },
  forbidden: { label: "使用禁止", score: 0 },
  none: { label: "トイレなし", score: null },
});

export class ReportStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.reports = this.#load();
  }

  #load() {
    if (!this.filePath || !existsSync(this.filePath)) return [];
    try {
      return JSON.parse(readFileSync(this.filePath, "utf8"));
    } catch {
      return [];
    }
  }

  #save() {
    if (!this.filePath) return;
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.reports, null, 2));
  }

  list({ bbox } = {}) {
    if (!bbox) return this.reports;
    const [west, south, east, north] = bbox;
    return this.reports.filter(
      (r) => r.lng >= west && r.lng <= east && r.lat >= south && r.lat <= north
    );
  }

  add({ lat, lng, status, storeName, chain, comment }) {
    const report = {
      id: randomUUID(),
      lat,
      lng,
      status,
      storeName: storeName || "",
      chain: chain || "",
      comment: comment || "",
      createdAt: new Date().toISOString(),
    };
    this.reports.push(report);
    this.#save();
    return report;
  }

  // ピース指数: 範囲内の投稿のスコア平均 (0-100)。トイレなしは対象外。
  peaceIndex({ bbox } = {}) {
    const scored = this.list({ bbox })
      .map((r) => STATUSES[r.status]?.score)
      .filter((s) => s !== null && s !== undefined);
    if (scored.length === 0) return { index: null, sampleSize: 0 };
    const index = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
    return { index, sampleSize: scored.length };
  }
}

export function validateReport(body) {
  const errors = [];
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    errors.push("lat は -90〜90 の数値で指定してください");
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    errors.push("lng は -180〜180 の数値で指定してください");
  }
  if (!Object.hasOwn(STATUSES, body.status)) {
    errors.push(`status は ${Object.keys(STATUSES).join(", ")} のいずれかです`);
  }
  for (const field of ["storeName", "chain", "comment"]) {
    const value = body[field];
    if (value !== undefined && (typeof value !== "string" || value.length > 200)) {
      errors.push(`${field} は200文字以内の文字列で指定してください`);
    }
  }
  return { ok: errors.length === 0, errors, lat, lng };
}

export function parseBbox(raw) {
  if (!raw) return null;
  const parts = String(raw).split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  return parts; // [west, south, east, north]
}
