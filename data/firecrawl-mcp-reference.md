# Firecrawl MCP — Reference Guide

## What It Is

Firecrawl MCP is a Model Context Protocol server that gives Claude direct access to the web. It can scrape pages, search the web, crawl entire sites, interact with live browsers, and run autonomous research agents. It is installed globally and registered in your Claude Code config.

---

## Setup (Already Done)

- Package: `firecrawl-mcp` v3.11.0 (npm global)
- MCP name in Claude Code: `firecrawl`
- Config file: `C:\Users\nspel\.claude.json`
- API key: set as `FIRECRAWL_API_KEY` environment variable

---

## Available Tools

### firecrawl_scrape

Scrapes a single URL and returns its content.

**Use when:** You have one specific URL and want its content.

**Format options:**

- JSON (preferred): extracts only the fields you define via a schema
- Markdown: returns full page content as text

**When to use JSON vs markdown:**
Use JSON when you need specific data (price, title, product specs). Use markdown only when you need the entire page text, such as reading a full article.

**Example — JSON:**

```json
{
  "name": "firecrawl_scrape",
  "arguments": {
    "url": "https://example.com/product",
    "formats": [{
      "type": "json",
      "prompt": "Extract the product information",
      "schema": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "price": { "type": "number" },
          "description": { "type": "string" }
        },
        "required": ["name", "price"]
      }
    }]
  }
}
```

---

### firecrawl_batch_scrape

Scrapes multiple known URLs in parallel.

**Use when:** You have a list of URLs and want content from all of them.

**Do not use:** for discovering URLs — use `map` first, then batch_scrape.

---

### firecrawl_search

Searches the web and returns results with full page content.

**Use when:** You need to find information but do not have specific URLs.

**Example prompt:** "Search for the latest Claude model releases."

---

### firecrawl_map

Discovers all URLs on a site or section.

**Use when:** You want to know what pages exist on a site before scraping them.

**Common pattern:** map → batch_scrape.

---

### firecrawl_crawl

Crawls multiple pages from a site and extracts content from all of them.

**Use when:** You want to extract content from an entire section of a site.

**Warning:** Always set limits. Unlimited crawls can consume credits fast.

---

### firecrawl_interact

Interacts with a page that was already scraped — clicks, navigation, form input.

**Use when:** The page requires user interaction before showing the content you need.

---

### firecrawl_agent

Runs an autonomous research agent across multiple sources.

**Use when:** Your question requires gathering information from many unknown sources and synthesizing it.

**Returns:** Structured JSON data.

---

## Tool Selection Quick Reference

| What you want to do | Tool to use |
|---|---|
| Get content from one URL | `firecrawl_scrape` |
| Get content from many URLs | `firecrawl_batch_scrape` |
| Find what URLs exist on a site | `firecrawl_map` |
| Search the web | `firecrawl_search` |
| Extract from a whole site | `firecrawl_crawl` |
| Click buttons or fill forms | `firecrawl_interact` |
| Multi-source research | `firecrawl_agent` |

---

## Optional Environment Variables

Set these in your shell or MCP config if needed.

| Variable | Purpose | Default |
|---|---|---|
| `FIRECRAWL_RETRY_MAX_ATTEMPTS` | Max retries on failure | 3 |
| `FIRECRAWL_RETRY_INITIAL_DELAY` | Delay before first retry (ms) | 1000 |
| `FIRECRAWL_RETRY_MAX_DELAY` | Max delay between retries (ms) | 10000 |
| `FIRECRAWL_RETRY_BACKOFF_FACTOR` | Exponential backoff multiplier | 2 |
| `FIRECRAWL_CREDIT_WARNING_THRESHOLD` | Warn when credits drop to this level | 1000 |
| `FIRECRAWL_CREDIT_CRITICAL_THRESHOLD` | Critical alert at this level | 100 |
| `FIRECRAWL_API_URL` | Custom URL for self-hosted instance | (cloud API) |

---

## Credit Usage Notes

- Each scrape, crawl, and search consumes credits from your Firecrawl account.
- JSON format uses fewer credits than markdown because it returns less data.
- The `crawl` tool can consume credits quickly without limits — always set a page cap.
- Monitor usage at: https://www.firecrawl.dev/app/api-keys

---

## Common Prompt Patterns

**Scrape a page and extract structured data:**
"Scrape [URL] and return the product name, price, and availability as JSON."

**Search and summarize:**
"Search for [topic] and give me the key findings from the top results."

**Map and scrape a site section:**
"Map all URLs under [URL]/docs, then scrape the ones about authentication."

**Deep research:**
"Use the research agent to find and compare pricing for [product] across multiple sources."

---

## Troubleshooting

- **Tool not found:** Restart Claude Code after adding the MCP server.
- **API key errors:** Verify `FIRECRAWL_API_KEY` is set correctly in your MCP config.
- **Timeout on large crawls:** Set `FIRECRAWL_RETRY_MAX_DELAY` higher and reduce crawl scope.
- **Rate limit errors:** The server handles these automatically with exponential backoff.

---

*Source: https://github.com/mendableai/firecrawl-mcp-server*
