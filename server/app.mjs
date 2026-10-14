import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { buildPrompt } from "./prompt.mjs";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const ORIGINS = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:8787",
  "http://localhost:8787",
]);
const HOSTS = new Set([
  "127.0.0.1:8787",
  "localhost:8787",
  "127.0.0.1:5173",
  "localhost:5173",
]);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(body));
}

function matchesImage(bytes, mime) {
  if (mime === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png")
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/webp")
    return (
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    );
  return false;
}

export function createApp({
  apiKey = "",
  model = "gemini-nano-banana-2.1",
  imageSize = "1K",
  fetchImage = fetch,
  dist = resolve("dist"),
} = {}) {
  let busy = false;

  return async (req, res) => {
    const controller = new AbortController();
    res.once?.("close", () => {
      if (!res.writableFinished) controller.abort();
    });
    let editing = false;
    try {
      if (
        !process.env.VERCEL &&
        !HOSTS.has(req.headers.host) &&
        req.headers.host !== `127.0.0.1:${req.socket?.localPort}` &&
        req.headers.host !== `localhost:${req.socket?.localPort}`
      )
        throw new RequestError(
          403,
          "This studio is available on this computer only.",
        );
      const path = new URL(req.url, "http://127.0.0.1:8787").pathname;
      if (
        req.method === "GET" &&
        (path === "/api/status" || path === "/status")
      )
        return json(res, 200, { configured: Boolean(apiKey) });
      if (path === "/api/edit" || path === "/edit") {
        if (req.method !== "POST")
          throw new RequestError(405, "Use POST to edit a photo.");
        if (
          !ORIGINS.has(req.headers.origin) &&
          req.headers.origin !== `http://${req.headers.host}` &&
          req.headers.origin !== `https://${req.headers.host}`
        )
          throw new RequestError(
            403,
            "Open the studio locally to edit photos.",
          );
        if (!apiKey)
          throw new RequestError(
            503,
            "Image editing is not connected. Add VITE_APP_GEMINI_API_KEY to .env and restart the studio.",
          );
        if (busy)
          throw new RequestError(
            409,
            "Another photo is being edited. Please wait for it to finish.",
          );
        if (!req.headers["content-type"]?.startsWith("multipart/form-data;"))
          throw new RequestError(415, "Upload a JPEG, PNG, or WebP photo.");
        if (Number(req.headers["content-length"]) > MAX_REQUEST_BYTES)
          throw new RequestError(413, "Choose a photo smaller than 20 MB.");

        busy = true;
        editing = true;
        let size = 0;
        const chunks = [];
        if (req.body && Buffer.isBuffer(req.body)) {
          chunks.push(req.body);
        } else if (typeof req.iterator === "function") {
          for await (const chunk of req.iterator({ destroyOnReturn: false })) {
            size += chunk.length;
            if (size > MAX_REQUEST_BYTES) {
              req.resume?.();
              throw new RequestError(413, "Choose a photo smaller than 20 MB.");
            }
            chunks.push(chunk);
          }
        } else {
          for await (const chunk of req) {
            size += chunk.length;
            if (size > MAX_REQUEST_BYTES) {
              req.resume?.();
              throw new RequestError(413, "Choose a photo smaller than 20 MB.");
            }
            chunks.push(chunk);
          }
        }
        let form;
        try {
          form = await new Request("http://localhost", {
            method: "POST",
            headers: { "Content-Type": req.headers["content-type"] },
            body: Buffer.concat(chunks),
          }).formData();
        } catch {
          throw new RequestError(
            400,
            "The upload could not be read. Choose the photo again.",
          );
        }
        const image = form.get("image");
        const mode = form.get("mode") || "natural";
        if (!(image instanceof File) || !image.size)
          throw new RequestError(400, "Choose a photo to edit.");
        if (image.size > MAX_IMAGE_BYTES)
          throw new RequestError(413, "Choose a photo smaller than 20 MB.");
        if (!["natural", "faithful"].includes(mode))
          throw new RequestError(400, "Choose a valid cleanup style.");
        const bytes = Buffer.from(await image.arrayBuffer());
        if (!matchesImage(bytes, image.type))
          throw new RequestError(
            415,
            "Use a valid JPEG, PNG, or WebP photo. Export HEIC photos as JPEG first.",
          );

        const input = [
          {
            type: "image",
            mime_type: image.type,
            data: bytes.toString("base64"),
          },
        ];
        input.push({ type: "text", text: buildPrompt(mode) });
        const response = await fetchImage(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            headers: {
              "x-goog-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              input,
              response_format: {
                type: "image",
                mime_type: "image/jpeg",
                image_size: imageSize,
              },
              store: false,
            }),
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(300000),
            ]),
          },
        );
        if (!response.ok) {
          const failure = await response.json().catch(() => null);
          const message =
            response.status === 429
              ? "Gemini image quota or rate limit reached. Check billing and image-model limits in Google AI Studio before retrying."
              : [401, 403].includes(response.status) ||
                  failure?.error?.details?.some(
                    (detail) => detail.reason === "API_KEY_INVALID",
                  )
                ? "Gemini could not authenticate. Check your API key, its restrictions, and image-model access."
                : response.status === 404
                  ? "This Gemini image model is unavailable. Check VITE_APP_IMAGE_MODEL in .env and restart the studio."
                  : response.status === 400
                    ? "Gemini rejected the image-edit request. Check the selected image model and uploaded photo."
                    : "Gemini could not finish this edit. Please try again.";
          throw new RequestError(502, message);
        }
        const result = await response.json();
        const encoded = result.steps
          ?.filter((step) => step.type === "model_output")
          .flatMap((step) => step.content ?? [])
          .findLast(
            (part) => part.type === "image" && part.mime_type === "image/jpeg",
          )?.data;
        if (!encoded)
          throw new RequestError(
            502,
            "The image service returned no photo. Please try again.",
          );
        const output = Buffer.from(encoded, "base64");
        if (!matchesImage(output, "image/jpeg"))
          throw new RequestError(
            502,
            "The image service returned an unreadable photo. Please try again.",
          );
        res.writeHead(200, {
          "Content-Type": "image/jpeg",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        });
        return res.end(output);
      }
      if (path.startsWith("/api/"))
        throw new RequestError(404, "This endpoint does not exist.");
      if (req.method !== "GET" && req.method !== "HEAD")
        throw new RequestError(405, "Method not allowed.");
      const target = resolve(
        dist,
        `.${decodeURIComponent(path === "/" ? "/index.html" : path)}`,
      );
      if (!target.startsWith(`${dist}${sep}`))
        throw new RequestError(403, "File access denied.");
      let content;
      try {
        content = await readFile(target);
      } catch (error) {
        if (error.code === "ENOENT")
          throw new RequestError(
            404,
            "File not found. Build the app with yarn build first.",
          );
        throw error;
      }
      res.writeHead(200, {
        "Content-Type": MIME[extname(target)] ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (error) {
      if (res.destroyed || res.writableEnded) return;
      const timedOut = error.name === "TimeoutError";
      json(res, error.status ?? (timedOut ? 504 : 500), {
        error:
          error instanceof RequestError
            ? error.message
            : timedOut
              ? "This edit took too long. Please try again."
              : "Something went wrong. Please try again.",
      });
    } finally {
      if (editing) busy = false;
    }
  };
}
