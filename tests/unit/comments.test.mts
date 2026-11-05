import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";
import {
    commentSchema,
    commentSnapshotSchema,
    issueSchema,
} from "../../shared/utils/comments.ts";

const issue = {
    number: 1,
    title: "Example article",
    html_url: "https://github.com/example/blog/issues/1",
};
const comment = {
    id: 1,
    html_url: "https://github.com/example/blog/issues/1#issuecomment-1",
    body_html: "<p>Example comment.</p>",
    created_at: "2026-11-05T12:00:00Z",
    user: {
        login: "example",
        avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
        html_url: "https://github.com/example",
    },
};

await test("Valid GitHub comments and their snapshot retain URL values", () => {
    const snapshot = { issue, comments: [comment] };
    assert.deepEqual(commentSnapshotSchema.parse(snapshot), snapshot);
    assert.equal(
        issueSchema.parse({ ...issue, html_url: "HTTPS://GITHUB.COM/example" })
            .html_url,
        "HTTPS://GITHUB.COM/example",
    );
});

for (const value of [
    "",
    "not a url",
    "https://",
    "http://github.com/example",
    "https://github.com.example.invalid/example",
    "https://example.invalid/github.com",
    "https://avatars.githubusercontent.com/u/1",
]) {
    await test(`Issue URL validation returns a Zod failure for ${JSON.stringify(value)}`, () => {
        const result = issueSchema.safeParse({ ...issue, html_url: value });
        assert.ok(!result.success);
        assert.ok(result.error instanceof ZodError);
    });
}

for (const value of ["", "not a url", "https://"]) {
    await test(`Malformed comment URLs do not escape safeParse: ${JSON.stringify(value)}`, () => {
        for (const input of [
            { ...comment, html_url: value },
            { ...comment, user: { ...comment.user, html_url: value } },
            { ...comment, user: { ...comment.user, avatar_url: value } },
        ]) {
            const result = commentSchema.safeParse(input);
            assert.ok(!result.success);
            assert.ok(result.error instanceof ZodError);
        }
    });
}

for (const avatar of [
    "http://avatars.githubusercontent.com/u/1",
    "https://avatars.githubusercontent.com.example.invalid/u/1",
    "https://github.com/example",
]) {
    await test(`Avatar host and protocol stay restricted: ${avatar}`, () => {
        const result = commentSchema.safeParse({
            ...comment,
            user: { ...comment.user, avatar_url: avatar },
        });
        assert.ok(!result.success);
        assert.ok(result.error instanceof ZodError);
    });
}

await test("Deleted GitHub users and empty comment snapshots remain valid", () => {
    const deletedUser = { ...comment, user: null };
    assert.deepEqual(commentSchema.parse(deletedUser), deletedUser);
    assert.deepEqual(
        commentSnapshotSchema.parse({ issue: null, comments: [] }),
        {
            issue: null,
            comments: [],
        },
    );
});
