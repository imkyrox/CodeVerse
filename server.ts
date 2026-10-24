import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files from the dist directory
app.use(express.static(path.resolve(__dirname, 'dist')));

// Handle SPA client routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CodeVerse server listening on port ${PORT}`);
});
