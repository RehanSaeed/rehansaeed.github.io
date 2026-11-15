import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { z } from "zod";
import { createSearchService } from "../../shared/utils/search.ts";
import { tagPath } from "../../shared/utils/tag.ts";
import type { BlogTool } from "../../app/framework/webmcp.ts";

const source = stripTypeScriptTypes(
    await readFile(
        new URL("../../app/framework/webmcp.ts", import.meta.url),
        "utf8",
    ),
)
    .replace(/^import.*;\r?$/gm, "")
    .replace(/\bexport /g, "");
const { createBlogTools, registerBlogTools, readArticleOutline } =
    runInNewContext(
        `${source}\n({ createBlogTools, registerBlogTools, readArticleOutline });`,
        { z, tagPath, AbortController, URL },
    ) as {
        createBlogTools: (document: object, dependencies: object) => BlogTool[];
        registerBlogTools: (
            document: object,
            dependencies: object,
        ) => { ready: Promise<void>; dispose: () => void } | undefined;
        readArticleOutline: (
            document: object,
            path: string,
            url: string,
        ) => {
            url: string;
            headings: { url: string; text: string; level: number }[];
        };
    };

const pluginSource = stripTypeScriptTypes(
    await readFile(
        new URL("../../app/plugins/webmcp.client.ts", import.meta.url),
        "utf8",
    ),
)
    .replace(/^import.*;\r?$/gm, "")
    .replace("export default ", "")
    .replaceAll("import.meta.hot", "hot")
    .replace('import("~/framework/webmcp")', "loadAdapter()")
    .replace('import("~/framework/search")', "loadSearch()");

await test("Client plugin skips adapter imports entirely when the current browser API is unsupported", () => {
    let loads = 0;
    runInNewContext(pluginSource, {
        document: {},
        defineNuxtPlugin: (plugin: () => void) => {
            plugin();
        },
        loadAdapter: () => {
            loads++;
        },
        loadSearch: () => {
            loads++;
        },
        hot: undefined,
    });
    assert.equal(loads, 0);
});

await test("Client plugin HMR disposal during lazy imports prevents late registration", async () => {
    let finish!: (adapter: object) => void;
    let dispose!: () => void;
    let registrations = 0;
    const adapter = new Promise((resolve) => {
        finish = resolve;
    });
    runInNewContext(pluginSource, {
        document: { modelContext: { registerTool: () => {} } },
        defineNuxtPlugin: (plugin: () => void) => {
            plugin();
        },
        useRouter: () => ({ currentRoute: { value: { path: "/" } } }),
        useAppConfig: () => ({ site: { url: "https://rehansaeed.com" } }),
        loadAdapter: () => adapter,
        loadSearch: () => Promise.resolve({ siteSearch: {} }),
        hot: {
            dispose: (callback: () => void) => {
                dispose = callback;
            },
        },
        console,
    });
    dispose();
    finish({
        registerBlogTools: () => {
            registrations++;
        },
    });
    await adapter;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(registrations, 0);
});

const documents = [
    {
        id: 1,
        index: "post",
        published: true,
        title: "Vue Search",
        description: "Accessible search with Vue",
        permalink: "/vue-search/",
        heroImage: "",
        tags: ["Vue", "C#", "Vue"],
    },
    {
        id: 2,
        index: "post",
        published: false,
        title: "Vue Draft",
        description: "Search draft",
        permalink: "/vue-draft/",
        heroImage: "",
        tags: ["Draft only"],
    },
    {
        id: 3,
        index: "portfolio",
        published: true,
        title: "Vue Portfolio",
        description: "Search project",
        permalink: "https://example.com/project",
        heroImage: "",
        tags: ["Portfolio only"],
    },
    {
        id: 4,
        index: "post",
        published: true,
        title: "Other article",
        description: "Vue search guide",
        permalink: "/other-article/",
        heroImage: "",
        tags: ["Vue"],
    },
];
const createHarness = (
    fetchDocuments = (): Promise<unknown> => Promise.resolve(documents),
) => {
    const search = createSearchService(fetchDocuments);
    const dependencies = {
        search,
        siteUrl: "https://rehansaeed.com",
        routePath: () => "/",
    };
    const tools = createBlogTools({}, dependencies);
    const execute = (
        name: string,
        input: unknown,
        signal = new AbortController().signal,
    ) => tools.find((tool) => tool.name === name)!.execute(input, { signal });
    return { search, dependencies, tools, execute };
};

await test("Shared search remains lazy, deduplicates concurrent loads and preserves ordinary portfolio/draft search", async () => {
    let loads = 0;
    const app = createHarness(() => {
        loads++;
        return Promise.resolve(documents);
    });
    assert.equal(loads, 0);
    const [ordinary, articles] = await Promise.all([
        app.search.search("Vue"),
        app.search.search("Vue", 8, true),
    ]);
    assert.equal(loads, 1);
    assert.equal(ordinary.length, 4);
    assert.deepEqual(articles.map((article) => article.id).sort(), [1, 4]);
    assert.equal((await app.search.search("Vu")).length, 0);
});

await test("Search failures reject and a later request retries; malformed external JSON is rejected", async () => {
    let loads = 0;
    const app = createHarness(() => {
        loads++;
        if (loads === 1) {
            return Promise.reject(new Error("offline"));
        }
        return Promise.resolve(documents);
    });
    await assert.rejects(
        app.execute("search_articles", { query: "Vue" }),
        /offline/,
    );
    assert.equal((await app.search.search("Vue", 8, true)).length, 2);
    await assert.rejects(
        createHarness(() => Promise.resolve([{ title: "invalid" }])).execute(
            "list_topics",
            {},
        ),
        z.ZodError,
    );
});

await test("Article output has only bounded public metadata and canonical URLs", async () => {
    const result = (await createHarness().execute("search_articles", {
        query: " Vue ",
        limit: 1,
    })) as {
        articles: { title: string; description: string; url: string }[];
    };
    assert.equal(result.articles.length, 1);
    assert.deepEqual(Object.keys(result.articles[0]!).sort(), [
        "description",
        "title",
        "url",
    ]);
    assert.match(result.articles[0]!.url, /^https:\/\/rehansaeed.com\//);
    const app = createHarness(() =>
        Promise.resolve([
            {
                ...documents[0],
                title: "Vue ".repeat(500),
                description: "Vue ".repeat(1500),
            },
        ]),
    );
    const long = (await app.execute("search_articles", {
        query: "Vue",
    })) as typeof result;
    assert.equal(long.articles[0]!.title.length, 300);
    assert.equal(long.articles[0]!.description.length, 2000);
});

await test("Topics count each article once, omit non-published tags, filter and paginate with real browse URLs", async () => {
    const app = createHarness();
    const first = (await app.execute("list_topics", { limit: 1 })) as {
        topics: { name: string; articleCount: number; url: string }[];
        total: number;
        nextOffset: number | null;
    };
    assert.equal(first.total, 2);
    assert.equal(first.nextOffset, 1);
    assert.equal(first.topics[0]!.url, "https://rehansaeed.com/tag/c/");
    const second = (await app.execute("list_topics", {
        offset: 1,
        limit: 1,
    })) as typeof first;
    assert.equal(second.topics[0]!.name, "Vue");
    assert.equal(second.topics[0]!.articleCount, 2);
    assert.equal(second.nextOffset, null);
    const filtered = (await app.execute("list_topics", {
        query: "vUE",
    })) as typeof first;
    assert.equal(filtered.topics.length, 1);
});

await test("Browser input schemas keep defaulted arguments optional instead of requiring parser output fields", () => {
    const schema = z.object({ required: z.array(z.string()).optional() });
    const tools = createHarness().tools;
    const search = schema.parse(
        tools.find((tool) => tool.name === "search_articles")!.inputSchema,
    );
    assert.deepEqual(search.required, ["query"]);
    const topics = schema.parse(
        tools.find((tool) => tool.name === "list_topics")!.inputSchema,
    );
    assert.equal(topics.required?.length ?? 0, 0);
});

await test("All argument schemas reject unknown keys and invalid bounds without loading data", async () => {
    let loads = 0;
    const app = createHarness(() => {
        loads++;
        return Promise.resolve(documents);
    });
    for (const input of [
        { query: "ab" },
        { query: "   " },
        { query: "x".repeat(201) },
        { query: "Vue", limit: 0 },
        { query: "Vue", limit: 9 },
        { query: "Vue", limit: 1.5 },
        { query: "Vue", url: "https://example.com" },
    ]) {
        await assert.rejects(
            async () => app.execute("search_articles", input),
            z.ZodError,
        );
    }
    for (const input of [
        { limit: 51 },
        { offset: -1 },
        { offset: 10001 },
        { query: "x".repeat(101) },
        { url: "/" },
    ]) {
        await assert.rejects(
            async () => app.execute("list_topics", input),
            z.ZodError,
        );
    }
    await assert.rejects(
        async () => app.execute("get_article_outline", { url: "/" }),
        z.ZodError,
    );
    assert.equal(loads, 0);
});

await test("Cancellation rejects both before loading and after a shared pending load finishes", async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
        createHarness().execute(
            "search_articles",
            { query: "Vue" },
            controller.signal,
        ),
        /abort/i,
    );
    let finish!: (value: unknown) => void;
    const app = createHarness(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            }),
    );
    const pending = new AbortController();
    const result = app.execute("list_topics", {}, pending.signal);
    pending.abort();
    finish(documents);
    await assert.rejects(result, /abort/i);
});

await test("Unsupported browsers do nothing; registration is deduplicated and abort cleanup permits re-registration", async () => {
    const { dependencies } = createHarness();
    assert.equal(registerBlogTools({}, dependencies), undefined);
    const tools = new Map<string, BlogTool>();
    const document = {
        modelContext: {
            registerTool: (
                tool: BlogTool,
                { signal }: { signal: AbortSignal },
            ) => {
                assert.equal(tools.has(tool.name), false);
                tools.set(tool.name, tool);
                signal.addEventListener(
                    "abort",
                    () => tools.delete(tool.name),
                    { once: true },
                );
                return Promise.resolve();
            },
        },
    };
    const registration = registerBlogTools(document, dependencies)!;
    assert.equal(registerBlogTools(document, dependencies), registration);
    await registration.ready;
    assert.equal(tools.size, 3);
    for (const tool of tools.values()) {
        assert.equal(tool.annotations.readOnlyHint, true);
        assert.equal(tool.annotations.consequentialHint, false);
        assert.equal(tool.annotations.untrustedContentHint, true);
    }
    registration.dispose();
    assert.equal(tools.size, 0);
    const next = registerBlogTools(document, dependencies)!;
    await next.ready;
    assert.equal(tools.size, 3);
    next.dispose();
});

await test("Partial registration failure removes already registered tools and surfaces the failure", async () => {
    let registered = false;
    const document = {
        modelContext: {
            registerTool: (
                tool: BlogTool,
                { signal }: { signal: AbortSignal },
            ) => {
                if (tool.name === "get_article_outline") {
                    return Promise.reject(new Error("permission denied"));
                }
                registered = true;
                signal.addEventListener("abort", () => {
                    registered = false;
                });
                return Promise.resolve();
            },
        },
    };
    await assert.rejects(
        registerBlogTools(document, createHarness().dependencies)!.ready,
        /permission denied/,
    );
    assert.equal(registered, false);
});

await test("Late rejection from a disposed registration does not remove its replacement", async () => {
    let rejectFirst!: (error: Error) => void;
    let first = true;
    const document = {
        modelContext: {
            registerTool: () => {
                if (first) {
                    first = false;
                    return new Promise<void>((_resolve, reject) => {
                        rejectFirst = reject;
                    });
                }
                return Promise.resolve();
            },
        },
    };
    const dependencies = createHarness().dependencies;
    const old = registerBlogTools(document, dependencies)!;
    old.dispose();
    const replacement = registerBlogTools(document, dependencies)!;
    await replacement.ready;
    rejectFirst(new Error("registration aborted"));
    await assert.rejects(old.ready, /registration aborted/);
    assert.equal(registerBlogTools(document, dependencies), replacement);
    replacement.dispose();
});

await test("Outline bounds long text and explicitly marks omitted headings", () => {
    const article = {
        dataset: { postPermalink: "/current/", postPublished: "true" },
        querySelector: () => ({ textContent: "Current article" }),
        querySelectorAll: () =>
            Array.from({ length: 101 }, (_, index) => ({
                tagName: "H2",
                textContent: "x".repeat(400),
                id: `section-${index}`,
            })),
    };
    const outline = readArticleOutline(
        { querySelectorAll: () => [article] },
        "/current/",
        "https://rehansaeed.com",
    );
    assert.equal(outline.headings.length, 100);
    assert.equal(outline.headings[0]!.text.length, 300);
    assert.equal("truncated" in outline && outline.truncated, true);
});

await test("Outline refuses previous-route and draft DOM and uses exact rendered heading IDs", () => {
    const article = {
        dataset: { postPermalink: "/current/", postPublished: "true" },
        querySelector: () => ({ textContent: "Current article" }),
        querySelectorAll: () => [
            {
                tagName: "H2",
                textContent: "Precise section",
                id: "precise-section-1",
            },
        ],
    };
    const document = { querySelectorAll: () => [article] };
    const outline = readArticleOutline(
        document,
        "/current",
        "https://rehansaeed.com",
    );
    assert.equal(
        outline.headings[0]!.url,
        "https://rehansaeed.com/current/#precise-section-1",
    );
    assert.throws(
        () => readArticleOutline(document, "/next/", "https://rehansaeed.com"),
        /no rendered published article/,
    );
    article.dataset.postPublished = "false";
    assert.throws(
        () =>
            readArticleOutline(document, "/current/", "https://rehansaeed.com"),
        /no rendered published article/,
    );
});
