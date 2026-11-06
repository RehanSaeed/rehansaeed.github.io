import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

// Native JSON imports create filename-less CJS cache entries in Node 24, breaking Playwright collection.
const site = z
    .object({ name: z.string(), url: z.url(), language: z.string() })
    .parse(
        JSON.parse(
            readFileSync(new URL("../site.json", import.meta.url), "utf8"),
        ),
    );

const feedItemSchema = z.object({
    id: z.string().min(1),
    url: z.url({ protocol: /^https$/ }),
    title: z.string().min(1),
    summary: z.string().optional(),
    image: z.url({ protocol: /^https$/ }).optional(),
    date_modified: z.iso.datetime({ offset: true }),
});
const feedSchema = z.object({ items: z.array(feedItemSchema) });

/** A post read from the deployed JSON feed. */
export type FeedItem = z.infer<typeof feedItemSchema>;

const stateSchema = z.object({
    version: z.literal(1),
    seen: z.array(z.string().min(1)),
});

/** The persisted record of every post that has been emailed or deliberately skipped. */
export type NewsletterState = z.infer<typeof stateSchema>;

/** What to do with the current feed, given the persisted state. */
export type NewsletterPlan =
    | {
          /** Record the current posts as seen without emailing anyone. */
          kind: "baseline";
          /** Every current post identifier. */
          seen: string[];
      }
    | {
          /** There are no unseen posts. */
          kind: "none";
      }
    | {
          /** Fail loudly instead of risking a mass mailing. */
          kind: "refuse";
          /** Why the run was refused and how to recover. */
          reason: string;
      }
    | {
          /** Email new posts and record stale ones. */
          kind: "update";
          /** Posts to email, oldest first. */
          send: FeedItem[];
          /** Unseen posts too old to announce, recorded without emailing. */
          skip: FeedItem[];
      };

/** Safety limits for {@link planNewsletter}. */
export type PlanOptions = {
    /** The current time, used to recognise unseen posts that are too old to announce. */
    now: Date;
    /** Record every current post as seen without emailing anyone. */
    rebaseline?: boolean;
    /** Refuse to send when more unseen posts than this appear at once. */
    maxPerRun?: number;
    /** Unseen posts dated longer ago than this are recorded as seen without being sent. */
    maxAgeDays?: number;
};

export const campaignStateBranch = "newsletter-state";
export const campaignStatePath = "newsletter.json";

export const parseFeed = (value: unknown): FeedItem[] =>
    feedSchema
        .parse(value)
        .items.toSorted(
            (a, b) => Date.parse(b.date_modified) - Date.parse(a.date_modified),
        );

export const parseState = (value: unknown): NewsletterState =>
    stateSchema.parse(value);

/**
 * Decides which posts to email. The first run (no state) and an explicit rebaseline only record the
 * current posts. Afterwards, posts missing from the seen list are sent oldest first, posts with stale
 * dates (for example, a renamed permalink) are recorded without being sent, and an unexpectedly large
 * number of unseen posts is refused rather than mass-mailed.
 */
export const planNewsletter = (
    items: FeedItem[],
    state: NewsletterState | null,
    { now, rebaseline = false, maxPerRun = 3, maxAgeDays = 30 }: PlanOptions,
): NewsletterPlan => {
    if (items.length === 0) {
        return { kind: "refuse", reason: "The feed contains no posts." };
    }
    if (!state || rebaseline) {
        return { kind: "baseline", seen: items.map((item) => item.id) };
    }
    const seen = new Set(state.seen);
    const unseen = items
        .filter((item) => !seen.has(item.id))
        .toSorted(
            (a, b) => Date.parse(a.date_modified) - Date.parse(b.date_modified),
        );
    if (unseen.length === 0) {
        return { kind: "none" };
    }
    const oldest = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
    const send = unseen.filter(
        (item) => Date.parse(item.date_modified) >= oldest,
    );
    if (send.length > maxPerRun) {
        return {
            kind: "refuse",
            reason: `${send.length} unseen posts exceed the limit of ${maxPerRun} per run. Check the feed and state, then run the workflow manually with rebaseline if they should not be emailed.`,
        };
    }
    return {
        kind: "update",
        send,
        skip: unseen.filter((item) => !send.includes(item)),
    };
};

export const withSeen = (
    state: NewsletterState | null,
    ids: string[],
): NewsletterState => ({
    version: 1,
    seen: [...new Set([...(state?.seen ?? []), ...ids])],
});

/** Sender reports use the title to find an earlier campaign for the same post. */
export const campaignTitle = (item: FeedItem) => `Blog post: ${item.id}`;

const escapeHtml = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const stripTags = (value: string): string => {
    const stripped = value.replaceAll(/<[^>]*>/g, "");
    return stripped === value ? value : stripTags(stripped);
};

const plainText = (value: string) =>
    stripTags(value).replaceAll(/\s+/g, " ").trim();

const decodeEntities = (value: string) =>
    value
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'")
        .replaceAll("&amp;", "&");

/** The campaign content for one post. */
export type NewsletterEmail = {
    /** Campaign name used for reports and duplicate detection. */
    title: string;
    /** Email subject line. */
    subject: string;
    /** Inbox preview text. */
    preheader: string;
    /** Complete HTML email document. */
    html: string;
};

export const renderEmail = (item: FeedItem): NewsletterEmail => {
    const title = plainText(item.title);
    const summary = decodeEntities(plainText(item.summary ?? ""));
    const url = escapeHtml(item.url);
    const image = item.image
        ? `<tr><td><a href="${url}"><img src="${escapeHtml(item.image)}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:8px 8px 0 0;"></a></td></tr>`
        : "";
    const excerpt = summary
        ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.5;">${escapeHtml(summary)}</p>`
        : "";
    const html = `<!DOCTYPE html>
<html lang="${escapeHtml(site.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0e9f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0e9f9;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;font-family:Arial,Helvetica,sans-serif;color:#222222;">
${image}
<tr><td style="padding:24px;">
<p style="margin:0 0 8px;font-size:14px;color:#555555;">New post from ${escapeHtml(site.name)}</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;"><a href="${url}" style="color:#222222;text-decoration:none;">${escapeHtml(title)}</a></h1>
${excerpt}
<a href="${url}" style="display:inline-block;padding:12px 20px;background-color:#6b17e8;border-radius:6px;color:#ffffff;font-weight:bold;text-decoration:none;">Read the post</a>
</td></tr>
<tr><td style="padding:0 24px 24px;font-size:12px;line-height:1.5;color:#555555;">You are receiving this because you subscribed to new posts from <a href="${escapeHtml(site.url)}" style="color:#555555;">${escapeHtml(site.name)}</a>. <a href="{$unsubscribe_link}" style="color:#555555;">Unsubscribe</a></td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
    return {
        title: campaignTitle(item),
        subject: title,
        preheader: summary.slice(0, 150),
        html,
    };
};

const requestJson = async (
    url: string,
    init: RequestInit,
    allowNotFound = false,
): Promise<unknown> => {
    const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(30_000),
    });
    if (allowNotFound && response.status === 404) {
        return null;
    }
    const text = await response.text();
    if (!response.ok) {
        throw new Error(
            `${init.method ?? "GET"} ${new URL(url).pathname} failed with ${response.status}: ${text.slice(0, 500)}`,
        );
    }
    return text ? JSON.parse(text) : {};
};

/** Reads and writes the state file on a dedicated branch using the Actions token. */
export const createStateStore = (repository: string, token: string) => {
    const api = `https://api.github.com/repos/${repository}`;
    const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
    };
    const github = (path: string, method = "GET", body?: unknown) =>
        requestJson(
            `${api}/${path}`,
            {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
            },
            method === "GET",
        );
    const read = async () => {
        const file = await github(
            `contents/${campaignStatePath}?ref=${campaignStateBranch}`,
        );
        if (file === null) {
            return null;
        }
        const { content, sha } = z
            .object({ content: z.string(), sha: z.string() })
            .parse(file);
        const state = parseState(
            JSON.parse(Buffer.from(content, "base64").toString("utf8")),
        );
        return { state, sha };
    };
    const write = async (
        state: NewsletterState,
        sha: string | null,
        message: string,
    ) => {
        const content = `${JSON.stringify(state, null, 2)}\n`;
        if (sha) {
            // The blob SHA makes this a compare-and-swap: a concurrent update fails instead of being lost.
            await github(`contents/${campaignStatePath}`, "PUT", {
                message,
                content: Buffer.from(content).toString("base64"),
                sha,
                branch: campaignStateBranch,
            });
            return;
        }
        const tree = z.object({ sha: z.string() }).parse(
            await github("git/trees", "POST", {
                tree: [
                    {
                        path: campaignStatePath,
                        mode: "100644",
                        type: "blob",
                        content,
                    },
                ],
            }),
        );
        const commit = z.object({ sha: z.string() }).parse(
            await github("git/commits", "POST", {
                message,
                tree: tree.sha,
                parents: [],
            }),
        );
        // Creating the ref fails if another run created the branch first.
        await github("git/refs", "POST", {
            ref: `refs/heads/${campaignStateBranch}`,
            sha: commit.sha,
        });
    };
    return { read, write };
};

const campaignSchema = z.looseObject({
    id: z.string(),
    title: z.string().nullish(),
    status: z.string(),
});

/** The subset of the Sender v2 campaigns API used to email posts. */
export const createSender = (
    token: string,
    base = "https://api.sender.net/v2",
) => {
    const sender = (path: string, method = "GET", body?: unknown) =>
        requestJson(`${base}/${path}`, {
            method,
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    const findCampaign = async (title: string) => {
        for (let page = 1; page <= 50; page++) {
            const { data, meta } = z
                .object({
                    data: z.array(campaignSchema),
                    meta: z
                        .looseObject({ last_page: z.number().int() })
                        .optional(),
                })
                .parse(await sender(`campaigns?limit=100&page=${page}`));
            const match = data.find((campaign) => campaign.title === title);
            if (match) {
                return match;
            }
            if (!meta || page >= meta.last_page) {
                return null;
            }
        }
        throw new Error("Too many Sender campaigns to check for duplicates.");
    };
    const createCampaign = async (
        email: NewsletterEmail,
        { from, replyTo, groupId }: SenderSettings,
    ) =>
        z.object({ data: campaignSchema }).parse(
            await sender("campaigns", "POST", {
                title: email.title,
                subject: email.subject,
                from,
                reply_to: replyTo,
                preheader: email.preheader,
                content_type: "html",
                google_analytics: 0,
                groups: [groupId],
                content: email.html,
            }),
        ).data;
    const campaignErrors = async (id: string) =>
        z
            .looseObject({
                errors: z
                    .array(
                        z.looseObject({
                            title: z.string(),
                            details: z.string().optional(),
                        }),
                    )
                    .default([]),
            })
            .parse(await sender(`campaigns/${id}/errors`)).errors;
    const sendCampaign = async (id: string) => {
        await sender(`campaigns/${id}/send`, "POST");
    };
    return { findCampaign, createCampaign, campaignErrors, sendCampaign };
};

/** Account values needed to create a Sender campaign. */
export type SenderSettings = {
    /** Display name shown as the email sender. */
    from: string;
    /** Verified-domain address used as the sender and reply-to address. */
    replyTo: string;
    /** Subscriber group that receives new-post emails. */
    groupId: string;
};

/**
 * Sends one post unless Sender already has a campaign for it. An existing draft is reused, so a
 * run that failed after creating the campaign can be retried without creating a duplicate.
 */
export const sendPost = async (
    sender: ReturnType<typeof createSender>,
    item: FeedItem,
    settings: SenderSettings,
): Promise<"sent" | "already-sent"> => {
    const email = renderEmail(item);
    const existing = await sender.findCampaign(email.title);
    if (existing && existing.status.toUpperCase() !== "DRAFT") {
        return "already-sent";
    }
    const campaign = existing ?? (await sender.createCampaign(email, settings));
    const errors = await sender.campaignErrors(campaign.id);
    if (errors.length > 0) {
        throw new Error(
            `Sender cannot send campaign ${campaign.id}: ${errors.map((error) => [error.title, error.details].filter(Boolean).join(" - ")).join("; ")}`,
        );
    }
    await sender.sendCampaign(campaign.id);
    return "sent";
};

const environment = z.object({
    GITHUB_REPOSITORY: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    GITHUB_TOKEN: z.string().min(1),
    FEED_REVISION: z.string().default(""),
    NEWSLETTER_DRY_RUN: z.enum(["true", "false", ""]).default(""),
    NEWSLETTER_REBASELINE: z.enum(["true", "false", ""]).default(""),
    SENDER_API_TOKEN: z.string().default(""),
    SENDER_GROUP_ID: z.string().default(""),
    SENDER_REPLY_TO: z.string().default(""),
    SENDER_FROM_NAME: z.string().default(""),
});

const main = async () => {
    const env = environment.parse(process.env);
    const dryRun = env.NEWSLETTER_DRY_RUN === "true";
    const settings: SenderSettings = {
        from: env.SENDER_FROM_NAME || site.name,
        replyTo: env.SENDER_REPLY_TO,
        groupId: env.SENDER_GROUP_ID,
    };
    const configured = Boolean(
        env.SENDER_API_TOKEN && settings.groupId && settings.replyTo,
    );
    if (!configured && !dryRun) {
        console.log(
            "::notice::Sender is not configured. Add the SENDER_API_TOKEN secret and the SENDER_GROUP_ID and SENDER_REPLY_TO variables to email new posts.",
        );
        return;
    }

    const feedUrl = new URL("/feed.json", site.url);
    // A query string bypasses stale CDN copies of the feed after a deployment.
    feedUrl.searchParams.set(
        "revision",
        env.FEED_REVISION || String(Date.now()),
    );
    const items = parseFeed(
        await requestJson(feedUrl.href, {
            headers: { Accept: "application/feed+json, application/json" },
        }),
    );
    const store = createStateStore(env.GITHUB_REPOSITORY, env.GITHUB_TOKEN);
    const stored = await store.read();
    const plan = planNewsletter(items, stored?.state ?? null, {
        now: new Date(),
        rebaseline: env.NEWSLETTER_REBASELINE === "true",
    });
    const prefix = dryRun ? "[dry run] " : "";

    if (plan.kind === "refuse") {
        throw new Error(plan.reason);
    }
    if (plan.kind === "none") {
        console.log(`${prefix}No new posts since the last newsletter.`);
        return;
    }
    if (plan.kind === "baseline") {
        console.log(
            `${prefix}Recording ${plan.seen.length} current posts as the baseline without sending. Newest: ${items[0]?.id}`,
        );
        if (!dryRun) {
            await store.write(
                withSeen(null, plan.seen),
                stored?.sha ?? null,
                "Record newsletter baseline",
            );
        }
        return;
    }

    for (const item of plan.skip) {
        console.log(
            `::warning::${prefix}Skipping ${item.id} because its date ${item.date_modified} is too old to announce.`,
        );
    }
    if (dryRun) {
        for (const item of plan.send) {
            const email = renderEmail(item);
            console.log(
                `[dry run] Would send "${email.subject}" (${item.url}).\n${email.html}`,
            );
        }
        return;
    }

    const sender = createSender(env.SENDER_API_TOKEN);
    let state = stored?.state ?? null;
    let sha = stored?.sha ?? null;
    const record = async (ids: string[], message: string) => {
        state = withSeen(state, ids);
        await store.write(state, sha, message);
        sha = (await store.read())?.sha ?? null;
    };
    if (plan.skip.length > 0) {
        await record(
            plan.skip.map((item) => item.id),
            "Record skipped newsletter posts",
        );
    }
    for (const item of plan.send) {
        const outcome = await sendPost(sender, item, settings);
        console.log(
            outcome === "sent"
                ? `Sent the newsletter for ${item.id}.`
                : `Sender already has a campaign for ${item.id}; recording it as sent.`,
        );
        await record([item.id], `Record newsletter for ${item.id}`);
    }
};

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
    await main();
}
