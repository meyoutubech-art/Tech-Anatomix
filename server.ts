import app from './src/server/app';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(express.static(path.resolve(__dirname, 'public')));
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');

    // Service Worker route with root scope permissions
    app.get('/sw.js', (req, res, next) => {
      const swPath = path.resolve(distPath, 'sw.js');
      if (fs.existsSync(swPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(swPath);
      }
      next();
    });

    // Web App Manifest route
    app.get('/manifest.webmanifest', (req, res, next) => {
      const manifestPath = path.resolve(distPath, 'manifest.webmanifest');
      if (fs.existsSync(manifestPath)) {
        res.setHeader('Content-Type', 'application/manifest+json');
        return res.sendFile(manifestPath);
      }
      next();
    });

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }

    app.get('*', (req, res, next) => {
      // Allow API routes to be handled by app routes without interception
      if (req.path.startsWith('/api')) {
        return next();
      }

      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
          if (err && !res.headersSent) {
            next(err);
          }
        });
      } else {
        console.warn(`[VIZLAB Server] Static bundle not found at ${indexPath}. Run 'npm run build' to generate client assets.`);
        res.status(503).type('html').send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <title>VIZLAB - Build In Progress</title>
              <style>
                body { background: #0b0f19; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
                .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; max-width: 560px; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
                h1 { font-size: 1.25rem; font-weight: 600; color: #38bdf8; margin-top: 0; }
                p { color: #94a3b8; line-height: 1.6; font-size: 0.95rem; }
                code { background: #1e293b; color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>VIZLAB Production Server Active</h1>
                <p>The backend server is live, but the frontend assets were not found in <code>dist/index.html</code>.</p>
                <p>To resolve this on Render, verify that the <strong>Build Command</strong> is configured to:</p>
                <p><code>npm install && npm run build</code></p>
                <p>And the <strong>Start Command</strong> is: <code>npm start</code>.</p>
              </div>
            </body>
          </html>
        `);
      }
    });
  }

  app.listen(port, () => {
    console.log(`VIZLAB Server running on port ${port} (${isProd ? 'production' : 'development'})`);
  });
}

// Only start standalone listener when not in Vercel serverless environment
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
