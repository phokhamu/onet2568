
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  // Cache for the data
  let onetData: any = {};

  const XLSX_URL = 'https://docs.google.com/spreadsheets/d/1hKGYH1uB-S9XFSB_Y50-Eksyf57Du0XBJP7iEhoxkkw/export?format=xlsx';

  async function fetchData() {
    try {
      const response = await fetch(XLSX_URL);
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      
      const newData: any = {};
      const sheetMapping: any = {
        'ภาษาไทย': 'thai',
        'คณิตศาสตร์': 'math',
        'วิทยาศาสตร์': 'sci',
        'ภาษาอังกฤษ': 'eng'
      };

      workbook.SheetNames.forEach(sheetName => {
        const id = sheetMapping[sheetName];
        if (id) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          newData[id] = jsonData;
          console.log(`Parsed ${jsonData.length} records for ${sheetName}`);
        }
      });

      onetData = newData;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // Initial fetch
  await fetchData();

  // API endpoint to get data
  app.get('/api/data', (req, res) => {
    res.json(onetData);
  });

  // Refresh data endpoint
  app.get('/api/refresh', async (req, res) => {
    await fetchData();
    res.json({ status: 'ok', count: Object.keys(onetData).length });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
