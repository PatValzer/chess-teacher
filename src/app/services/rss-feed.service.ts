import { Injectable, signal } from '@angular/core';

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  source: string;
  language: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RssFeedService {
  private newsItems = signal<NewsItem[]>([]);

  // RSS feeds from major newspapers in different languages
  private feeds = [
    // Italian
    {
      url: 'https://www.corriere.it/rss/homepage.xml',
      source: 'Corriere della Sera',
      language: 'it',
    },
    {
      url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml',
      source: 'La Repubblica',
      language: 'it',
    },

    // English
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      source: 'The New York Times',
      language: 'en',
    },
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', source: 'BBC News', language: 'en' },
    { url: 'https://www.theguardian.com/world/rss', source: 'The Guardian', language: 'en' },

    // Spanish
    {
      url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada',
      source: 'El País',
      language: 'es',
    },
    {
      url: 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml',
      source: 'El Mundo',
      language: 'es',
    },

    // Portuguese
    { url: 'https://www.publico.pt/rss', source: 'Público', language: 'pt' },
    {
      url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml',
      source: 'Folha de S.Paulo',
      language: 'pt',
    },

    // French
    { url: 'https://www.lemonde.fr/rss/une.xml', source: 'Le Monde', language: 'fr' },
    {
      url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml',
      source: 'Le Figaro',
      language: 'fr',
    },
  ];

  constructor() {
    this.loadFeeds();
  }

  getNewsItems() {
    return this.newsItems.asReadonly();
  }

  private async loadFeeds() {
    const allNews: NewsItem[] = [];

    for (const feed of this.feeds) {
      try {
        const items = await this.fetchFeed(feed.url, feed.source, feed.language);
        allNews.push(...items);
      } catch (error) {
        console.error(`Error fetching feed from ${feed.source}:`, error);
      }
    }

    // Sort by date (newest first) and update signal
    allNews.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
    this.newsItems.set(allNews);
  }

  private async fetchFeed(url: string, source: string, language: string): Promise<NewsItem[]> {
    // Try multiple CORS proxy services in order
    const proxies = [
      // AllOrigins - free CORS proxy
      {
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        parser: (data: any) => this.parseXmlFromAllOrigins(data, source, language),
      },
      // RSS2JSON without API key (limited to 10000 requests/day)
      {
        url: `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=5`,
        parser: (data: any) => this.parseFromRss2Json(data, source, language),
      },
      // CORS Anywhere (public instance - may be rate limited)
      {
        url: `https://cors-anywhere.herokuapp.com/${url}`,
        parser: (data: any) => this.parseXmlDirect(data, source, language),
      },
    ];

    for (const proxy of proxies) {
      try {
        const response = await fetch(proxy.url);
        if (!response.ok) continue;

        const data = await response.json();
        const items = proxy.parser(data);

        if (items.length > 0) {
          console.log(`✅ Successfully fetched ${items.length} items from ${source}`);
          return items;
        }
      } catch (error) {
        // Try next proxy
        continue;
      }
    }

    console.warn(`⚠️ All proxies failed for ${source}`);
    return [];
  }

  private parseFromRss2Json(data: any, source: string, language: string): NewsItem[] {
    if (data.status === 'ok' && data.items) {
      return data.items.slice(0, 5).map((item: any) => ({
        title: item.title,
        description: this.stripHtml(item.description || item.content || ''),
        link: item.link,
        pubDate: new Date(item.pubDate),
        source: source,
        language: language,
        imageUrl:
          item.thumbnail ||
          item.enclosure?.link ||
          this.extractImageFromDescription(item.description || item.content),
      }));
    }
    return [];
  }

  private parseXmlFromAllOrigins(data: any, source: string, language: string): NewsItem[] {
    if (!data.contents) return [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
      return this.parseXmlDocument(xmlDoc, source, language);
    } catch (error) {
      console.error('Error parsing XML from AllOrigins:', error);
      return [];
    }
  }

  private parseXmlDirect(xmlString: string, source: string, language: string): NewsItem[] {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      return this.parseXmlDocument(xmlDoc, source, language);
    } catch (error) {
      console.error('Error parsing XML directly:', error);
      return [];
    }
  }

  private parseXmlDocument(xmlDoc: Document, source: string, language: string): NewsItem[] {
    const items: NewsItem[] = [];
    const itemElements = xmlDoc.querySelectorAll('item, entry');

    itemElements.forEach((item, index) => {
      if (index >= 5) return; // Limit to 5 items per feed

      const title = item.querySelector('title')?.textContent || '';
      const link =
        item.querySelector('link')?.textContent ||
        item.querySelector('link')?.getAttribute('href') ||
        '';
      const description = item.querySelector('description, summary, content')?.textContent || '';
      const pubDateStr = item.querySelector('pubDate, published, updated')?.textContent || '';

      // Extract image from various possible locations
      let imageUrl = '';

      // Try media:content (common in RSS feeds)
      const mediaContent = item.querySelector('content[url], media\\:content[url]');
      if (mediaContent) {
        imageUrl = mediaContent.getAttribute('url') || '';
      }

      // Try enclosure (podcast/media RSS)
      if (!imageUrl) {
        const enclosure = item.querySelector('enclosure[type^="image"]');
        if (enclosure) {
          imageUrl = enclosure.getAttribute('url') || '';
        }
      }

      // Try media:thumbnail
      if (!imageUrl) {
        const thumbnail = item.querySelector('thumbnail[url], media\\:thumbnail[url]');
        if (thumbnail) {
          imageUrl = thumbnail.getAttribute('url') || '';
        }
      }

      // Try to extract from description HTML
      if (!imageUrl) {
        imageUrl = this.extractImageFromDescription(description);
      }

      if (title && link) {
        items.push({
          title: title.trim(),
          description: this.stripHtml(description).trim().substring(0, 200),
          link: link.trim(),
          pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
          source: source,
          language: language,
          imageUrl: imageUrl || undefined,
        });
      }
    });

    return items;
  }

  private extractImageFromDescription(html: string): string {
    if (!html) return '';

    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;

      // Try to find img tag
      const img = tmp.querySelector('img');
      if (img && img.src) {
        return img.src;
      }

      // Try to find image URL in text using regex
      const imgRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i;
      const match = html.match(imgRegex);
      if (match) {
        return match[1];
      }
    } catch (error) {
      console.error('Error extracting image from description:', error);
    }

    return '';
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  async refreshFeeds() {
    await this.loadFeeds();
  }

  getNewsByLanguage(language: string): NewsItem[] {
    return this.newsItems().filter((item) => item.language === language);
  }

  getLatestNews(count: number = 10): NewsItem[] {
    return this.newsItems().slice(0, count);
  }
}
