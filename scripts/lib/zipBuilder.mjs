import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let j = 0; j < 8; j += 1) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (~crc) >>> 0;
}

function dosTimeDate(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dt = ((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dt };
}

const PRECOMPRESSED_EXT = /\.(jpe?g|png|webp|gif|avif|mp3|m4a|mp4|zip|ico)$/i;

/**
 * Collects files recursively from `rootDir` with forward-slash relative paths.
 */
function walkEntries(rootDir, currentDir = rootDir, entries = []) {
  const items = fs.readdirSync(currentDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const item of items) {
    const fullPath = path.join(currentDir, item.name);
    const relPath = path.relative(rootDir, fullPath).split(path.sep).join('/');
    if (item.isDirectory()) {
      entries.push({ relPath: `${relPath}/`, fullPath, isDir: true });
      walkEntries(rootDir, fullPath, entries);
    } else if (item.isFile()) {
      entries.push({ relPath, fullPath, isDir: false });
    }
  }
  return entries;
}

/**
 * Creates a ZIP archive from `sourceDir`, supporting exclusion filters,
 * LF normalization for `.sh` scripts, and Unix POSIX `0o755` executable mode bits.
 */
export function createZipFromDirectory(sourceDir, outputZipPath, options = {}) {
  const {
    filter = () => true,
    posixPermissions = false,
    executablePattern = /(?:^|\/)[^/]+\.(?:sh|command)$/i
  } = options;

  const allEntries = walkEntries(sourceDir);
  const includedDirs = new Set();
  const fileEntries = [];

  for (const entry of allEntries) {
    if (entry.isDir) continue;
    if (!filter(entry.relPath, entry)) continue;
    fileEntries.push(entry);

    const parts = entry.relPath.split('/');
    for (let i = 1; i < parts.length; i += 1) {
      includedDirs.add(`${parts.slice(0, i).join('/')}/`);
    }
  }

  const orderedEntries = [
    ...Array.from(includedDirs)
      .sort()
      .map((relPath) => ({ relPath, isDir: true, fullPath: null })),
    ...fileEntries
  ];

  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const entry of orderedEntries) {
    const nameBuf = Buffer.from(entry.relPath, 'utf8');
    let rawData = Buffer.alloc(0);
    let mtime = new Date();

    if (!entry.isDir) {
      const stat = fs.statSync(entry.fullPath);
      mtime = stat.mtime;
      rawData = fs.readFileSync(entry.fullPath);
      if (posixPermissions && /\.sh$/i.test(entry.relPath)) {
        rawData = Buffer.from(rawData.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
      }
    }

    const crc = crc32(rawData);
    const shouldStore = entry.isDir || PRECOMPRESSED_EXT.test(entry.relPath) || rawData.length === 0;
    const compressed = shouldStore ? rawData : zlib.deflateRawSync(rawData, { level: 6 });
    const useDeflate = !shouldStore && compressed.length < rawData.length;
    const finalData = useDeflate ? compressed : rawData;
    const method = useDeflate ? 8 : 0;
    const { time, date } = dosTimeDate(mtime);

    // Local File Header
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(finalData.length, 18);
    local.writeUInt32LE(rawData.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    localChunks.push(local, finalData);

    // Central Directory Header
    const central = Buffer.alloc(46 + nameBuf.length);
    const versionMadeBy = posixPermissions ? ((3 << 8) | 20) : 20;
    let extAttrs = entry.isDir ? 0x10 : 0;
    if (posixPermissions) {
      const unixMode = entry.isDir
        ? 0o040755
        : (executablePattern.test(entry.relPath) ? 0o100755 : 0o100644);
      extAttrs = (((unixMode & 0xffff) << 16) | (entry.isDir ? 0x10 : 0)) >>> 0;
    }

    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(versionMadeBy, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(finalData.length, 20);
    central.writeUInt32LE(rawData.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(extAttrs, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    centralChunks.push(central);
    offset += local.length + finalData.length;
  }

  let centralDirSize = 0;
  for (const c of centralChunks) centralDirSize += c.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(orderedEntries.length, 8);
  eocd.writeUInt16LE(orderedEntries.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.mkdirSync(path.dirname(outputZipPath), { recursive: true });
  fs.writeFileSync(outputZipPath, Buffer.concat([...localChunks, ...centralChunks, eocd]));

  return { entryCount: orderedEntries.length, fileCount: fileEntries.length };
}

/**
 * Parses Central Directory headers of a `.zip` file to verify entries and POSIX attributes.
 */
export function inspectZipEntries(zipPath) {
  const buf = fs.readFileSync(zipPath);
  const results = [];
  let eocdOffset = -1;

  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error(`Invalid ZIP archive (missing EOCD): ${zipPath}`);
  }

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  let cursor = buf.readUInt32LE(eocdOffset + 16);

  for (let idx = 0; idx < totalEntries; idx += 1) {
    if (buf.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error(`Corrupt Central Directory entry at offset ${cursor}`);
    }
    const versionMadeBy = buf.readUInt16LE(cursor + 4);
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const externalAttributes = buf.readUInt32LE(cursor + 38);
    const name = buf.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8');
    const unixMode = (externalAttributes >>> 16) & 0xffff;

    results.push({
      name,
      versionMadeBy,
      unixMode,
      isExecutable: (unixMode & 0o111) !== 0
    });
    cursor += 46 + nameLen + extraLen + commentLen;
  }

  return results;
}
