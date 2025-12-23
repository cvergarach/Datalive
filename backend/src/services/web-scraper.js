const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

/**
 * Scrapes web content from a URL and converts it to text suitable for AI analysis
 * @param {string} url - The URL to scrape
 * @returns {Promise<{content: string, mimeType: string, title: string}>}
 */
async function scrapeWebContent(url) {
    try {
        console.log(`🌐 Scraping URL: ${url}`);

        // Fetch the content
        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DataLive/1.0; +https://datalive.app)'
            },
            maxRedirects: 5
        });

        const contentType = response.headers['content-type'] || '';

        // Check if it's a JSON/YAML file (OpenAPI/Swagger spec)
        if (contentType.includes('application/json') || url.endsWith('.json')) {
            console.log('📄 Detected JSON content (possibly OpenAPI spec)');
            const jsonContent = typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data, null, 2);

            return {
                content: jsonContent,
                mimeType: 'application/json',
                title: extractTitleFromJson(response.data) || 'API Specification'
            };
        }

        if (contentType.includes('yaml') || url.endsWith('.yaml') || url.endsWith('.yml')) {
            console.log('📄 Detected YAML content (possibly OpenAPI spec)');
            return {
                content: response.data,
                mimeType: 'text/yaml',
                title: 'API Specification'
            };
        }

        // Otherwise, treat as HTML
        console.log('🌐 Processing HTML content');
        const html = response.data;
        const $ = cheerio.load(html);

        // Remove script and style tags
        $('script, style, nav, footer, header, aside').remove();

        // Extract title
        const title = $('title').text().trim() || $('h1').first().text().trim() || 'API Documentation';

        // Convert HTML to Markdown for better structure
        const bodyHtml = $('body').html() || html;
        const markdown = turndownService.turndown(bodyHtml);

        // Clean up excessive whitespace
        const cleanedContent = markdown
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        console.log(`✅ Scraped ${cleanedContent.length} characters from ${url}`);

        return {
            content: cleanedContent,
            mimeType: 'text/markdown',
            title
        };

    } catch (error) {
        console.error('❌ Error scraping URL:', error.message);

        if (error.code === 'ENOTFOUND') {
            throw new Error('URL not found. Please check the URL and try again.');
        }
        if (error.code === 'ETIMEDOUT') {
            throw new Error('Request timed out. The website might be slow or unreachable.');
        }
        if (error.response?.status === 404) {
            throw new Error('Page not found (404). Please check the URL.');
        }
        if (error.response?.status === 403) {
            throw new Error('Access forbidden (403). The website might be blocking automated requests.');
        }

        throw new Error(`Failed to scrape URL: ${error.message}`);
    }
}

/**
 * Extracts title from OpenAPI/Swagger JSON
 */
function extractTitleFromJson(data) {
    if (typeof data === 'object') {
        return data.info?.title || data.swagger?.info?.title || data.openapi?.info?.title;
    }
    return null;
}

/**
 * Validates if a URL is properly formatted
 */
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

module.exports = {
    scrapeWebContent,
    isValidUrl
};
