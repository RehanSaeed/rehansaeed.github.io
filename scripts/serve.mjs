import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, relative, isAbsolute, join } from "node:path";

const root = resolve(process.argv[2] ?? "dist");
const port = Number(process.env.PORT ?? 8080);
const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".xml": "application/xml",
    ".txt": "text/plain",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".webmanifest": "application/manifest+json",
};
await stat(join(root, "404.html"));

createServer(async (request, response) => {
    try {
        if (!["GET", "HEAD"].includes(request.method)) {
            response.writeHead(405, { Allow: "GET, HEAD" }).end();
            return;
        }
        const url = new URL(request.url, "http://localhost");
        const path = decodeURIComponent(url.pathname);
        let file = resolve(root, `.${path}`);
        const relativePath = relative(root, file);
        if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
            response.writeHead(403).end();
            return;
        }
        let status = 200;
        try {
            if ((await stat(file)).isDirectory()) {
                if (!path.endsWith("/")) {
                    response
                        .writeHead(301, {
                            Location: `${url.pathname}/${url.search}`,
                        })
                        .end();
                    return;
                }
                file = join(file, "index.html");
            }
            await stat(file);
        } catch (error) {
            if (error.code !== "ENOENT" && error.code !== "ENOTDIR")
                throw error;
            file = join(root, "404.html");
            status = 404;
        }
        const body = await readFile(file);
        response.writeHead(status, {
            "Content-Type": types[extname(file)] ?? "application/octet-stream",
            "Content-Length": body.length,
            ...(file.endsWith("service-worker.js")
                ? { "Cache-Control": "no-cache" }
                : {}),
        });
        response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
        console.error("Static preview request failed:", error);
        response.writeHead(error instanceof URIError ? 400 : 500).end();
    }
}).listen(port, "127.0.0.1", () =>
    console.log(`Static preview: http://localhost:${port}`),
);
