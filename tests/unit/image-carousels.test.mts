import assert from "node:assert/strict";
import { test } from "node:test";
import { groupImageCarousels } from "../../modules/blog-content/carousels.ts";

type Nodes = NonNullable<Parameters<typeof groupImageCarousels>[0]>;

await test("groups adjacent images and preserves figure captions and image links", () => {
    const first: Nodes[number] = [
        "figure",
        { class: "authored-figure" },
        [
            "p",
            { className: ["authored-media"] },
            [
                "a",
                { href: "/article/" },
                ["img", { src: "/one.jpg", alt: "One" }],
            ],
        ],
        ["figcaption", { class: "authored-caption" }, "First caption"],
    ];
    const originalFirst = structuredClone(first);
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
            "carousel",
            { count: 2 },
            [
                "li",
                { class: "carousel__slide" },
                [
                    "figure",
                    {
                        class: "authored-figure carousel__figure",
                    },
                    [
                        "p",
                        {
                            className: ["authored-media"],
                            class: "authored-media carousel__media",
                        },
                        [
                            "a",
                            { href: "/article/" },
                            ["img", { src: "/one.jpg", alt: "One" }],
                        ],
                    ],
                    [
                        "figcaption",
                        { class: "authored-caption carousel__caption" },
                        "First caption",
                    ],
                ],
            ],
            [
                "li",
                { class: "carousel__slide" },
                [
                    "figure",
                    { class: "carousel__figure" },
                    [
                        "p",
                        { class: "carousel__media" },
                        ["img", { src: "/two.jpg", alt: "Two" }],
                    ],
                    [
                        "figcaption",
                        { class: "carousel__caption" },
                        "Second caption",
                    ],
                ],
            ],
        ],
    ]);
    assert.deepEqual(first, originalFirst);
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
    assert.deepEqual(nodes[0], [
        "carousel",
        { count: 2 },
        [
            "li",
            { class: "carousel__slide" },
            ["p", { class: "carousel__media" }, ["img", { src: "/one.jpg" }]],
        ],
        [
            "li",
            { class: "carousel__slide" },
            ["p", { class: "carousel__media" }, ["img", { src: "/two.jpg" }]],
        ],
    ]);
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
