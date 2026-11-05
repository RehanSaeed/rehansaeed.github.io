import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test, { type TestContext } from "node:test";
import { stringify } from "yaml";
import { scanContent } from "../../modules/blog-content/scan.ts";

const metadata = {
    title: "Content fixture",
    heroImage: "/images/hero/Code-1600x900.jpg",
    permalink: "/content-fixture/",
    published: false,
};

const fixture = async (
    context: TestContext,
    frontMatter: string,
    collection: "posts" | "portfolio" = "posts",
) => {
    const root = await mkdtemp(join(tmpdir(), "blog-content-validation-"));
    context.after(() => rm(root, { recursive: true, force: true }));
    const file = join(root, collection, "2026", "fixture", "index.md");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `---\n${frontMatter}\n---\n\nFixture content.\n`);
    return root;
};

await test("Scanner validates consumed fields without requiring generated collection fields", async (context) => {
    const root = await fixture(
        context,
        stringify({
            ...metadata,
            description: "Preserved extra article metadata.",
            tags: ["TypeScript"],
        }),
    );
    const entries = await scanContent(root);
    assert.equal(entries.length, 1);
    const entry = entries[0];
    assert.ok(entry);
    assert.equal(entry.path, "posts/2026/fixture/index.md");
    assert.equal(entry.collection, "posts");
    assert.equal(entry.data.published, false);
    assert.equal(entry.data.kind, undefined);
    assert.equal(entry.data.description, "Preserved extra article metadata.");
    assert.deepEqual(entry.data.tags, ["TypeScript"]);
});

for (const tags of [undefined, null, []]) {
    await test(`Scanner preserves empty tags: ${JSON.stringify(tags)}`, async (context) => {
        const root = await fixture(context, stringify({ ...metadata, tags }));
        const [entry] = await scanContent(root);
        assert.ok(entry);
        assert.deepEqual(entry.data.tags, []);
    });
}

await test("Portfolio source accepts package identifiers before generated download counts exist", async (context) => {
    const root = await fixture(
        context,
        stringify({
            ...metadata,
            published: true,
            kind: "microsoft",
            nugetPackages: [
                { id: "Example.Package", extra: "Preserved metadata" },
            ],
        }),
        "portfolio",
    );
    const [entry] = await scanContent(root);
    assert.ok(entry);
    assert.equal(entry.collection, "portfolio");
    assert.equal(entry.data.published, true);
    assert.equal(entry.data.kind, "microsoft");
    assert.deepEqual(entry.data.nugetPackages, [
        { id: "Example.Package", extra: "Preserved metadata" },
    ]);
});

for (const [name, invalid, field] of [
    ["quoted false", { ...metadata, published: "false" }, "published"],
    ["quoted true", { ...metadata, published: "true" }, "published"],
    ["scalar tags", { ...metadata, tags: "TypeScript" }, "tags"],
    ["non-string tag", { ...metadata, tags: [1] }, "tags"],
    ["invalid kind", { ...metadata, kind: "unknown" }, "kind"],
    ["non-string title", { ...metadata, title: 1 }, "title"],
    ["missing hero", { ...metadata, heroImage: undefined }, "heroImage"],
    ["non-string permalink", { ...metadata, permalink: 1 }, "permalink"],
    [
        "invalid package ID type",
        { ...metadata, nugetPackages: [{ id: 1 }] },
        "id",
    ],
    ["non-object front matter", ["not", "an", "object"], "object"],
] as const) {
    await test(`Scanner rejects ${name} with its content path`, async (context) => {
        const root = await fixture(context, stringify(invalid));
        await assert.rejects(scanContent(root), (error: unknown) => {
            assert.ok(error instanceof Error);
            assert.match(
                error.message,
                /Invalid front matter in content\/posts\/2026\/fixture\/index\.md/,
            );
            assert.match(error.message, new RegExp(field));
            assert.ok(error.cause instanceof Error);
            return true;
        });
    });
}

await test("Malformed YAML reports its content path and preserves the parser error", async (context) => {
    const root = await fixture(context, "title: [unterminated");
    await assert.rejects(scanContent(root), (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(
            error.message,
            /Invalid YAML front matter in content\/posts\/2026\/fixture\/index\.md/,
        );
        assert.ok(error.cause instanceof Error);
        return true;
    });
});

await test("Every existing article and portfolio entry retains valid scanner metadata", async () => {
    const entries = await scanContent(join(process.cwd(), "content"));
    assert.ok(entries.length > 0);
    for (const entry of entries) {
        assert.equal(typeof entry.data.published, "boolean");
        assert.ok(Array.isArray(entry.data.tags));
    }
});
