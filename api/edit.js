import { createApp } from "../server/app.mjs";

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

export default function handler(req, res) {
  const app = createApp({
    apiKey: process.env.VITE_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    model:
      process.env.VITE_APP_IMAGE_MODEL ||
      process.env.GEMINI_IMAGE_MODEL ||
      "gemini-nano-banana-2.1",
    imageSize: process.env.VITE_APP_IMAGE_SIZE || "2K",
  });
  return app(req, res);
}
