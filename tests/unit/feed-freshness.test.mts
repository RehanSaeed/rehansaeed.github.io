import assert from "node:assert/strict";
import test from "node:test";
import { Feed } from "feed";
import {
    getFeedFreshness,
    getItemDates,
} from "../../server/utils/feed-dates.ts";

await test("Feed freshness uses the latest effective article date", () => {
    const updated = new Date("2026-11-21T00:00:00.000Z");
    const feed = new Feed({
        title: "Test feed",
        description: "Test feed",
        id: "https://example.com/",
        link: "https://example.com/",
        ...getFeedFreshness([
            { date: "2026-11-18T00:00:00.000Z" },
            {
                date: "2026-11-19T00:00:00.000Z",
                dateModified: "2026-11-20T00:00:00.000Z",
            },
            {
                date: "2026-11-17T00:00:00.000Z",
                dateModified: updated.toISOString(),
            },
        ]),
    });

    assert.match(
        feed.atom1(),
        new RegExp(`<updated>${updated.toISOString()}</updated>`),
    );
    assert.match(
        feed.rss2(),
        new RegExp(`<lastBuildDate>${updated.toUTCString()}</lastBuildDate>`),
    );
    assert.equal("updated" in JSON.parse(feed.json1()), false);
});

await test("Empty feeds retain the feed library's current-time freshness default", () => {
    const before = Date.now();
    const feed = new Feed({
        title: "Test feed",
        description: "Test feed",
        id: "https://example.com/",
        link: "https://example.com/",
        ...getFeedFreshness([]),
    });
    const updated = feed.atom1().match(/<updated>([^<]+)<\/updated>/)?.[1];
    const after = Date.now();

    assert.ok(updated);
    const timestamp = new Date(updated).getTime();
    assert.ok(timestamp >= before && timestamp <= after);
});

await test("Item dates preserve publication dates and use modification dates for updates", () => {
    assert.deepEqual(
        getItemDates({
            date: "2026-11-18T00:00:00.000Z",
            dateModified: "2026-11-20T00:00:00.000Z",
        }),
        {
            date: new Date("2026-11-20T00:00:00.000Z"),
            published: new Date("2026-11-18T00:00:00.000Z"),
        },
    );
    assert.deepEqual(getItemDates({ date: "2026-11-18T00:00:00.000Z" }), {
        date: new Date("2026-11-18T00:00:00.000Z"),
        published: new Date("2026-11-18T00:00:00.000Z"),
    });
});
