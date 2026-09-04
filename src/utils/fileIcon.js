/**
 * Resolve local file/folder icons from /public/images/icons
 * based on extension. Never relies on private S3 icon URLs.
 */

const ICON_BASE = "/images/icons";

const KNOWN_ICONS = new Set([
  "ai",
  "avi",
  "bmp",
  "cdr",
  "csv",
  "dll",
  "doc",
  "docx",
  "dwg",
  "eps",
  "exe",
  "flv",
  "gif",
  "html",
  "iso",
  "javascript",
  "jpg",
  "mdb",
  "mid",
  "mov",
  "mp3",
  "mp4",
  "mpeg",
  "pdf",
  "png",
  "ppt",
  "ps",
  "pub",
  "rar",
  "raw",
  "rss",
  "svg",
  "txt",
  "wav",
  "wma",
  "xls",
  "xml",
  "zip",
]);

const EXTENSION_ALIASES = {
  // images
  jpeg: "jpg",
  jfif: "jpg",
  jpe: "jpg",
  webp: "png",
  heic: "jpg",
  heif: "jpg",
  tif: "bmp",
  tiff: "bmp",
  ico: "png",
  // documents
  xlsx: "xls",
  xlsm: "xls",
  xltx: "xls",
  pptx: "ppt",
  pptm: "ppt",
  docm: "docx",
  rtf: "doc",
  odt: "doc",
  ods: "xls",
  odp: "ppt",
  pages: "doc",
  numbers: "xls",
  key: "ppt",
  md: "txt",
  markdown: "txt",
  log: "txt",
  json: "xml",
  yml: "xml",
  yaml: "xml",
  // code
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "javascript",
  tsx: "javascript",
  css: "html",
  scss: "html",
  less: "html",
  htm: "html",
  php: "html",
  py: "txt",
  java: "txt",
  c: "txt",
  cpp: "txt",
  h: "txt",
  cs: "txt",
  go: "txt",
  rb: "txt",
  rs: "txt",
  sh: "txt",
  bat: "exe",
  cmd: "exe",
  ps1: "exe",
  sql: "csv",
  // archives
  "7z": "zip",
  tar: "zip",
  gz: "zip",
  tgz: "zip",
  bz2: "zip",
  xz: "zip",
  apk: "zip",
  jar: "zip",
  war: "zip",
  // video / audio
  mkv: "mp4",
  webm: "mp4",
  m4v: "mp4",
  "3gp": "mp4",
  wmv: "avi",
  mpg: "mpeg",
  m4a: "mp3",
  aac: "mp3",
  flac: "wav",
  ogg: "mp3",
  opus: "mp3",
  aiff: "wav",
  // design / misc
  psd: "ps",
  ai: "ai",
  sketch: "ps",
  fig: "svg",
  dmg: "iso",
  img: "iso",
  bin: "iso",
  // fallbacks already covered by known icons
};

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "heic",
  "heif",
]);

const extensionFromFileName = (name) => {
  const base = String(name || "").split("/").filter(Boolean).pop() || "";
  const lastDot = base.lastIndexOf(".");
  if (lastDot === -1 || lastDot === base.length - 1) return "";
  return base.slice(lastDot + 1).toLowerCase();
};

const isKnownExtension = (ext) => {
  if (!ext) return false;
  const e = String(ext).toLowerCase().replace(/^\./, "");
  if (!e || e === "folder" || e.includes("/")) return false;
  const mapped = EXTENSION_ALIASES[e] || e;
  return KNOWN_ICONS.has(mapped);
};

const extractExtension = (file) => {
  if (
    file?.isFolder ||
    String(file?.fileType || "").toLowerCase() === "folder"
  ) {
    return "";
  }

  const fromType = (file?.fileType || "").toString().trim().toLowerCase();
  if (
    fromType &&
    fromType !== "folder" &&
    !fromType.includes("/") &&
    isKnownExtension(fromType)
  ) {
    return fromType.replace(/^\./, "");
  }

  return extensionFromFileName(file?.fileName || file?.filePath || "");
};

export const isImageFile = (file) => {
  const ext = extractExtension(file);
  const mapped = EXTENSION_ALIASES[ext] || ext;
  return IMAGE_EXTENSIONS.has(ext) || IMAGE_EXTENSIONS.has(mapped);
};

export const isPublicAcl = (file) => {
  const acl = (file?.ACL || file?.acl || "").toString().toLowerCase();
  if (acl === "public" || acl === "public-read") return true;
  if (file?.isPublic === true) return true;
  if (file?.isPrivate === false) return true;
  return false;
};

/**
 * @param {object} file
 * @param {object} [options]
 * @param {string} [options.sharedIconSrc] - keep existing shared-folder icon (Files uses frontend sharedIcon)
 * @param {string} [options.blackboxIconSrc] - special blackbox folder icon
 */
export const resolveFileIconPath = (file, options = {}) => {
  const { sharedIconSrc, blackboxIconSrc } = options;

  const isFolderEntry =
    file?.isFolder === true ||
    file?.isFolder === "true" ||
    String(file?.fileType || "").toLowerCase() === "folder";

  // isShared marks items inside a shared-folder view — only folder rows use the shared icon
  if (file?.isShared && isFolderEntry) {
    if (sharedIconSrc) return sharedIconSrc;
    if (file?.icon) return file.icon;
    return `${ICON_BASE}/Folder.svg`;
  }

  if (file?.fileName === "blackbox" && blackboxIconSrc) {
    return blackboxIconSrc;
  }

  if (isFolderEntry) {
    return `${ICON_BASE}/Folder.svg`;
  }

  const ext = extractExtension(file);
  const mapped = EXTENSION_ALIASES[ext] || ext;

  if (mapped && KNOWN_ICONS.has(mapped)) {
    return `${ICON_BASE}/${mapped}.svg`;
  }

  return `${ICON_BASE}/doc.svg`;
};

/** Encode each path segment so nested keys with spaces/special chars load in <img>. */
export const encodeStorageUrl = (rawUrl) => {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    u.pathname = u.pathname
      .split("/")
      .map((seg) => {
        if (!seg) return seg;
        try {
          return encodeURIComponent(decodeURIComponent(seg));
        } catch {
          return encodeURIComponent(seg);
        }
      })
      .join("/");
    return u.toString();
  } catch {
    return rawUrl;
  }
};

/**
 * Outdated getFolder often returns AWS hosts for DigitalOcean buckets.
 * Rewrite virtual-hosted S3 URLs to DO Spaces (same host style Files uses).
 */
export const rewriteAwsUrlToDigitalOcean = (rawUrl) => {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    // bucket.s3.ap-south-1.amazonaws.com OR bucket.s3.amazonaws.com
    const m = u.hostname.match(/^(.+)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i);
    if (!m) return null;
    const bucket = m[1];
    return `https://${bucket}.blr1.digitaloceanspaces.com${u.pathname}${u.search}`;
  } catch {
    return null;
  }
};

/** Path-style DO alternate: https://blr1.digitaloceanspaces.com/{bucket}/{key} */
export const toDigitalOceanPathStyle = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    const m = u.hostname.match(/^(.+)\.blr1\.digitaloceanspaces\.com$/i);
    if (!m) return null;
    return `https://blr1.digitaloceanspaces.com/${m[1]}${u.pathname}${u.search}`;
  } catch {
    return null;
  }
};

/**
 * Normalize public object URL for <img> (encode + fix outdated AWS host).
 */
export const normalizePublicStorageUrl = (rawUrl) => {
  if (!rawUrl) return rawUrl;
  const rewritten = rewriteAwsUrlToDigitalOcean(rawUrl);
  return encodeStorageUrl(rewritten || rawUrl);
};

/** Fallback URL list for card preview onError retries. */
export const getCardPreviewUrlFallbacks = (rawUrl) => {
  if (!rawUrl) return [];
  const out = [];
  const push = (u) => {
    if (!u) return;
    const encoded = encodeStorageUrl(u);
    if (encoded && !out.includes(encoded)) out.push(encoded);
  };

  push(rawUrl);
  push(rewriteAwsUrlToDigitalOcean(rawUrl));
  push(normalizePublicStorageUrl(rawUrl));
  push(toDigitalOceanPathStyle(normalizePublicStorageUrl(rawUrl)));
  push(toDigitalOceanPathStyle(rawUrl));

  return out;
};

/** Max size for card image preview (1 MB). Larger files stay as icons. */
const MAX_CARD_PREVIEW_BYTES = 1_000_000;

/** Parse API fileSize ("500 KB", "1.2 MB", bytes number) to bytes. */
export const parseFileSizeToBytes = (size) => {
  if (size == null || size === "") return NaN;
  if (typeof size === "number" && Number.isFinite(size)) return size;

  const str = String(size).trim();
  const match = str.match(/^([\d.]+)\s*([a-zA-Z]*)$/);
  if (!match) return NaN;

  const value = parseFloat(match[1]);
  if (!Number.isFinite(value)) return NaN;

  const unit = (match[2] || "B").toUpperCase();
  const units = {
    B: 1,
    BYTE: 1,
    BYTES: 1,
    KB: 1000,
    MB: 1000 ** 2,
    GB: 1000 ** 3,
    TB: 1000 ** 4,
  };
  return value * (units[unit] || 1);
};

/** True when file is small enough for a safe card preview. */
export const isCardPreviewSizeOk = (file) => {
  const bytes = parseFileSizeToBytes(file?.fileSize);
  // Unknown size → no preview (avoid pulling 20–40MB by accident)
  if (!Number.isFinite(bytes) || bytes <= 0) return false;
  return bytes < MAX_CARD_PREVIEW_BYTES;
};

/** True when card should show a real image thumbnail (public image with URL). */
export const isCardImagePreview = (file) =>
  Boolean(
    file &&
      !file.isFolder &&
      isPublicAcl(file) &&
      isImageFile(file) &&
      isCardPreviewSizeOk(file) &&
      (file.url || file.fileUrl)
  );

/**
 * Card/grid media: public images use their URL; otherwise local icon.
 */
export const resolveCardPreviewSrc = (file, options = {}) => {
  if (isCardImagePreview(file)) {
    return normalizePublicStorageUrl(file.url || file.fileUrl);
  }
  return resolveFileIconPath(file, options);
};

/**
 * Frontend-only fix for outdated getFolder URLs (no backend change).
 */
export const normalizeFolderFilesForPreview = (files) => {
  if (!Array.isArray(files)) return files;
  return files.map((file) => {
    if (!file || file.isFolder) return file;
    const raw = file.url || file.fileUrl;
    if (!raw) return file;
    const fixed = normalizePublicStorageUrl(raw);
    if (fixed === raw && fixed === file.url) return file;
    return {
      ...file,
      url: fixed,
      ...(file.fileUrl ? { fileUrl: fixed } : {}),
    };
  });
};

/**
 * Normalize GET /search-file rows so icons and folder actions match getFolder.
 */
export const normalizeSearchResultItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    if (!item) return item;

    const rawName = String(item.fileName || item.filePath || "").replace(/\/+$/, "");
    const isFolder =
      item.isFolder === true ||
      String(item.fileType || "").toLowerCase() === "folder" ||
      String(item.fileName || "").endsWith("/");

    if (isFolder) {
      return {
        ...item,
        fileName: rawName,
        filePath: item.filePath || rawName,
        isFolder: true,
        fileType: "Folder",
      };
    }

    const extFromName = extensionFromFileName(rawName);
    const rawType = String(item.fileType || "")
      .trim()
      .toLowerCase();
    const fileType =
      rawType && isKnownExtension(rawType) ? rawType : extFromName;

    return {
      ...item,
      fileName: rawName,
      filePath: item.filePath || rawName,
      isFolder: false,
      fileType,
    };
  });
};

export default resolveFileIconPath;
