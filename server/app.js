import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ReportStore, STATUSES, validateReport, parseBbox } from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp({ dataFile } = {}) {
  const app = express();
  const store = new ReportStore(dataFile);

  app.use(express.json());
  app.use(express.static(join(__dirname, "..", "public")));

  app.get("/api/statuses", (_req, res) => {
    res.json(STATUSES);
  });

  app.get("/api/reports", (req, res) => {
    const bbox = parseBbox(req.query.bbox);
    if (req.query.bbox && !bbox) {
      return res.status(400).json({ errors: ["bbox は west,south,east,north 形式で指定してください"] });
    }
    res.json(store.list({ bbox }));
  });

  app.post("/api/reports", (req, res) => {
    const { ok, errors, lat, lng } = validateReport(req.body ?? {});
    if (!ok) return res.status(400).json({ errors });
    const report = store.add({
      lat,
      lng,
      status: req.body.status,
      storeName: req.body.storeName,
      chain: req.body.chain,
      comment: req.body.comment,
    });
    res.status(201).json(report);
  });

  app.get("/api/peace-index", (req, res) => {
    const bbox = parseBbox(req.query.bbox);
    if (req.query.bbox && !bbox) {
      return res.status(400).json({ errors: ["bbox は west,south,east,north 形式で指定してください"] });
    }
    res.json(store.peaceIndex({ bbox }));
  });

  return app;
}
