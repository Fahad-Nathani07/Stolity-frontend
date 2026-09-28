/**
 * rsuite CSS references source maps that are not published with the package.
 * CRA then fails or warns while loading those maps. Strip the sourceMappingURL
 * comments after install so postcss/source-map-loader ignore them.
 */
const fs = require("fs");
const path = require("path");

const cssFiles = [
  "node_modules/rsuite/SelectPicker/styles/index.css",
  "node_modules/rsuite/Tooltip/styles/index.css",
];

const mapFiles = [
  "node_modules/rsuite/SelectPicker/styles/index.css.map",
  "node_modules/rsuite/Tooltip/styles/index.css.map",
];

const sourceMapComment = /\/\*#\s*sourceMappingURL=[^*]*\*\//g;

let patched = 0;
for (const rel of cssFiles) {
  const full = path.join(__dirname, "..", rel);
  if (!fs.existsSync(full)) continue;
  const original = fs.readFileSync(full, "utf8");
  const next = original.replace(sourceMapComment, "");
  if (next !== original) {
    fs.writeFileSync(full, next);
    patched += 1;
  }
}

for (const rel of mapFiles) {
  const full = path.join(__dirname, "..", rel);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
  }
}

if (patched > 0) {
  console.log(`[fix-rsuite-css-sourcemaps] stripped sourceMappingURL from ${patched} css file(s)`);
}
