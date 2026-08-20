import Constants from "expo-constants";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

const isExpoGo = Constants.appOwnership === "expo";

let configured = false;
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (isExpoGo) {
    return null;
  }

  notificationsModulePromise ??= import("expo-notifications");
  return notificationsModulePromise;
}

export function isDeviceNotificationSupported(): boolean {
  return !isExpoGo;
}

export async function configureLocalNotifications(): Promise<void> {
  if (configured || isExpoGo) {
    return;
  }

  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  configured = true;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (isExpoGo) {
    return false;
  }

  await configureLocalNotifications();

  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function showLocalNotification(input: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  if (isExpoGo) {
    return;
  }

  await configureLocalNotifications();

  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return;
  }

  const allowed = await ensureNotificationPermissions();
  if (!allowed) {
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "FurniSpace Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#C9A86A",
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      data: input.data ?? {},
      sound: true,
    },
    trigger: null,
  });
}
