import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const site = JSON.parse(
    await readFile(new URL("../site.json", import.meta.url), "utf8"),
);
const origin = new URL(site.url).origin;
const domain = new URL(origin).hostname;
const digest = (body) => createHash("sha256").update(body).digest("hex");
const required = [
    "index.html",
    "404.html",
    "CNAME",
    "robots.txt",
    "service-worker.js",
    "manifest.webmanifest",
    "flexsearch.json",
    "rss.xml",
    "atom.xml",
    "feed.json",
];

function localPath(value, page) {
    const url = new URL(value, `${origin}${page}`);
    return url.origin === origin ? decodeURIComponent(url.pathname) : null;
}

export async function verifyArtifact(directory, routes) {
    const { load } = await import("cheerio");
    const files = new Set();
    let bytes = 0;
    for (const name of await readdir(directory, { recursive: true })) {
        const path = join(directory, name);
        const stat = await lstat(path);
        assert(
            !stat.isSymbolicLink(),
            `Pages artifact contains a symlink: ${name}`,
        );
        if (!stat.isFile()) continue;
        assert.equal(
            stat.nlink,
            1,
            `Pages artifact contains a hard link: ${name}`,
        );
        const file = String(name).replaceAll("\\", "/");
        assert(
            !/(^|\/)(?:\.git|\.github|\.env(?:\.[^/]*)?|node_modules)(?:\/|$)/.test(
                file,
            ),
            `Private build file in Pages artifact: ${file}`,
        );
        files.add(file);
        bytes += stat.size;
    }
    assert(
        bytes <= 1_000_000_000,
        `Pages site exceeds the 1 GB limit: ${bytes} bytes`,
    );
    for (const file of required) {
        assert(files.has(file), `Missing required Pages artifact: ${file}`);
        assert(
            (await lstat(join(directory, file))).size > 0,
            `Empty artifact: ${file}`,
        );
    }
    assert.equal(
        (await readFile(join(directory, "CNAME"), "utf8")).trim(),
        domain,
    );
    const exists = (path) => {
        const file = path.replace(/^\/+/, "");
        return (
            files.has(file || "index.html") ||
            files.has(`${file.replace(/\/?$/, "/")}index.html`)
        );
    };
    for (const route of routes) {
        assert(exists(route), `Missing prerendered route: ${route}`);
    }
    for (const file of files) {
        if (!file.endsWith(".html")) continue;
        const page = `/${file.replace(/index\.html$/, "")}`;
        const $ = load(await readFile(join(directory, file), "utf8"));
        const ids = new Set();
        $("[id]").each((_, element) => {
            const id = $(element).attr("id");
            assert(!ids.has(id), `Duplicate id "${id}" in ${file}`);
            ids.add(id);
        });
        $(
            "script[src], link[rel=stylesheet], link[rel=preload], img[src], source[srcset], a[href]",
        ).each((_, element) => {
            const node = $(element);
            // Outbound Markdown examples and readers' links are not deployment assets.
            if (
                node.is("a") &&
                (node.attr("target") === "_blank" ||
                    node.closest(".comments").length)
            )
                return;
            const references = [
                node.attr("src"),
                node.attr("href"),
                ...(node
                    .attr("srcset")
                    ?.split(/,\s+/)
                    .map((part) => part.split(/\s+/)[0]) ?? []),
            ].filter(Boolean);
            for (const value of references) {
                const path = localPath(value, page);
                if (path !== null)
                    assert(
                        exists(path),
                        `${file}: missing local resource ${value}`,
                    );
            }
        });
    }
    return { files: files.size, bytes, routes: routes.length };
}

export function checkPagesSettings(pages) {
    assert.equal(
        pages.build_type,
        "workflow",
        "Pages still publishes a branch. Switch Settings > Pages > Source to GitHub Actions at the approved cutover.",
    );
    assert.equal(
        pages.cname,
        domain,
        "The Pages custom domain must remain unchanged.",
    );
}

function allows(sources, address) {
    const url = new URL(address);
    return sources.some((source) => {
        if (source === "'self'") return url.origin === origin;
        if (source === "*" || source === `${url.protocol}`) return true;
        if (!source.startsWith("https://")) return false;
        const parsed = new URL(source.replace("://*.", "://wildcard."));
        const wildcard = source.startsWith("https://*.");
        const host = wildcard
            ? url.hostname.endsWith(
                  `.${parsed.hostname.slice("wildcard.".length)}`,
              )
            : url.hostname === parsed.hostname;
        const path = parsed.pathname;
        return (
            host &&
            url.protocol === parsed.protocol &&
            url.port === parsed.port &&
            (path === "/" ||
                (path.endsWith("/")
                    ? url.pathname.startsWith(path)
                    : url.pathname === path))
        );
    });
}

export function checkCsp(policies, analyticsId) {
    const checks = [
        [
            "script-src-elem",
            ["script-src", "default-src"],
            `${origin}/_nuxt/app.js`,
        ],
        [
            "worker-src",
            ["child-src", "script-src", "default-src"],
            `${origin}/service-worker.js`,
        ],
    ];
    if (analyticsId) {
        checks.push(
            [
                "script-src-elem",
                ["script-src", "default-src"],
                "https://www.googletagmanager.com/gtag/js",
            ],
            [
                "connect-src",
                ["default-src"],
                "https://www.googletagmanager.com/",
            ],
            [
                "connect-src",
                ["default-src"],
                "https://www.google-analytics.com/g/collect",
            ],
            [
                "connect-src",
                ["default-src"],
                "https://region1.google-analytics.com/g/collect",
            ],
            ["connect-src", ["default-src"], "https://www.google.com/"],
            ["img-src", ["default-src"], "https://www.googletagmanager.com/"],
            [
                "img-src",
                ["default-src"],
                "https://region1.google-analytics.com/",
            ],
        );
    }
    for (const policy of policies) {
        const directives = new Map();
        for (const part of policy.split(";")) {
            const [name, ...sources] = part.trim().split(/\s+/);
            if (name && !directives.has(name)) directives.set(name, sources);
        }
        for (const [directive, fallbacks, address] of checks) {
            const effective = [directive, ...fallbacks].find((name) =>
                directives.has(name),
            );
            if (!effective) continue;
            const sources = directives.get(effective);
            assert(
                !sources.includes("'strict-dynamic'"),
                "The hosting CSP uses strict-dynamic; verify nonce propagation before deployment.",
            );
            assert(
                allows(sources, address),
                `Hosting CSP ${effective} blocks ${address}. Update the Cloudflare response-header policy before deployment.`,
            );
        }
    }
}

async function preflight() {
    const { load } = await import("cheerio");
    assert(
        process.env.GITHUB_TOKEN,
        "GITHUB_TOKEN is required for the read-only Pages settings check.",
    );
    const response = await fetch(
        `https://api.github.com/repos/${site.repository.owner}/${site.repository.name}/pages`,
        {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            signal: AbortSignal.timeout(30_000),
        },
    );
    assert(
        response.ok,
        `Cannot inspect Pages settings: HTTP ${response.status}`,
    );
    checkPagesSettings(await response.json());
    const live = await fetch(origin, {
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
    });
    assert.equal(
        live.status,
        200,
        `Custom domain is not healthy: HTTP ${live.status}`,
    );
    const $ = load(await live.text());
    const policies = [
        ...(live.headers
            .get("content-security-policy")
            ?.split(/,\s*(?=[a-z-]+\s)/) ?? []),
        ...$('meta[http-equiv="Content-Security-Policy" i]')
            .map((_, element) => $(element).attr("content"))
            .get(),
    ];
    checkCsp(policies, process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID);
    console.log(
        "Pages source, custom domain, HTTPS response and enforced CSP preflight passed.",
    );
    if (!process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
        console.log(
            "GA4 remains explicitly disabled: no measurement ID was supplied.",
        );
    }
}

async function writeDeployment(directory) {
    const { load } = await import("cheerio");
    const revision =
        process.env.GITHUB_SHA ??
        execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    assert.match(revision, /^[a-f0-9]{40}$/);
    const $ = load(await readFile(join(directory, "index.html"), "utf8"));
    const assets = $("script[src], link[rel=stylesheet]")
        .map((_, element) =>
            localPath($(element).attr("src") ?? $(element).attr("href"), "/"),
        )
        .get();
    const paths = new Set([
        "/",
        "/about/",
        "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
        "/rss.xml",
        "/atom.xml",
        "/feed.json",
        "/manifest.webmanifest",
        "/service-worker.js",
        ...assets,
    ]);
    const files = [];
    for (const path of paths) {
        const file = path.endsWith("/") ? `${path}index.html` : path;
        const body = await readFile(join(directory, file));
        files.push(
            path.endsWith("/")
                ? {
                      path,
                      status: 200,
                      contains: htmlSignals(body.toString(), load),
                  }
                : { path, status: 200, sha256: digest(body) },
        );
    }
    files.push({
        path: "/this-does-not-exist/",
        status: 404,
        contains: htmlSignals(
            await readFile(join(directory, "404.html"), "utf8"),
            load,
        ),
    });
    await writeFile(
        join(directory, "deployment.json"),
        JSON.stringify({ revision, files }, null, 2),
    );
}

function htmlSignals(body, load) {
    const $ = load(body);
    return [
        $("head > title").toString(),
        '<main id="main"',
        ...$("script[src], link[rel=stylesheet]")
            .map((_, element) => {
                const node = $(element);
                return node.attr("src")
                    ? `src="${node.attr("src")}"`
                    : `href="${node.attr("href")}"`;
            })
            .get(),
    ];
}

export async function verifyPublished(
    base,
    deployment,
    attempts = 12,
    delay = 10_000,
) {
    const deadline = Date.now() + Math.max(30_000, attempts * delay);
    const signal = () => {
        const remaining = deadline - Date.now();
        assert(remaining > 0, "Published-site verification timed out.");
        return AbortSignal.timeout(Math.min(30_000, remaining));
    };
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const marker = await fetch(`${base}/deployment.json`, {
                cache: "no-store",
                signal: signal(),
            });
            assert.equal(
                marker.status,
                200,
                "Deployment marker is unavailable",
            );
            assert.equal(
                (await marker.json()).revision,
                deployment.revision,
                "The custom domain is still serving another deployment",
            );
            for (const file of deployment.files) {
                const response = await fetch(`${base}${file.path}`, {
                    cache: "no-store",
                    redirect: "manual",
                    signal: signal(),
                });
                assert.equal(
                    response.status,
                    file.status,
                    `Unexpected HTTP status: ${file.path}`,
                );
                const body = Buffer.from(await response.arrayBuffer());
                if (file.contains) {
                    for (const signal of file.contains) {
                        assert(
                            body.toString().includes(signal),
                            `Stale or incomplete deployed HTML: ${file.path}`,
                        );
                    }
                } else {
                    assert.equal(
                        digest(body),
                        file.sha256,
                        `Stale or modified deployed resource: ${file.path}`,
                    );
                }
            }
            console.log(
                `Verified deployment ${deployment.revision} at ${base}: ${deployment.files.length} resources.`,
            );
            return;
        } catch (error) {
            if (attempt === attempts || Date.now() >= deadline) throw error;
            console.warn(
                `Deployment verification attempt ${attempt} failed: ${error.message}`,
            );
            await new Promise((resolve) =>
                setTimeout(resolve, Math.min(delay, deadline - Date.now())),
            );
        }
    }
}

async function main() {
    const mode = process.argv[2] ?? "artifact";
    const directory = resolve("dist");
    if (mode === "artifact") {
        const routes = (await readFile("tests/parity/urls.txt", "utf8"))
            .trim()
            .split(/\r?\n/);
        console.log(await verifyArtifact(directory, routes));
        await writeDeployment(directory);
    } else if (mode === "preflight") {
        await preflight();
    } else if (mode === "verify") {
        const deployment = JSON.parse(
            await readFile(join(directory, "deployment.json"), "utf8"),
        );
        assert.equal(
            deployment.revision,
            process.env.GITHUB_SHA ?? deployment.revision,
        );
        await verifyPublished(process.env.BASE_URL ?? origin, deployment);
    } else {
        throw new Error(`Unknown Pages verification mode: ${mode}`);
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
    await main();
}
