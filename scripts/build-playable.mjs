// Builds the playable ad: one self-contained HTML file for ad networks (no external requests).
// The ad's script and layout live in playable/playable.html. The art, sounds and core moves
// (bonking, the magic goose's teleport, bread toss, super quack) are lifted straight out of
// src/game.html at build time, so the ad always matches the game.
//
//   npm run playable
//   IOS_URL=https://apps.apple.com/app/id123 ANDROID_URL=https://play.google.com/... npm run playable
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const read = p => readFileSync(new URL("../" + p, import.meta.url));
const game = read("src/game.html").toString();
const template = read("playable/playable.html").toString();

// Pull one top-level declaration out of the game's script by name, matching braces to find its end.
function grab(name) {
  const m = new RegExp(`^(async )?function ${name}\\(|^const ${name} = |^let ${name} = `, "m").exec(game);
  if (!m) throw new Error(`build-playable: "${name}" not found in src/game.html`);
  const isFn = m[0].includes("function");
  let i = m.index, depth = 0, paren = 0, inBody = false, quote = null;
  for (; i < game.length; i++) {
    const c = game[i];
    if (quote) { // skip string contents ("${" inside template literals is balanced, so braces still count there)
      if (c === "\\") { i++; continue; }
      if (c === quote) quote = null;
      if (quote !== "`") continue;
    } else if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "(") paren++;
    else if (c === ")") paren--;
    else if (c === "{") { if (paren === 0) inBody = true; depth++; }
    else if (c === "}") { depth--; if (isFn && inBody && depth === 0) { i++; break; } }
    else if (c === ";" && !isFn && depth === 0 && paren === 0) { i++; break; }
  }
  return game.slice(m.index, i);
}

const SHARED = [
  // art
  "INK", "TYPES", "ell", "star", "drawDuck", "drawBasket", "drawSandwich", "drawPBJ", "drawHoagie",
  "drawBlanket", "drawPlayer", "drawBreadPiece", "drawBread", "drawAim", "render", "buildBg",
  "SANDWICH_SVG", "sandwichSVG",
  // sound
  "SUPER_QUACK_MP3", "DUCK_QUACK_MP3", "DUCKLING_QUACK_MP3", "GOOSE_HONK_MP3", "RUBBER_DUCK_MP3",
  "decodeClip", "tone", "wak", "SFX",
  // moves
  "MISS_PENALTY", "addText", "puff", "makeDuck", "bonkAt", "warpGoose", "throwBread", "superQuack"
].map(grab).join("\n");

// icons from the game's HUD markup
const svgOf = id => {
  const at = game.indexOf(`id="${id}"`);
  const s = game.indexOf("<svg", at), e = game.indexOf("</svg>", s) + 6;
  if (at < 0 || s < 0) throw new Error(`build-playable: icon #${id} not found`);
  return game.slice(s, e);
};

const b64 = p => read(p).toString("base64");
const FONTS = `@font-face { font-family: "Bagel Fat One"; font-weight: 400; font-display: block; src: url(data:font/woff2;base64,${b64("playable/fonts/bagel-fat-one-latin.woff2")}) format("woff2"); }
@font-face { font-family: "Baloo 2"; font-weight: 400 800; font-display: block; src: url(data:font/woff2;base64,${b64("playable/fonts/baloo2-latin.woff2")}) format("woff2"); }`;

const STORE = {
  ios: process.env.IOS_URL || "https://apps.apple.com/app/id6828147105",
  android: process.env.ANDROID_URL || "https://play.google.com/store/apps/details?id=com.quaattack.game"
};

const out = template
  .replace("/*@FONTS@*/", () => FONTS)
  .replace("/*@STORE@*/", () => `const STORE = ${JSON.stringify(STORE)};`)
  .replace("/*@SHARED@*/", () => SHARED)
  .replace("<!--@ICON_BREAD@-->", () => svgOf("pw-bread"))
  .replace("<!--@ICON_QUACK@-->", () => svgOf("pw-quack"))
  .replace("<!--@ICON_MUTE@-->", () => svgOf("muteBtn"));
if (/@[A-Z_]+@/.test(out)) throw new Error("build-playable: a placeholder was left unfilled");
if (/(src|href)=["']https?:|url\(["']?https?:|@import/i.test(out)) throw new Error("build-playable: the ad must not load anything from the network");

mkdirSync(new URL("../playable/dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("../playable/dist/quaattack-playable.html", import.meta.url), out);
const kb = Buffer.byteLength(out) / 1024;
console.log(`playable/dist/quaattack-playable.html written (${kb.toFixed(0)} KB)`);
if (kb > 5 * 1024) throw new Error("build-playable: over the 5 MB ad network limit");
