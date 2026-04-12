
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
    if (!url) {
      console.error('Proxy error: URL is missing');
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`[Proxy] Requesting: ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[Proxy] Fetch failed: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch from Google Sheets: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      console.log(`[Proxy] Success: ${buffer.byteLength} bytes received`);
      
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.set('Access-Control-Allow-Origin', '*'); // Ensure CORS is handled if needed
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('[Proxy] Error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch data' });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production' || !fs.existsSync(path.join(__dirname, 'node_modules/vite'));
  
  if (!isProduction) {
    console.log('Starting in DEVELOPMENT mode (Vite Middleware)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting in PRODUCTION mode (Static Files)');
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      console.error(`ERROR: dist directory not found at ${distPath}`);
      // Fallback to dev mode if dist is missing but vite is available
      if (fs.existsSync(path.join(__dirname, 'node_modules/vite'))) {
         console.log('Falling back to dev mode because dist is missing');
         const vite = await createViteServer({
           server: { middlewareMode: true },
           appType: 'spa',
         });
         app.use(vite.middlewares);
      }
    } else {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
