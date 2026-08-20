import { ProjectChatType } from "../../communication/models/chat.model";

const CHAT_TITLE_TO_TYPE: Record<string, ProjectChatType> = {
  "Sales Consultation": "SALES",
  "Design Discussion": "DESIGNER",
};

export function normalizeNotificationMetadata(raw: unknown): Record<string, unknown> | undefined {
  if (!raw) {
    return undefined;
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }

  if (typeof raw === "object") {
    return raw as Record<string, unknown>;
  }

  return undefined;
}

export function readMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!metadata) {
    return undefined;
  }

  const direct = metadata[key];
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const pascalKey = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  const pascal = metadata[pascalKey];
  if (typeof pascal === "string" && pascal.trim()) {
    return pascal.trim();
  }

  return undefined;
}

export function parseChatTitleFromMessage(message: string): string | undefined {
  const match = message.match(/sent a new message in ["'](.+?)["']/i);
  return match?.[1]?.trim();
}

export function inferChatTypeFromMessage(message: string): ProjectChatType | undefined {
  const chatTitle = parseChatTitleFromMessage(message);
  if (chatTitle && CHAT_TITLE_TO_TYPE[chatTitle]) {
    return CHAT_TITLE_TO_TYPE[chatTitle];
  }

  if (/design discussion/i.test(message)) {
    return "DESIGNER";
  }

  if (/sales consultation/i.test(message)) {
    return "SALES";
  }

  return undefined;
}
