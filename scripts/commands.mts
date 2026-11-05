import packageConfiguration from "../package.json" with { type: "json" };

const { scripts, scriptDescriptions } = packageConfiguration;

console.log("Usage: npm run <script> [-- <arguments>]\n");
const width = Math.max(...Object.keys(scripts).map((name) => name.length));
for (const [name, description] of Object.entries(scriptDescriptions)) {
    console.log(`${name.padEnd(width)}  ${description}`);
}
