import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createApp } from "./app.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataFile = process.env.DATA_FILE || join(__dirname, "..", "data", "reports.json");
const port = Number(process.env.PORT) || 3000;

createApp({ dataFile }).listen(port, () => {
  console.log(`toilet-peace listening on http://localhost:${port}`);
});
