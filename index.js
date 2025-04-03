const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const content = await page.evaluate(() => {
      const walk = (node) => {
        return {
          tag: node.tagName,
          id: node.id,
          class: node.className,
          children: Array.from(node.children || []).map(walk)
        };
      };
      return walk(document.body);
    });

    await browser.close();
    res.json(content);

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    res.status(500).json({ error: 'Scraping failed', details: error.message });
  }
});

app.get('/', (_, res) => res.send("✅ Playwright Funnel Scraper Running"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));