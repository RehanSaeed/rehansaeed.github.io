import assert from "node:assert/strict";
import { test } from "node:test";
import { groupImageCarousels } from "../../modules/blog-content/carousels.ts";

type Nodes = NonNullable<Parameters<typeof groupImageCarousels>[0]>;

await test("groups adjacent images and preserves figure captions and image links", () => {
    const first: Nodes[number] = [
        "figure",
        {},
        [
            "p",
            {},
            [
                "a",
                { href: "/article/" },
                ["img", { src: "/one.jpg", alt: "One" }],
            ],
        ],
        ["figcaption", {}, "First caption"],
    ];
    const second: Nodes[number] = [
        "figure",
        {},
        ["img", { src: "/two.jpg", alt: "Two" }],
        ["figcaption", {}, "Second caption"],
    ];
    const nodes: Nodes = [first, "\n", second];
    groupImageCarousels(nodes);
    assert.deepEqual(nodes, [
        [
            "image-carousel",
            { count: 2 },
            ["div", { class: "image-carousel__slide" }, first],
            [
                "div",
                { class: "image-carousel__slide" },
                [
                    "figure",
                    {},
                    ["p", {}, ["img", { src: "/two.jpg", alt: "Two" }]],
                    ["figcaption", {}, "Second caption"],
                ],
            ],
        ],
    ]);
});

await test("splits consecutive images in one paragraph without swallowing prose", () => {
    const nodes: Nodes = [
        [
            "p",
            {},
            ["img", { src: "/one.jpg" }],
            " ",
            ["img", { src: "/two.jpg" }],
        ],
        ["p", {}, "Explanation ", ["img", { src: "/inline.jpg" }]],
        ["p", {}, ["img", { src: "/standalone.jpg" }]],
    ];
    groupImageCarousels(nodes);
    assert.equal(nodes.length, 3);
    assert.equal(nodes[0]?.[0], "image-carousel");
    assert.deepEqual(nodes[1], [
        "p",
        {},
        "Explanation ",
        ["img", { src: "/inline.jpg" }],
    ]);
    assert.deepEqual(nodes[2], ["p", {}, ["img", { src: "/standalone.jpg" }]]);
});

await test("does not cross headings, text, video or container boundaries", () => {
    const image: Nodes[number] = ["p", {}, ["img", { src: "/one.jpg" }]];
    const nodes: Nodes = [
        image,
        ["h2", {}, "Section"],
        image,
        "Explanation",
        image,
        ["video", { src: "/clip.mp4" }],
        image,
        ["div", {}, image, image],
        image,
    ];
    const expected = structuredClone(nodes);
    groupImageCarousels(nodes);
    assert.deepEqual(nodes, expected);
});
