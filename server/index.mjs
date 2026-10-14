import { createServer } from "node:http";
import { createApp } from "./app.mjs";

try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

export const api = createServer(
  createApp({
    apiKey: process.env.VITE_APP_GEMINI_API_KEY,
    model: process.env.VITE_APP_IMAGE_MODEL || "gemini-nano-banana-2.1",
    imageSize: process.env.VITE_APP_IMAGE_SIZE || "2K",
  }),
);
api.listen(8787, "127.0.0.1", () =>
  console.log("Clothing photo studio: http://127.0.0.1:8787"),
);
api.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
