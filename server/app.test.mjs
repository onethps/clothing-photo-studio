import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import { Readable } from "node:stream";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createApp } from "./app.mjs";
import { buildPrompt } from "./prompt.mjs";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
const jpeg = readFileSync("public/examples/after.jpg");
const headers = { Host: "127.0.0.1:8787", Origin: "http://127.0.0.1:5173" };
const generatedPhoto = {
  steps: [
    {
      type: "model_output",
      content: [
        {
          type: "image",
          mime_type: "image/jpeg",
          data: readFileSync("public/examples/before.jpg").toString("base64"),
        },
      ],
    },
    {
      type: "model_output",
      content: [
        { type: "text", text: "Listing photo ready." },
        {
          type: "image",
          mime_type: "image/jpeg",
          data: jpeg.toString("base64"),
        },
      ],
    },
  ],
};

async function studio(t, options = {}) {
  const server = createServer(createApp(options));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  return `http://127.0.0.1:${server.address().port}`;
}

function upload({
  type = "image/png",
  bytes = png,
  mode = "natural",
} = {}) {
  const form = new FormData();
  form.set("image", new Blob([bytes], { type }), "photo.png");
  form.set("mode", mode);
  return form;
}

test("setup exposes only connection state and blocks editing without a key", async (t) => {
  const url = await studio(t);
  const status = await fetch(`${url}/api/status`, { headers });
  assert.deepEqual(await status.json(), { configured: false });
  const edit = await fetch(`${url}/api/edit`, {
    method: "POST",
    headers,
    body: upload(),
  });
  assert.equal(edit.status, 503);
  assert.match((await edit.json()).error, /VITE_APP_GEMINI_API_KEY/);
});

test("valid edit preserves prompt constraints and returns Gemini image bytes for PNG export", async (t) => {
  let calls = 0;
  const url = await studio(t, {
    apiKey: "test-secret",
    fetchImage: async (endpoint, request) => {
      calls++;
      assert.equal(
        endpoint,
        "https://generativelanguage.googleapis.com/v1beta/interactions",
      );
      assert.equal(request.headers["x-goog-api-key"], "test-secret");
      assert.equal(request.headers["Content-Type"], "application/json");
      const body = JSON.parse(request.body);
      assert.equal(body.model, "gemini-nano-banana-2.1");
      assert.equal(body.store, false);
      assert.deepEqual(body.response_format, {
        type: "image",
        mime_type: "image/jpeg",
        image_size: "1K",
      });
      assert.match(body.input[1].text, /original background/);
      assert.match(body.input[1].text, /all signs of wear, damage, or stains/);
      assert.match(body.input[1].text, /Smooth the garment/);
      assert.equal(
        body.input.filter((part) => part.type === "image").length,
        1,
      );
      assert.deepEqual(Buffer.from(body.input[0].data, "base64"), png);
      assert.equal(body.input[0].mime_type, "image/png");
      return Response.json(generatedPhoto);
    },
  });
  const status = await fetch(`${url}/api/status`, { headers });
  assert.deepEqual(await status.json(), { configured: true });
  const result = await fetch(`${url}/api/edit`, {
    method: "POST",
    headers: { ...headers, Origin: url },
    body: upload(),
  });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("content-type"), "image/jpeg");
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(Buffer.from(await result.arrayBuffer()), jpeg);
  assert.equal(calls, 1);
});

test("details-first sends only the uploaded garment and preserves its original pose", async (t) => {
  const url = await studio(t, {
    apiKey: "test-secret",
    fetchImage: async (_endpoint, request) => {
      const body = JSON.parse(request.body);
      assert.equal(
        body.input.filter((part) => part.type === "image").length,
        1,
      );
      assert.deepEqual(Buffer.from(body.input[0].data, "base64"), png);
      assert.match(
        body.input[1].text,
        /Keep the original pose, garment geometry/,
      );
      assert.doesNotMatch(body.input[1].text, /finish reference/);
      return Response.json(generatedPhoto);
    },
  });
  const result = await fetch(`${url}/api/edit`, {
    method: "POST",
    headers,
    body: upload({ mode: "faithful" }),
  });
  assert.equal(result.status, 200);
});

test("invalid uploads, modes, instructions, hosts and origins never reach the paid service", async (t) => {
  const url = await studio(t, {
    apiKey: "test-secret",
    fetchImage: async () => {
      assert.fail("Must not call paid service");
    },
  });
  for (const [body, expected] of [
    [upload({ type: "image/heic" }), 415],
    [upload({ bytes: Buffer.from("not a real image") }), 415],
    [upload({ bytes: Buffer.alloc(0) }), 400],
    [upload({ mode: "unknown" }), 400],
    [upload({ bytes: Buffer.alloc(21 * 1024 * 1024) }), 413],
  ]) {
    const result = await fetch(`${url}/api/edit`, {
      method: "POST",
      headers,
      body,
    });
    assert.equal(result.status, expected);
  }
  for (const Origin of [
    "https://untrusted.example",
    "http://127.0.0.1:54321",
    "null",
    "",
  ]) {
    const result = await fetch(`${url}/api/edit`, {
      method: "POST",
      headers: { ...headers, Origin },
      body: upload(),
    });
    assert.equal(result.status, 403);
  }
  const foreignHostStatus = await new Promise((resolve, reject) => {
    const request = httpRequest(
      `${url}/api/status`,
      { headers: { Host: "untrusted.example" } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    request.on("error", reject);
    request.end();
  });
  assert.equal(foreignHostStatus, 403);
  const malformed = await fetch(`${url}/api/edit`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data; boundary=bad",
    },
    body: "malformed",
  });
  assert.equal(malformed.status, 400);
});

test("chunked uploads over the size limit return an error and do not call the paid service", async (t) => {
  const url = await studio(t, {
    apiKey: "test-secret",
    fetchImage: async () => {
      assert.fail("Must not call paid service");
    },
  });
  const chunks = Array.from({ length: 22 }, () => Buffer.alloc(1024 * 1024));
  const result = await fetch(`${url}/api/edit`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data; boundary=large",
    },
    body: Readable.from(chunks),
    duplex: "half",
  });
  assert.equal(result.status, 413);
});

test("service failures are recoverable and do not disclose secrets or raw responses", async (t) => {
  let calls = 0;
  const url = await studio(t, {
    apiKey: "test-secret",
    fetchImage: async () => {
      calls++;
      if (calls === 1)
        return new Response("test-secret private upstream details", {
          status: 401,
        });
      return Response.json(generatedPhoto);
    },
  });
  const failed = await fetch(`${url}/api/edit`, {
    method: "POST",
    headers,
    body: upload(),
  });
  assert.equal(failed.status, 502);
  const failure = await failed.text();
  assert.match(failure, /authenticate/);
  assert.doesNotMatch(failure, /test-secret|private upstream/);
  const retry = await fetch(`${url}/api/edit`, {
    method: "POST",
    headers,
    body: upload(),
  });
  assert.equal(retry.status, 200);
});

test("Gemini quota, key and model errors are actionable without exposing provider details", async (t) => {
  for (const [status, error, expected] of [
    [429, { status: "RESOURCE_EXHAUSTED" }, /Gemini image quota or rate limit/],
    [
      400,
      { details: [{ reason: "API_KEY_INVALID" }] },
      /could not authenticate/,
    ],
    [403, { status: "PERMISSION_DENIED" }, /could not authenticate/],
    [404, { status: "NOT_FOUND" }, /VITE_APP_IMAGE_MODEL/],
    [400, { status: "INVALID_ARGUMENT" }, /rejected the image-edit request/],
  ]) {
    const url = await studio(t, {
      apiKey: "test-secret",
      fetchImage: async () =>
        Response.json(
          {
            error: { ...error, message: "test-secret private account details" },
          },
          { status },
        ),
    });
    const response = await fetch(`${url}/api/edit`, {
      method: "POST",
      headers,
      body: upload(),
    });
    assert.equal(response.status, 502);
    const failure = await response.text();
    assert.match(failure, expected);
    assert.doesNotMatch(failure, /test-secret|private account/);
  }
  const url = await studio(t, {
    apiKey: "test-secret",
    fetchImage: async () => new Response("not JSON", { status: 429 }),
  });
  const response = await fetch(`${url}/api/edit`, {
    method: "POST",
    headers,
    body: upload(),
  });
  assert.equal(response.status, 502);
  assert.match(
    (await response.json()).error,
    /Gemini image quota or rate limit/,
  );
});

test(
  "a second request cannot start another paid edit while the first is running",
  { timeout: 10000 },
  async (t) => {
    let release;
    let started;
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    const entered = new Promise((resolve) => {
      started = resolve;
    });
    const url = await studio(t, {
      apiKey: "test-secret",
      fetchImage: async () => {
        started();
        await pending;
        return Response.json(generatedPhoto);
      },
    });
    const first = fetch(`${url}/api/edit`, {
      method: "POST",
      headers,
      body: upload(),
    });
    await entered;
    const second = await fetch(`${url}/api/edit`, {
      method: "POST",
      headers,
      body: upload(),
    });
    assert.equal(second.status, 409);
    release();
    assert.equal((await first).status, 200);
  },
);

test("missing image output and timeouts surface safe retry errors", async (t) => {
  for (const fetchImage of [
    async () =>
      Response.json({
        steps: [
          {
            type: "model_output",
            content: [{ type: "text", text: "No image available." }],
          },
        ],
      }),
    async () => {
      throw new DOMException("timeout", "TimeoutError");
    },
  ]) {
    const url = await studio(t, { apiKey: "test-secret", fetchImage });
    const result = await fetch(`${url}/api/edit`, {
      method: "POST",
      headers,
      body: upload(),
    });
    assert.ok([502, 504].includes(result.status));
    assert.match((await result.json()).error, /try again/);
  }
});

test("static routes cannot read outside the build directory", async (t) => {
  const url = await studio(t);
  const response = await fetch(`${url}/%2e%2e%2f.env`, { headers });
  assert.equal(response.status, 403);
});

test("details-first mode explicitly keeps geometry and marks rather than arranging the garment", () => {
  const prompt = buildPrompt("faithful", "Keep the original tag.");
  assert.match(prompt, /Keep the original pose, garment geometry/);
  assert.match(
    prompt,
    /Never invent garment features or reconstruct unreadable letters/,
  );
  assert.doesNotMatch(prompt, /Center and gently straighten/);
});

test("natural mode smooths wrinkles and steams garment while preserving wear and branding", () => {
  const prompt = buildPrompt("natural");
  assert.match(prompt, /Smooth the garment as if it had been carefully steamed/);
  assert.match(prompt, /all signs of wear, damage, or stains/);
  assert.match(
    prompt,
    /Never invent garment features or reconstruct unreadable letters/,
  );
  assert.match(prompt, /Significantly brighten the background/);
  assert.doesNotMatch(
    prompt,
    /finish reference|NEW realistic/,
  );
});

test("prompt enhances bright punchy contrast while locking authentic background texture", () => {
  const prompt = buildPrompt("natural");
  assert.match(prompt, /Boost background contrast with rich, punchy tonal depth/);
  assert.match(prompt, /Do NOT replace, redraw, or synthesize a new background texture/);
  assert.match(prompt, /Retain the exact existing background surface material and texture/);
  assert.match(prompt, /authentic wear or flaws/);
});

test("natural mode prompt covers all clothing categories including bottoms, outerwear and diverse fabrics", () => {
  const prompt = buildPrompt("natural");
  assert.match(prompt, /jeans, pants/i);
  assert.match(prompt, /hoodies, and jackets/i);
  assert.match(prompt, /denim, fleece, knitwear/i);
  assert.match(prompt, /legs, thighs, knees/i);
});


