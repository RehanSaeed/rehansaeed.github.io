# Browser tools (WebMCP)

The blog progressively enhances supported browsers with three **read-only**
tools. Ordinary search, keyboard navigation and article links work without
WebMCP. There is no chatbot, remote MCP server, model subscription or new setting.
Registration does not download the search index; it is loaded on demand and
shared with ordinary search.

| Tool                  | Arguments                                                                   | Result                                                                                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search_articles`     | `query` (3-200 characters), optional `limit` (1-8)                          | Published article titles, descriptions and canonical URLs, using the existing title/description prefix search. No article-body or portfolio search.                                                                              |
| `get_article_outline` | `{}`                                                                        | Current published article title, canonical URL and up to 100 rendered section headings with exact fragment links. `truncated` indicates omitted headings. Rejects on drafts, other pages or when the new route has not rendered. |
| `list_topics`         | Optional `query` (up to 100 characters), `limit` (1-50), `offset` (0-10000) | Published article tags, article counts and canonical browse URLs, alphabetically ordered. `total` and `nextOffset` support paging. Draft-only and portfolio-only tags are excluded.                                              |

Search defaults to 8 results; topics default to 20. Titles and heading text are
bounded to 300 characters and descriptions to 2000. Invalid arguments, load
failures and cancellation reject rather than returning success-shaped errors.
The tools never navigate, move focus, submit forms or read personal state. Tool
outputs contain article text as **untrusted data**, not agent instructions.
Registration stays document-scoped across SPA navigation; HMR aborts registrations
before replacement. Other origins are not granted tool access.

## Try the tools

WebMCP is experimental and not universally available. The integration follows
the current [`document.modelContext` imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
(reviewed 2026-11-14), including asynchronous registration and abort-based
unregistration. Older `navigator.modelContext` implementations are not supported.
The [specification](https://webmachinelearning.github.io/webmcp/) and browser
implementations may change.

Use a compatible Chrome build with WebMCP enabled. Chrome's
[WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp) describes the
origin trial (from Chrome 149) and the local testing flag
`chrome://flags/#enable-webmcp-testing`. Enabling a flag/restarting the browser or
enrolling in a trial is a **user action**, not something the site does.

Open the preview or deployed blog in that browser, then use DevTools:

```js
if (!document.modelContext) {
  throw new Error("This browser does not expose the current WebMCP API.");
}
const tools = await document.modelContext.getTools();
const run = async (name, input) => {
  const tool = tools.find((tool) => tool.name === name);
  if (!tool) throw new Error(`Tool not registered: ${name}`);
  return document.modelContext.executeTool(tool, input);
};
await run("search_articles", { query: "Vue", limit: 3 });
await run("list_topics", { query: "TypeScript", limit: 10 });
// Open a published article using its ordinary link, then run:
await run("get_article_outline", {});
```

Navigate to another published article and repeat the outline call: its links
must reference the new article, not the previous one. Calling it on the homepage
or a draft should reject. All returned links point to the canonical public site,
including when running a local preview.

An agent must itself support WebMCP tool discovery/execution. Access to ordinary
browser automation does **not** imply that an agent can consume these tools.
The DevTools example needs no agent, model or third-party API. API-mocked unit
and browser tests verify our adapter and route behavior, **not native browser
interoperability**; native verification requires the enabled browser described
above. No polyfill disguises unsupported browsers as supported.
