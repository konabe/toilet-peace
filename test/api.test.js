import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.js";

// dataFile を渡さない = メモリ上のみで動作(テスト間でファイルを汚さない)
let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.on("listening", resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test("GET /api/statuses はステータス定義を返す", async () => {
  const res = await fetch(`${baseUrl}/api/statuses`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(Object.keys(body), ["free", "ask", "forbidden", "none"]);
});

test("POST /api/reports で投稿でき、GET で取得できる", async () => {
  const res = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: 35.6595,
      lng: 139.7005,
      status: "free",
      storeName: "テスト店",
      chain: "セブン-イレブン",
      comment: "テスト",
    }),
  });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.ok(created.id);
  assert.equal(created.status, "free");

  const list = await (await fetch(`${baseUrl}/api/reports`)).json();
  assert.ok(list.some((r) => r.id === created.id));
});

test("POST /api/reports は不正な入力を 400 で弾く", async () => {
  const cases = [
    { lat: 999, lng: 139, status: "free" },
    { lat: 35, lng: 139, status: "unknown" },
    { lat: 35, lng: 139, status: "free", comment: "あ".repeat(201) },
    {},
  ];
  for (const body of cases) {
    const res = await fetch(`${baseUrl}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 400, JSON.stringify(body));
    const { errors } = await res.json();
    assert.ok(errors.length > 0);
  }
});

test("GET /api/reports?bbox= は範囲内の投稿だけ返す", async () => {
  await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat: 43.06, lng: 141.35, status: "ask", storeName: "札幌の店" }),
  });
  // 東京近辺の bbox には札幌の投稿は含まれない
  const tokyo = await (await fetch(`${baseUrl}/api/reports?bbox=139,35,140,36`)).json();
  assert.ok(tokyo.every((r) => r.storeName !== "札幌の店"));
  const sapporo = await (await fetch(`${baseUrl}/api/reports?bbox=141,42,142,44`)).json();
  assert.ok(sapporo.some((r) => r.storeName === "札幌の店"));
});

test("GET /api/peace-index はスコア平均を返す(トイレなしは除外)", async () => {
  // 専用の離島 bbox に free(100), forbidden(0), none(除外) を投稿
  const spot = { lat: -45.0, lng: 170.0 };
  for (const status of ["free", "forbidden", "none"]) {
    await fetch(`${baseUrl}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...spot, status }),
    });
  }
  const res = await fetch(`${baseUrl}/api/peace-index?bbox=169,-46,171,-44`);
  const { index, sampleSize } = await res.json();
  assert.equal(sampleSize, 2);
  assert.equal(index, 50);
});

test("GET /api/peace-index は投稿ゼロなら index: null", async () => {
  const res = await fetch(`${baseUrl}/api/peace-index?bbox=0,0,1,1`);
  const body = await res.json();
  assert.deepEqual(body, { index: null, sampleSize: 0 });
});

test("不正な bbox は 400", async () => {
  const res = await fetch(`${baseUrl}/api/reports?bbox=abc`);
  assert.equal(res.status, 400);
});
