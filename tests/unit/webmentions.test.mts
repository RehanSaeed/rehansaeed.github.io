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

void test("non-empty invalid timestamps are rejected for every activity", () => {
    for (const type of ["like", "repost", "link", "reply"]) {
        for (const value of ["not-a-date", " "]) {
            for (const field of ["published", "verified_date"]) {
                const result = webMentionSchema.safeParse({
                    id: 8,
                    activity: { type },
                    ...(field === "verified_date"
                        ? { verified_date: value }
                        : {}),
                    data: field === "published" ? { published: value } : {},
                });
                assert.equal(
                    result.success,
                    false,
                    `${type}: ${field}=${JSON.stringify(value)}`,
                );
            }
        }
    }
});

void test("Z, numeric-offset ISO and date-only timestamps remain accepted", () => {
    for (const type of ["like", "repost", "link", "reply"]) {
        for (const value of [
            "2026-01-02T12:00:00Z",
            "2026-01-02T13:00:00+01:00",
            "2026-01-02",
        ]) {
            for (const field of ["published", "verified_date"]) {
                const mention = webMentionSchema.parse({
                    id: 9,
                    activity: { type },
                    ...(field === "verified_date"
                        ? { verified_date: value }
                        : {}),
                    data: field === "published" ? { published: value } : {},
                });
                assert.equal(
                    webMentionTimestamp(mention),
                    value,
                    `${type}: ${field}`,
                );
            }
        }
    }
});

void test("missing and null published timestamps fall back to verified", () => {
    const verified = "2026-01-03T12:00:00Z";
    for (const type of ["like", "repost", "link", "reply"]) {
        for (const data of [{}, { published: null }]) {
            const mention = webMentionSchema.parse({
                id: 10,
                activity: { type },
                verified_date: verified,
                data,
            });
            assert.equal(webMentionTimestamp(mention), verified);
        }
    }
});

void test("empty published timestamps remain missing even with a verified timestamp", () => {
    for (const type of ["like", "repost", "link", "reply"]) {
        const mention = webMentionSchema.parse({
            id: 11,
            activity: { type },
            verified_date: "2026-01-03T12:00:00Z",
            data: { published: "" },
        });
        assert.throws(
            () => webMentionTimestamp(mention),
            /has no published or verified timestamp/,
        );
    }
});

void test("direct timestamp calls reject invalid data before rendering", () => {
    for (const type of ["like", "repost", "link", "reply"]) {
        for (const value of ["not-a-date", " "]) {
            for (const field of ["published", "verified_date"]) {
                assert.throws(
                    () =>
                        webMentionTimestamp({
                            id: 12,
                            activity: { type },
                            ...(field === "verified_date"
                                ? { verified_date: value }
                                : {}),
                            data:
                                field === "published"
                                    ? { published: value }
                                    : {},
                        }),
                    /Web Mention .*invalid.*timestamp/i,
                    `${type}: ${field}=${JSON.stringify(value)}`,
                );
            }
        }
    }
});
