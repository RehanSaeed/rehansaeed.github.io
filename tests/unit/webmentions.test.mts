import assert from "node:assert/strict";
import test from "node:test";
import {
    webMentionSchema,
    webMentionTimestamp,
    webMentionUrl,
} from "../../shared/utils/webmentions.ts";

void test("likes and reposts do not require link, reply or timestamp fields", () => {
    for (const type of ["like", "repost"]) {
        const mention = webMentionSchema.parse({
            id: 1,
            activity: { type },
            data: { author: null },
        });
        assert.equal(mention.activity.type, type);
        assert.equal(mention.source, undefined);
        assert.equal(mention.data.url, undefined);
    }
});

void test("links use their source and verified timestamp without a data URL", () => {
    const mention = webMentionSchema.parse({
        id: 2,
        source: "https://example.com/link",
        verified_date: "2026-01-01T12:00:00Z",
        activity: { type: "link" },
        data: {},
    });
    assert.equal(webMentionUrl(mention), "https://example.com/link");
    assert.equal(webMentionTimestamp(mention), "2026-01-01T12:00:00Z");
});

void test("replies use their data URL and published date without source or verified date", () => {
    const mention = webMentionSchema.parse({
        id: 3,
        activity: { type: "reply" },
        data: {
            url: "https://example.com/reply",
            published: "2026-01-02T12:00:00Z",
        },
    });
    assert.equal(webMentionUrl(mention), "https://example.com/reply");
    assert.equal(webMentionTimestamp(mention), "2026-01-02T12:00:00Z");
});

void test("a null published date falls back to the verified timestamp", () => {
    const mention = webMentionSchema.parse({
        id: 4,
        verified_date: "2026-01-03T12:00:00Z",
        activity: { type: "reply" },
        data: { published: null },
    });
    assert.equal(webMentionTimestamp(mention), "2026-01-03T12:00:00Z");
});

void test("links with author photos render as replies and use the data URL", () => {
    const mention = webMentionSchema.parse({
        id: 7,
        activity: { type: "link" },
        data: {
            url: "https://twitter.com/example/status/123",
            published: "2026-01-04T12:00:00Z",
            author: { photo: "https://example.com/avatar.png" },
        },
    });
    assert.equal(
        webMentionUrl(mention),
        "https://twitter.com/example/status/123",
    );
    assert.equal(webMentionTimestamp(mention), "2026-01-04T12:00:00Z");
});

void test("missing URLs and timestamps fail explicitly instead of reaching rendering", () => {
    const mention = webMentionSchema.parse({
        id: 5,
        activity: { type: "reply" },
        data: {},
    });
    assert.throws(() => webMentionUrl(mention), /has no URL/);
    assert.throws(
        () => webMentionTimestamp(mention),
        /has no published or verified/,
    );
});

void test("malformed response fields are rejected", () => {
    assert.throws(() =>
        webMentionSchema.parse({
            id: 6,
            activity: { type: "like" },
            data: { author: { photo: 42 } },
        }),
    );
});
