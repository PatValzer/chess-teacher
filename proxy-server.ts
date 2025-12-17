import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/api/classtab-proxy', async (req, res) => {
  const url = req.query.url as string;

  if (!url || !url.startsWith('https://www.classtab.org/')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(url);
    const text = await response.text();
    res.send(text);
  } catch (error) {
    console.error('Error fetching from ClassTab:', error);
    res.status(500).json({ error: 'Failed to fetch tablature' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
