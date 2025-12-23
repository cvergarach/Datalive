import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

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

/**
 * Extracts all links from HTML content
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative links
 * @returns {string[]} Array of absolute URLs
 */
function extractLinks(html, baseUrl) {
    const $ = cheerio.load(html);
    const links = new Set();

    $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (!href) return;

        try {
            // Resolve relative URLs
            const absoluteUrl = new URL(href, baseUrl).href;
            links.add(absoluteUrl);
        } catch (e) {
            // Invalid URL, skip
        }
    });

    return Array.from(links);
}

/**
 * Checks if a URL is relevant for API documentation crawling
 * @param {string} url - URL to check
 * @param {string} baseUrl - Starting URL for comparison
 * @returns {boolean}
 */
function isRelevantLink(url, baseUrl) {
    try {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);

        // Must be same origin
        if (urlObj.origin !== baseObj.origin) {
            return false;
        }

        const path = urlObj.pathname.toLowerCase();

        // Exclude non-documentation paths
        const excludePatterns = [
            '/blog', '/pricing', '/about', '/contact', '/login', '/signup',
            '/terms', '/privacy', '/legal', '/support', '/community',
            '.pdf', '.zip', '.tar', '.gz', '/download'
        ];

        if (excludePatterns.some(pattern => path.includes(pattern))) {
            return false;
        }

        // Include API documentation paths
        const includePatterns = [
            '/api', '/docs', '/reference', '/guide', '/documentation',
            '/endpoint', '/resource', '/method', '/v1', '/v2', '/v3'
        ];

        return includePatterns.some(pattern => path.includes(pattern));
    } catch (e) {
        return false;
    }
}

/**
 * Crawls documentation recursively to discover API endpoints
 * @param {string} startUrl - Starting URL
 * @param {Object} options - Crawling options
 * @returns {Promise<{content: string, mimeType: string, title: string, crawledPages: number}>}
 */
async function crawlDocumentation(startUrl, options = {}) {
    const {
        maxDepth = 2,
        maxPages = 10,
        timeout = 60000,
        sameOriginOnly = true
    } = options;

    console.log(`🕷️ Starting crawl from: ${startUrl}`);
    console.log(`📋 Settings: maxDepth=${maxDepth}, maxPages=${maxPages}`);

    const visited = new Set();
    const queue = [{ url: startUrl, depth: 0 }];
    const pages = [];
    const startTime = Date.now();

    while (queue.length > 0 && pages.length < maxPages) {
        // Check timeout
        if (Date.now() - startTime > timeout) {
            console.log('⏱️ Crawl timeout reached');
            break;
        }

        const { url, depth } = queue.shift();

        // Skip if already visited
        if (visited.has(url)) continue;
        visited.add(url);

        try {
            console.log(`  📄 Crawling [${pages.length + 1}/${maxPages}] depth=${depth}: ${url}`);

            // Fetch page
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DataLive/1.0; +https://datalive.app)'
                },
                maxRedirects: 3
            });

            const contentType = response.headers['content-type'] || '';

            // Handle JSON/YAML specs directly
            if (contentType.includes('application/json') || url.endsWith('.json')) {
                const jsonContent = typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data, null, 2);

                return {
                    content: jsonContent,
                    mimeType: 'application/json',
                    title: extractTitleFromJson(response.data) || 'API Specification',
                    crawledPages: 1
                };
            }

            // Process HTML
            const html = response.data;
            const $ = cheerio.load(html);

            // Remove non-content elements
            $('script, style, nav, footer, header, aside, .sidebar, .navigation').remove();

            // Extract title
            const pageTitle = $('title').text().trim() || $('h1').first().text().trim() || url;

            // Convert to markdown
            const bodyHtml = $('body').html() || html;
            const markdown = turndownService.turndown(bodyHtml);

            // Store page content
            pages.push({
                url,
                title: pageTitle,
                content: markdown.replace(/\n{3,}/g, '\n\n').trim()
            });

            // Extract and queue links if not at max depth
            if (depth < maxDepth) {
                const links = extractLinks(html, url);
                const relevantLinks = links.filter(link => isRelevantLink(link, startUrl));

                console.log(`    🔗 Found ${relevantLinks.length} relevant links`);

                for (const link of relevantLinks) {
                    if (!visited.has(link) && pages.length + queue.length < maxPages) {
                        queue.push({ url: link, depth: depth + 1 });
                    }
                }
            }

        } catch (error) {
            console.error(`  ❌ Error crawling ${url}:`, error.message);
            // Continue with next URL
        }
    }

    console.log(`✅ Crawl complete: ${pages.length} pages discovered`);

    // Aggregate all content
    const aggregatedContent = pages.map((page, index) => {
        return `# Page ${index + 1}: ${page.title}\n\nSource: ${page.url}\n\n${page.content}`;
    }).join('\n\n---\n\n');

    return {
        content: aggregatedContent,
        mimeType: 'text/markdown',
        title: pages[0]?.title || 'API Documentation',
        crawledPages: pages.length
    };
}

export { scrapeWebContent, crawlDocumentation, isValidUrl };
