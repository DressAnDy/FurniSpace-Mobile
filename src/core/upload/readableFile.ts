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

async function copyViaBase64(from: string, to: string): Promise<void> {
  const base64 = await FileSystem.readAsStringAsync(from, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await FileSystem.writeAsStringAsync(to, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function copyToAppUploads(uri: string, fileName: string): Promise<string> {
  const directory = uploadsDirectory();
  if (!directory) {
    throw new Error("Could not access local storage for this file.");
  }

  await ensureUploadsDirectory(directory);
  const destination = `${directory}${Date.now()}-${sanitizeUploadFileName(fileName)}`;
  const source = decodeURI(uri);

  try {
    await FileSystem.copyAsync({ from: source, to: destination });
  } catch {
    await copyViaBase64(source, destination);
  }

  const copied = await FileSystem.getInfoAsync(destination);
  if (!copied.exists || copied.isDirectory) {
    throw new Error("Could not copy the selected file. Please choose it again.");
  }

  return destination;
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
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && !info.isDirectory) {
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

  const uri = await copyToAppUploads(file.uri, file.name);
  const info = await FileSystem.getInfoAsync(uri);
  const size =
    info.exists && !info.isDirectory && typeof info.size === "number" && info.size > 0
      ? info.size
      : file.size;

  return { uri, size };
}
