export default function handler(req, res) {
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed." }));
  }
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(
    JSON.stringify({
      configured: Boolean(
        process.env.VITE_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
      ),
    }),
  );
}
