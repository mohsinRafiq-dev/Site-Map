import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only middleware so the lead-notification email works on localhost
// (the real /api/notify-lead serverless function only runs on Vercel).
// Reads RESEND_* / LEAD_NOTIFY_* from your local .env and sends via Resend.
function leadEmailDevPlugin(env) {
  return {
    name: "lead-email-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/notify-lead", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", async () => {
          try {
            const lead = JSON.parse(body || "{}");
            const { sendLeadEmail } = await import("./api/_leadEmail.js");
            const result = await sendLeadEmail(lead, {
              apiKey: env.RESEND_API_KEY,
              to: env.LEAD_NOTIFY_TO,
              from: env.LEAD_NOTIFY_FROM,
            });
            res.statusCode = result.ok ? 200 : 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result.ok ? { ok: true } : { error: result.error }));
            if (!result.ok) console.warn("[dev lead-email]", result.error);
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

// Dev-only image proxy so cross-origin floor-plan images (Baserow S3, which
// doesn't send CORS on GET) can be used as Mapbox WebGL textures. Serving them
// through our own origin makes them same-origin, so no CORS is required.
function imageProxyDevPlugin() {
  return {
    name: "image-proxy-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/img", async (req, res, next) => {
        try {
          const target = new URL(req.url, "http://localhost").searchParams.get("url");
          if (!target || !/^https?:\/\//.test(target)) return next();
          const upstream = await fetch(target);
          if (!upstream.ok) {
            res.statusCode = upstream.status;
            return res.end("upstream error");
          }
          const buf = Buffer.from(await upstream.arrayBuffer());
          res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/png");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.end(buf);
        } catch (e) {
          res.statusCode = 502;
          res.end("proxy error");
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load ALL env vars (the "" prefix includes non-VITE ones like RESEND_API_KEY).
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), leadEmailDevPlugin(env), imageProxyDevPlugin()],

    server: {
      port: 5173,
      open: true,
      // Exclude the Floor Plans asset folder from file-watching — it holds
      // hundreds of PNGs that are never imported by Vite. Without this,
      // chokidar slows to a crawl and the dev server can fail to serve JS.
      watch: {
        ignored: ["**/Floor Plans/**", "**/node_modules/**", "**/dist/**"],
      },
    },

    // Mapbox GL JS is CommonJS — Vite must pre-bundle it so the
    // `import mapboxgl from "mapbox-gl"` default export resolves correctly.
    optimizeDeps: {
      include: ["mapbox-gl"],
    },

    assetsInclude: ["**/*.png", "**/*.jpg", "**/*.jpeg"],

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            mapbox: ["mapbox-gl"],
            firebase: ["firebase/app", "firebase/firestore", "firebase/storage", "firebase/auth"],
            react: ["react", "react-dom"],
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  };
});
