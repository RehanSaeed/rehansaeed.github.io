import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { test } from "node:test";
import { parse } from "yaml";
import { z } from "zod";
import {
    campaignTitle,
    createSender,
    parseFeed,
    planNewsletter,
    renderEmail,
    sendPost,
    withSeen,
    type FeedItem,
    type SenderSettings,
} from "./newsletter.mts";

const now = new Date("2026-11-05T12:00:00Z");
const post = (slug: string, date: string, extra: Partial<FeedItem> = {}) => ({
    id: `https://rehansaeed.com/${slug}/`,
    url: `https://rehansaeed.com/${slug}/`,
    title: `Title ${slug}`,
    summary: `Summary ${slug}`,
    date_modified: `${date}T00:00:00Z`,
    ...extra,
});
const feed = (...items: ReturnType<typeof post>[]) => parseFeed({ items });
const settings: SenderSettings = {
    from: "Muhammad Rehan Saeed",
    replyTo: "newsletter@example.com",
    groupId: "group1",
};

await test("Feed parsing sorts newest first and rejects malformed items", () => {
    const items = feed(
        post("old", "2026-01-01"),
        post("new", "2026-11-04"),
        post("middle", "2026-06-01"),
    );
    assert.deepEqual(
        items.map((item) => item.id),
        [
            "https://rehansaeed.com/new/",
            "https://rehansaeed.com/middle/",
            "https://rehansaeed.com/old/",
        ],
    );
    assert.throws(() => parseFeed({ items: [{ id: "x" }] }));
    assert.throws(() =>
        parseFeed({
            items: [post("insecure", "2026-01-01", { url: "http://x.com/" })],
        }),
    );
});

await test("The first run and a rebaseline only record the current posts", () => {
    const items = feed(post("a", "2026-01-01"), post("b", "2026-11-04"));
    const ids = items.map((item) => item.id);
    assert.deepEqual(planNewsletter(items, null, { now }), {
        kind: "baseline",
        seen: ids,
    });
    assert.deepEqual(
        planNewsletter(
            items,
            { version: 1, seen: [] },
            { now, rebaseline: true },
        ),
        { kind: "baseline", seen: ids },
    );
});

await test("Nothing is sent when the newest post was already seen", () => {
    const items = feed(post("a", "2026-01-01"), post("b", "2026-11-04"));
    assert.deepEqual(
        planNewsletter(
            items,
            withSeen(
                null,
                items.map((item) => item.id),
            ),
            {
                now,
            },
        ),
        { kind: "none" },
    );
});

await test("New posts are sent oldest first and posts are never sent twice", () => {
    const items = feed(
        post("a", "2026-01-01"),
        post("c", "2026-11-05"),
        post("b", "2026-11-04"),
    );
    const state = withSeen(null, ["https://rehansaeed.com/a/"]);
    const plan = planNewsletter(items, state, { now });
    assert(plan.kind === "update");
    assert.deepEqual(
        plan.send.map((item) => item.id),
        ["https://rehansaeed.com/b/", "https://rehansaeed.com/c/"],
    );
    const after = withSeen(
        state,
        items.map((item) => item.id),
    );
    assert.deepEqual(planNewsletter(items, after, { now }), { kind: "none" });
    assert.equal(withSeen(after, ["https://rehansaeed.com/a/"]).seen.length, 3);
});

await test("Old unseen posts, such as renamed permalinks, are recorded without being sent", () => {
    const items = feed(
        post("renamed", "2020-01-01"),
        post("new", "2026-11-04"),
    );
    const plan = planNewsletter(items, withSeen(null, []), { now });
    assert.deepEqual(plan, {
        kind: "update",
        send: [items[0]],
        skip: [items[1]],
    });
});

await test("Unexpected bulk changes and empty feeds are refused instead of mass-mailed", () => {
    const items = feed(
        post("a", "2026-11-01"),
        post("b", "2026-11-02"),
        post("c", "2026-11-03"),
        post("d", "2026-11-04"),
    );
    assert.equal(
        planNewsletter(items, withSeen(null, []), { now }).kind,
        "refuse",
    );
    assert.equal(
        planNewsletter(items, withSeen(null, []), { now, maxPerRun: 4 }).kind,
        "update",
    );
    assert.equal(
        planNewsletter([], withSeen(null, []), { now }).kind,
        "refuse",
    );
});

await test("Emails contain the escaped title, excerpt, hero image, link and unsubscribe tag", () => {
    const [item] = feed(
        post("x", "2026-11-04", {
            title: "Vue <3 & Nuxt",
            summary:
                "A &quot;quick&quot; <em>look</em> at <script>things</script>.",
            image: "https://rehansaeed.com/images/hero/X-1600x900.png",
        }),
    );
    assert(item);
    const email = renderEmail(item);
    assert.equal(email.title, campaignTitle(item));
    assert.equal(email.subject, "Vue <3 & Nuxt");
    assert.equal(email.preheader, 'A "quick" look at things.');
    assert.match(
        email.html,
        /<h1[^>]*><a href="https:\/\/rehansaeed\.com\/x\/"/,
    );
    assert.match(email.html, /Vue &lt;3 &amp; Nuxt/);
    assert.match(email.html, /A &quot;quick&quot; look at things\./);
    assert.match(
        email.html,
        /<img src="https:\/\/rehansaeed\.com\/images\/hero\/X-1600x900\.png" alt=""/,
    );
    assert.match(email.html, />Read the post<\/a>/);
    assert.match(email.html, /href="\{\$unsubscribe_link\}"/);
    assert.doesNotMatch(email.html, /<script|<em>/);

    const [plain] = feed(post("y", "2026-11-04"));
    assert(plain);
    assert.doesNotMatch(renderEmail(plain).html, /<img/);
});

const fakeSender = (
    campaigns: { id: string; title: string; status: string }[],
    errors: { title: string }[] = [],
) => {
    const calls: string[] = [];
    const sender: ReturnType<typeof createSender> = {
        findCampaign: (title) => {
            calls.push("find");
            return Promise.resolve(
                campaigns.find((campaign) => campaign.title === title) ?? null,
            );
        },
        createCampaign: (email) => {
            calls.push(`create:${email.title}`);
            return Promise.resolve({
                id: "new",
                title: email.title,
                status: "DRAFT",
            });
        },
        campaignErrors: (id) => {
            calls.push(`errors:${id}`);
            return Promise.resolve(errors);
        },
        sendCampaign: (id) => {
            calls.push(`send:${id}`);
            return Promise.resolve();
        },
    };
    return { sender, calls };
};

await test("Sending skips posts Sender already sent and retries existing drafts", async () => {
    const [item] = feed(post("x", "2026-11-04"));
    assert(item);
    const title = campaignTitle(item);

    const sent = fakeSender([{ id: "s1", title, status: "SENT" }]);
    assert.equal(await sendPost(sent.sender, item, settings), "already-sent");
    assert.deepEqual(sent.calls, ["find"]);

    const draft = fakeSender([{ id: "d1", title, status: "DRAFT" }]);
    assert.equal(await sendPost(draft.sender, item, settings), "sent");
    assert.deepEqual(draft.calls, ["find", "errors:d1", "send:d1"]);

    const fresh = fakeSender([]);
    assert.equal(await sendPost(fresh.sender, item, settings), "sent");
    assert.deepEqual(fresh.calls, [
        "find",
        `create:${title}`,
        "errors:new",
        "send:new",
    ]);

    const blocked = fakeSender([], [{ title: "No subscribers selected" }]);
    await assert.rejects(
        sendPost(blocked.sender, item, settings),
        /No subscribers selected/,
    );
    assert(!blocked.calls.some((call) => call.startsWith("send:")));
});

await test("The Sender client authenticates, pages through campaigns and posts HTML campaigns", async (context) => {
    const requests: {
        method: string;
        url: string;
        auth: string;
        body: string;
    }[] = [];
    const server = createServer((request, response) => {
        let body = "";
        request.on("data", (chunk: Buffer) => (body += chunk.toString()));
        request.on("end", () => {
            requests.push({
                method: request.method ?? "",
                url: request.url ?? "",
                auth: request.headers.authorization ?? "",
                body,
            });
            response.setHeader("Content-Type", "application/json");
            const url = new URL(request.url ?? "/", "http://localhost");
            if (url.pathname === "/campaigns" && request.method === "GET") {
                const page = url.searchParams.get("page");
                response.end(
                    JSON.stringify({
                        data:
                            page === "2"
                                ? [{ id: "b", title: "Wanted", status: "SENT" }]
                                : [{ id: "a", title: "Other", status: "SENT" }],
                        meta: { last_page: 2 },
                    }),
                );
            } else if (url.pathname === "/campaigns") {
                response.end(
                    JSON.stringify({
                        data: { id: "c", title: "New", status: "DRAFT" },
                    }),
                );
            } else {
                response.statusCode = 422;
                response.end(JSON.stringify({ message: "Invalid" }));
            }
        });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    context.after(() => server.close());
    const address = server.address();
    assert(address && typeof address === "object");
    const sender = createSender("secret", `http://127.0.0.1:${address.port}`);

    assert.equal((await sender.findCampaign("Wanted"))?.id, "b");
    assert.equal(await sender.findCampaign("Missing"), null);
    const [item] = feed(post("x", "2026-11-04"));
    assert(item);
    assert.equal(
        (await sender.createCampaign(renderEmail(item), settings)).id,
        "c",
    );
    await assert.rejects(sender.sendCampaign("c"), /failed with 422/);

    assert(requests.every((request) => request.auth === "Bearer secret"));
    const created = z
        .looseObject({
            content_type: z.string(),
            groups: z.array(z.string()),
            reply_to: z.string(),
            title: z.string(),
        })
        .parse(
            JSON.parse(
                requests.find((request) => request.method === "POST")?.body ??
                    "",
            ),
        );
    assert.equal(created.content_type, "html");
    assert.deepEqual(created.groups, ["group1"]);
    assert.equal(created.reply_to, settings.replyTo);
    assert.equal(created.title, campaignTitle(item));
});

await test("The newsletter workflow runs after successful main deployments with hardened, minimal permissions", async () => {
    const workflow = z
        .object({
            on: z.object({
                workflow_run: z.object({
                    workflows: z.array(z.string()),
                    types: z.array(z.string()),
                    branches: z.array(z.string()),
                }),
                workflow_dispatch: z.object({
                    inputs: z.object({
                        dry_run: z.looseObject({
                            type: z.literal("boolean"),
                            default: z.literal(true),
                        }),
                        rebaseline: z.looseObject({
                            type: z.literal("boolean"),
                            default: z.literal(false),
                        }),
                    }),
                }),
            }),
            permissions: z.record(z.string(), z.string()),
            concurrency: z.looseObject({ "cancel-in-progress": z.boolean() }),
            jobs: z.record(
                z.string(),
                z.looseObject({
                    if: z.string(),
                    permissions: z.record(z.string(), z.string()),
                    steps: z.array(
                        z.looseObject({
                            uses: z.string().optional(),
                            run: z.string().optional(),
                            with: z.record(z.string(), z.unknown()).optional(),
                            env: z.record(z.string(), z.string()).optional(),
                        }),
                    ),
                }),
            ),
        })
        .parse(
            parse(await readFile(".github/workflows/newsletter.yml", "utf8")),
        );
    assert.deepEqual(workflow.on.workflow_run, {
        workflows: ["Build"],
        types: ["completed"],
        branches: ["main"],
    });
    assert.deepEqual(workflow.permissions, {});
    assert.equal(workflow.concurrency["cancel-in-progress"], false);
    const jobs = Object.values(workflow.jobs);
    assert.equal(jobs.length, 1);
    const [job] = jobs;
    assert(job);
    assert.deepEqual(job.permissions, { contents: "write" });
    for (const condition of [
        "github.event.workflow_run.conclusion == 'success'",
        "github.event.workflow_run.event != 'pull_request'",
        "github.event.workflow_run.head_repository.full_name == github.repository",
    ]) {
        assert(job.if.includes(condition), condition);
    }
    const checkout = job.steps.find((step) =>
        step.uses?.startsWith("actions/checkout@"),
    );
    assert.equal(checkout?.with?.["persist-credentials"], false);
    assert(job.steps.some((step) => step.run === "npm ci --ignore-scripts"));
    const run = job.steps.find((step) => step.run === "npm run newsletter");
    assert.equal(run?.env?.SENDER_API_TOKEN, "${{ secrets.SENDER_API_TOKEN }}");
});
