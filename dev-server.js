const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = Number(process.env.PORT || 8000);
const host = "127.0.0.1";
const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8"
};

http.createServer((request, response) => {
    const url = new URL(request.url, `http://${host}:${port}`);
    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/login.html" : url.pathname);
    const filePath = path.normalize(path.join(root, requestedPath));

    if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        response.writeHead(200, {
            "Content-Type": types[path.extname(filePath)] || "application/octet-stream"
        });
        response.end(data);
    });
}).listen(port, host, () => {
    console.log(`Serving ${root} at http://${host}:${port}`);
});
