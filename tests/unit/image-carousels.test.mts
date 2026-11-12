import assert from "node:assert/strict";
import test from "node:test";
import { groupImageCarousels } from "../../modules/blog-content/carousels.ts";

type Nodes = NonNullable<Parameters<typeof groupImageCarousels>[0]>;
const image = (alt: string): Nodes[number] => [
    "img",
    { src: `${alt}.png`, alt, width: 800, height: 600, loading: "lazy" },
];
const paragraph = (...children: Nodes): Nodes[number] => ["p", {}, ...children];

await test("Groups separate paragraphs and same-paragraph images in source order", () => {
    const first = image("First");
    const second = image("Second");
    const third = image("Third");
    const nodes: Nodes = [
        paragraph(first),
        "\n",
        paragraph(second, " ", third),
    ];
    groupImageCarousels(nodes);
    assert.equal(nodes.length, 1);
    const gallery = nodes[0];
    assert.ok(Array.isArray(gallery));
    assert.equal(gallery[0], "image-carousel");
    assert.equal(gallery[1].count, 3);
    assert.deepEqual(
        gallery.slice(2),
        [first, second, third].map((img) => [
            "div",
            { class: "image-carousel__slide" },
            paragraph(img),
        ]),
    );
    const grouped = structuredClone(nodes);
    groupImageCarousels(nodes);
    assert.deepEqual(nodes, grouped);
});

await test("Preserves linked images, figure captions and image attributes", () => {
    const linked: Nodes[number] = [
        "a",
        { href: "/original.png" },
        image("Linked"),
    ];
    const figure: Nodes[number] = [
        "figure",
        {},
        paragraph(image("Captioned")),
        [
            "figcaption",
            {},
            "A caption with ",
            ["a", { href: "/source/" }, "credit"],
        ],
    ];
    const nodes: Nodes = [paragraph(linked), figure];
    groupImageCarousels(nodes);
    assert.match(JSON.stringify(nodes), /image-carousel/);
    assert.ok(JSON.stringify(nodes).includes(JSON.stringify(figure)));
    assert.ok(JSON.stringify(nodes).includes(JSON.stringify(linked)));
});

await test("Frames raw and linked images without nesting controls inside image links", () => {
    const raw = image("Raw");
    const linked: Nodes[number] = ["a", { href: "/source/" }, image("Linked")];
    const caption: Nodes[number] = ["figcaption", {}, "Caption first"];
    const nodes: Nodes = [raw, ["figure", {}, caption, linked]];
    groupImageCarousels(nodes);
    assert.deepEqual(nodes, [
        [
            "image-carousel",
            { count: 2 },
            ["div", { class: "image-carousel__slide" }, paragraph(raw)],
            [
                "div",
                { class: "image-carousel__slide" },
                ["figure", {}, caption, paragraph(linked)],
            ],
        ],
    ]);
});

for (const boundary of [
    paragraph("Prose"),
    ["h2", {}, "Heading"],
    ["hr", {}],
    paragraph(image("Inline"), "Some prose"),
    ["figure", {}, ["video", { src: "/video.mp4" }]],
    ["div", {}, paragraph(image("Nested"))],
    ["pre", {}, ["code", {}, "![Example](example.png)"]],
] satisfies Nodes) {
    await test(`Does not group across ${JSON.stringify(boundary)}`, () => {
        const nodes: Nodes = [
            paragraph(image("First")),
            boundary,
            paragraph(image("Last")),
        ];
        const original = structuredClone(nodes);
        groupImageCarousels(nodes);
        assert.deepEqual(nodes, original);
    });
}

await test("Leaves standalone images and nested article structures unchanged", () => {
    const nodes: Nodes = [
        paragraph(image("Standalone")),
        [
            "blockquote",
            {},
            paragraph(image("Quote one")),
            paragraph(image("Quote two")),
        ],
    ];
    const original = structuredClone(nodes);
    groupImageCarousels(nodes);
    groupImageCarousels(nodes);
    assert.deepEqual(nodes, original);
});
