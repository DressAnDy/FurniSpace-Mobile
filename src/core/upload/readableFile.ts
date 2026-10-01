import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const UPLOAD_DIR_NAME = "furnispace-uploads";

function sanitizeUploadFileName(name: string): string {
  const trimmed = name.trim() || `upload-${Date.now()}`;
  const safe = trimmed.replace(/[^\w.\-()+ ]+/g, "_");
  return safe.slice(-120) || `upload-${Date.now()}`;
}

function uploadsDirectory(): string | null {
  const root = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  return root ? `${root}${UPLOAD_DIR_NAME}/` : null;
}

async function ensureUploadsDirectory(directory: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(directory);
  if (info.exists) {
    return;
  }
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
}

function candidateSourceUris(uri: string): string[] {
  const candidates = [uri];

  // Never decode content:// — Android ContentResolver needs the encoded form.
  if (uri.startsWith("content://")) {
    return candidates;
  }

  try {
    const decoded = decodeURI(uri);
    if (decoded !== uri) {
      candidates.push(decoded);
    }
  } catch {
    // Ignore malformed percent-encoding and keep the original URI.
  }

  return candidates;
}

async function isReadableLocalFile(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && !info.isDirectory;
  } catch {
    return false;
  }
}

async function copyViaBase64(from: string, to: string): Promise<void> {
  const base64 = await FileSystem.readAsStringAsync(from, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await FileSystem.writeAsStringAsync(to, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function copyViaFetch(from: string, to: string): Promise<void> {
  const response = await fetch(from);
  if (!response.ok) {
    throw new Error(`Could not fetch selected file (${response.status}).`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  if (typeof globalThis.btoa !== "function") {
    throw new TypeError("Base64 encoding is unavailable on this device.");
  }

  await FileSystem.writeAsStringAsync(to, globalThis.btoa(binary), {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function verifyCopiedFile(destination: string): Promise<boolean> {
  const copied = await FileSystem.getInfoAsync(destination);
  return copied.exists && !copied.isDirectory;
}

async function copyToAppUploads(uri: string, fileName: string): Promise<string> {
  const directory = uploadsDirectory();
  if (!directory) {
    throw new Error("Could not access local storage for this file.");
  }

  await ensureUploadsDirectory(directory);
  const destination = `${directory}${Date.now()}-${sanitizeUploadFileName(fileName)}`;
  const sources = candidateSourceUris(uri);
  let lastError: unknown;

  for (const source of sources) {
    try {
      await FileSystem.copyAsync({ from: source, to: destination });
      if (await verifyCopiedFile(destination)) {
        return destination;
      }
    } catch (error) {
      lastError = error;
    }
  }

  // readAsStringAsync only supports file:// (and some SAF) URIs — not content://.
  for (const source of sources) {
    if (!source.startsWith("file://") && !source.startsWith("file:")) {
      continue;
    }

    try {
      await copyViaBase64(source, destination);
      if (await verifyCopiedFile(destination)) {
        return destination;
      }
    } catch (error) {
      lastError = error;
    }
  }

  for (const source of sources) {
    try {
      await copyViaFetch(source, destination);
      if (await verifyCopiedFile(destination)) {
        return destination;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Could not copy the selected file. Please choose it again.");
}

/**
 * Android DocumentPicker cache URIs often cannot be read by FileSystem.uploadAsync.
 * Copy into the app cache first so PUT uploads have a stable, readable file:// path.
 */
export async function ensureReadableUploadUri(uri: string, fileName: string): Promise<string> {
  if (
    Platform.OS === "web" ||
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("blob:") ||
    uri.startsWith("data:")
  ) {
    return uri;
  }

  const directory = uploadsDirectory();
  if (directory && uri.startsWith(directory)) {
    if (await isReadableLocalFile(uri)) {
      return uri;
    }
  }

  try {
    return await copyToAppUploads(uri, fileName);
  } catch {
    return uri;
  }
}

export async function copyPickedFileToCache(file: {
  uri: string;
  name: string;
  size?: number | null;
}): Promise<{ uri: string; size?: number | null }> {
  if (Platform.OS === "web") {
    return { uri: file.uri, size: file.size };
  }

  const directory = uploadsDirectory();
  if (directory && file.uri.startsWith(directory) && (await isReadableLocalFile(file.uri))) {
    const info = await FileSystem.getInfoAsync(file.uri);
    const size =
      info.exists && !info.isDirectory && typeof info.size === "number" && info.size > 0
        ? info.size
        : file.size;
    return { uri: file.uri, size };
  }

  try {
    const uri = await copyToAppUploads(file.uri, file.name);
    const info = await FileSystem.getInfoAsync(uri);
    const size =
      info.exists && !info.isDirectory && typeof info.size === "number" && info.size > 0
        ? info.size
        : file.size;

    return { uri, size };
  } catch (error) {
    // Last resort: keep the picker URI if Expo already made it readable.
    if (await isReadableLocalFile(file.uri)) {
      return { uri: file.uri, size: file.size };
    }
    throw error;
  }
}
