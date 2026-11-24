// Builds the self-contained iphone15.html. Run: node docs/mockups/build.mjs
// It inlines the real ranking code and sample cards, so the prototype tests the same rules as the app.
import { readFileSync as read, writeFileSync } from "node:fs";
const root = new URL("../../", import.meta.url);
const file = (p) => read(new URL(p, root), "utf8");
const names = ["walk", "tide", "list", "lamp", "ridge", "seed"];
const images = names.map((n) => `const ${n} = "data:image/svg+xml," + encodeURIComponent(${JSON.stringify(file(`src/demo/images/${n}.svg`).trim()).replaceAll("</", "<\\/")});`).join("\n");
const plain = (code) => code.replace(/^import .*\n/gm, "").replace(/^export /gm, "");
const out = `<title>光疊手機模擬</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${file("docs/mockups/iphone/style.css")}</style>
${file("docs/mockups/iphone/shell.html")}<script>
(() => {
${images}
${plain(file("src/demo/demoCards.js"))}
${plain(file("src/domain/rank.js"))}
${file("docs/mockups/iphone/app.js")}
})();
</script>
`;
writeFileSync(new URL("docs/mockups/iphone15.html", root), out);
const wrap = process.argv[2];
if (wrap) writeFileSync(wrap, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${out}</body></html>`);
