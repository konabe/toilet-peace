/* global L */
const STATUS_META = {
  free: { label: "自由に使える", color: "#2ecc71", emoji: "🟢" },
  ask: { label: "声かけが必要", color: "#f1c40f", emoji: "🟡" },
  forbidden: { label: "使用禁止", color: "#e74c3c", emoji: "🔴" },
  none: { label: "トイレなし", color: "#95a5a6", emoji: "⚪" },
};

const map = L.map("map").setView([35.6762, 139.6993], 13); // 東京中心
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);

// 現在地が取れたらそこへ移動(失敗時は東京のまま)
navigator.geolocation?.getCurrentPosition(
  (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 14),
  () => {}
);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function popupHtml(report) {
  const meta = STATUS_META[report.status] ?? STATUS_META.none;
  const name = [report.chain, report.storeName].filter(Boolean).join(" ") || "コンビニ";
  const date = new Date(report.createdAt).toLocaleDateString("ja-JP");
  return `
    <div><strong>${escapeHtml(name)}</strong></div>
    <div class="popup-status">${meta.emoji} ${meta.label}</div>
    ${report.comment ? `<div class="popup-comment">${escapeHtml(report.comment)}</div>` : ""}
    <div class="popup-date">${date} 投稿</div>
  `;
}

function renderReports(reports) {
  markerLayer.clearLayers();
  for (const report of reports) {
    const meta = STATUS_META[report.status] ?? STATUS_META.none;
    L.circleMarker([report.lat, report.lng], {
      radius: 9,
      color: "#fff",
      weight: 2,
      fillColor: meta.color,
      fillOpacity: 0.9,
    })
      .bindPopup(popupHtml(report))
      .addTo(markerLayer);
  }
}

function bboxParam() {
  const b = map.getBounds();
  return `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
}

async function refresh() {
  const [reports, peace] = await Promise.all([
    fetch("/api/reports").then((r) => r.json()),
    fetch(`/api/peace-index?bbox=${bboxParam()}`).then((r) => r.json()),
  ]);
  renderReports(reports);
  renderPeace(peace);
}

function renderPeace({ index, sampleSize }) {
  const valueEl = document.getElementById("peace-value");
  const sampleEl = document.getElementById("peace-sample");
  if (index === null) {
    valueEl.textContent = "--";
    valueEl.className = "";
    sampleEl.textContent = "この範囲に投稿がありません";
    return;
  }
  valueEl.textContent = index;
  valueEl.className = index >= 70 ? "high" : index >= 40 ? "mid" : "low";
  sampleEl.textContent = `${sampleSize} 件の投稿から算出`;
}

// 表示範囲が変わったらピース指数を更新
map.on("moveend", async () => {
  const peace = await fetch(`/api/peace-index?bbox=${bboxParam()}`).then((r) => r.json());
  renderPeace(peace);
});

// --- 投稿フロー ---
const addButton = document.getElementById("add-button");
const addHint = document.getElementById("add-hint");
const dialog = document.getElementById("report-dialog");
const form = document.getElementById("report-form");
let picking = false;
let pickedLatLng = null;

function setPicking(on) {
  picking = on;
  addButton.classList.toggle("active", on);
  addHint.hidden = !on;
  addButton.textContent = on ? "キャンセル" : "＋ トイレ情報を投稿";
  map.getContainer().style.cursor = on ? "crosshair" : "";
}

addButton.addEventListener("click", () => setPicking(!picking));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && picking) setPicking(false);
});

map.on("click", (e) => {
  if (!picking) return;
  pickedLatLng = e.latlng;
  setPicking(false);
  form.reset();
  dialog.showModal();
});

document.getElementById("cancel-button").addEventListener("click", () => dialog.close());

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, lat: pickedLatLng.lat, lng: pickedLatLng.lng }),
  });
  if (!res.ok) {
    const { errors } = await res.json().catch(() => ({ errors: ["投稿に失敗しました"] }));
    alert(errors.join("\n"));
    return;
  }
  dialog.close();
  await refresh();
});

refresh();
