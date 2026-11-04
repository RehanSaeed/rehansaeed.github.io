import assert from "node:assert/strict";
import test from "node:test";
import { buildTopography } from "../../app/utils/topography.ts";

void test("the invented terrain is deterministic, finite and bounded", () => {
    const first = buildTopography();
    assert.deepEqual(first, buildTopography());
    assert.equal(first.surface.length, 100 * 100 * 6 * 3);
    assert.ok(first.contours.length > 10_000);
    for (const positions of [first.surface, first.contours]) {
        assert.equal(positions.length % 6, 0);
        for (let i = 0; i < positions.length; i++) {
            const value = positions[i]!;
            assert.ok(Number.isFinite(value));
            assert.ok(
                i % 3 === 1 ? value >= 0 && value < 5 : Math.abs(value) <= 6,
            );
        }
    }
});

void test("every contour segment joins two points on one elevation level", () => {
    const { contours } = buildTopography();
    for (let i = 0; i < contours.length; i += 6) {
        assert.equal(contours[i + 1], contours[i + 4]);
        const level = (contours[i + 1]! - 0.008) / 0.12;
        assert.ok(Math.abs(level - Math.round(level)) < 0.00001);
    }
});
