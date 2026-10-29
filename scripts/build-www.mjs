// Wraps the game page (src/game.html, the same file as the playtest artifact) in a full HTML document for the app.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const game = readFileSync(new URL("../src/game.html", import.meta.url), "utf8");
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<style>
:root { color-scheme: light; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
html, body { margin: 0; height: 100%; }
html { box-sizing: border-box; }
img { max-width: 100%; }
[hidden] { display: none !important; }
body { font: 14px system-ui, sans-serif; }
</style>
</head>
<body>
${game}
</body>
</html>
`;
mkdirSync(new URL("../www/", import.meta.url), { recursive: true });
writeFileSync(new URL("../www/index.html", import.meta.url), page);
console.log("www/index.html written");
