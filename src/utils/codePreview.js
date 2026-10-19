/** Extensions opened as syntax-highlighted code in CustomFileModal. */
export const CODE_FILE_EXTENSIONS = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "html",
  "css",
  "json",
  "xml",
  "py",
  "java",
  "c",
  "cpp",
  "rb",
  "php",
  "sh",
  "go",
  "cs",
];

export const CODE_LANGUAGE_MAP = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  html: "html",
  css: "css",
  json: "json",
  xml: "xml",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  rb: "ruby",
  php: "php",
  sh: "bash",
  go: "go",
  cs: "csharp",
};

export function extensionFromFileName(fileName) {
  const base = String(fileName || "").split("/").pop() || "";
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function isCodeFileExtension(extOrName) {
  const ext = String(extOrName || "").includes(".")
    ? extensionFromFileName(extOrName)
    : String(extOrName || "").toLowerCase();
  return CODE_FILE_EXTENSIONS.includes(ext);
}

export function resolveCodeLanguage(fileName) {
  const ext = extensionFromFileName(fileName);
  return CODE_LANGUAGE_MAP[ext] || "text";
}
