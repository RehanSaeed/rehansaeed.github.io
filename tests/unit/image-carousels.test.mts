import assert from "node:assert/strict";
import test from "node:test";
import { groupImageCarousels } from "../../modules/blog-content/carousels.ts";

type Nodes = NonNullable<Parameters<typeof groupImageCarousels>[0]>;
const image = (alt: string): Nodes[number] => [
    "img",
    { src: `${alt}.png`, alt, width: 800, height: 600 },
];
const paragraph = (...children: Nodes): Nodes[number] => ["p", {}, ...children];

await test("Groups separate and same-paragraph images in order, once", () => {
    const nodes: Nodes = [
        paragraph(image("First")),
        "\n",
        paragraph(image("Second"), " ", image("Third")),
    ];
    groupImageCarousels(nodes);
    assert.equal(nodes.length, 1);
    const gallery = nodes[0];
    assert.ok(Array.isArray(gallery));
    assert.equal(gallery[0], "image-carousel");
    assert.equal(gallery[1].count, 3);
    assert.match(JSON.stringify(gallery), /Image 3 of 3/);
    const grouped = structuredClone(nodes);
    groupImageCarousels(nodes);
    assert.deepEqual(nodes, grouped);
});

await test("Retains image links, captions, credits and intrinsic dimensions", () => {
    const linked: Nodes[number] = ["a", { href: "/source/" }, image("Linked")];
    const caption: Nodes[number] = [
        "figcaption",
        {},
        "Caption ",
        ["a", { href: "/credit/" }, "Credit"],
    ];
    const nodes: Nodes = [
        paragraph(linked),
        ["figure", {}, caption, image("Figure")],
    ];
    groupImageCarousels(nodes);
    const output = JSON.stringify(nodes);
    assert.ok(output.includes(JSON.stringify(linked)));
    assert.ok(output.includes(JSON.stringify(caption)));
    assert.ok(output.includes(JSON.stringify(paragraph(image("Figure")))));
});

for (const boundary of [
    paragraph("Prose"),
    ["h2", {}, "Heading"],
    ["hr", {}],
    paragraph(image("Inline"), "Text"),
    ["figure", {}, ["video", { src: "/clip.mp4" }]],
    ["blockquote", {}, paragraph(image("Nested"))],
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

await test("Does not reframe standalone raw images or captioned figures", () => {
    const nodes: Nodes = [
        image("Raw"),
        ["hr", {}],
        ["figure", {}, image("Figure"), ["figcaption", {}, "Caption"]],
    ];
    const original = structuredClone(nodes);
    groupImageCarousels(nodes);
    assert.deepEqual(nodes, original);
});
