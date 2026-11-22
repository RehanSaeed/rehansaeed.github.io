import {
    createServer,
    type IncomingMessage,
    type ServerResponse,
} from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, relative, isAbsolute, join } from "node:path";

const root = resolve(process.argv[2] ?? "dist");
const port = Number(process.env.PORT ?? 8080);
const types: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".xml": "application/xml",
    ".txt": "text/plain",
    ".md": "text/markdown; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".webmanifest": "application/manifest+json",
};
await stat(join(root, "404.html"));

const server = createServer((request, response) => {
    void serve(request, response);
});
if (process.send) {
    process.once("disconnect", () => {
        server.close();
        server.closeAllConnections();
    });
}
if (!process.send || process.connected) {
    server.listen(port, "127.0.0.1", () => {
        const address = server.address();
        console.log(
            `Static preview: http://localhost:${typeof address === "object" && address ? address.port : port}`,
        );
    });
}

async function serve(request: IncomingMessage, response: ServerResponse) {
    try {
        if (!request.method || !["GET", "HEAD"].includes(request.method)) {
            response.writeHead(405, { Allow: "GET, HEAD" }).end();
            return;
        }
        if (!request.url) {
            response.writeHead(400).end();
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
            if (
                !(error instanceof Error && "code" in error) ||
                (error.code !== "ENOENT" && error.code !== "ENOTDIR")
            ) {
                throw error;
            }
            file = join(root, "404.html");
            status = 404;
        }
        const body = await readFile(file);
        const headers = {
            "Content-Type": types[extname(file)] ?? "application/octet-stream",
            "Accept-Ranges": "bytes",
        };
        if (
            status === 200 &&
            request.method === "GET" &&
            request.headers.range
        ) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
            if (match && (match[1] || match[2])) {
                const suffix = match[1] === "";
                const start = suffix
                    ? Math.max(0, body.length - Number(match[2]))
                    : Number(match[1]);
                const end =
                    suffix || match[2] === ""
                        ? body.length - 1
                        : Math.min(Number(match[2]), body.length - 1);
                if (
                    !Number.isSafeInteger(start) ||
                    !Number.isSafeInteger(end) ||
                    start > end ||
                    start >= body.length
                ) {
                    response
                        .writeHead(416, {
                            ...headers,
                            "Content-Range": `bytes */${body.length}`,
                        })
                        .end();
                    return;
                }
                response.writeHead(206, {
                    ...headers,
                    "Content-Range": `bytes ${start}-${end}/${body.length}`,
                    "Content-Length": end - start + 1,
                });
                response.end(body.subarray(start, end + 1));
                return;
            }
        }
        response.writeHead(status, {
            ...headers,
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
}
