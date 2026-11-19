import assert from "node:assert/strict";
import { test } from "node:test";
import { formatVideoTime } from "../../app/utils/video.ts";

void test("Video time formatting retains minute and hour boundaries", () => {
    assert.equal(formatVideoTime(59.9), "0:59");
    assert.equal(formatVideoTime(60), "1:00");
    assert.equal(formatVideoTime(3599), "59:59");
    assert.equal(formatVideoTime(3600), "1:00:00");
    assert.equal(formatVideoTime(3661), "1:01:01");
});

void test("Video time formatting keeps unavailable and invalid durations readable", () => {
    for (const seconds of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
        assert.equal(formatVideoTime(seconds), "0:00");
    }
});
