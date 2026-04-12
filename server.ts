
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import fetch from 'node-fetch';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Proxy endpoint for Google Sheets to avoid CORS issues
  app.get('/api/proxy-sheet', async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    
    console.log(`Proxying request for: ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(Buffer.from(buffer));
      console.log(`Successfully proxied ${buffer.byteLength} bytes`);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch data from Google Sheets' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.get('/', async (req, res, next) => {
      try {
        const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });

    app.get('/:page.html', async (req, res, next) => {
      const page = req.params.page;
      const filePath = path.join(__dirname, `${page}.html`);
      if (fs.existsSync(filePath)) {
        try {
          const template = fs.readFileSync(filePath, 'utf-8');
          const html = await vite.transformIndexHtml(req.url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (e) {
          next(e);
        }
      } else {
        next();
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    
    // Serve specific HTML files in production
    app.get('/:page.html', (req, res, next) => {
      const page = req.params.page;
      const filePath = path.join(distPath, `${page}.html`);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        next();
      }
    });

    app.get('/rt', (req, res) => res.sendFile(path.join(distPath, 'rt.html')));
    app.get('/nt', (req, res) => res.sendFile(path.join(distPath, 'nt.html')));
    app.get('/onet', (req, res) => res.sendFile(path.join(distPath, 'onet.html')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
