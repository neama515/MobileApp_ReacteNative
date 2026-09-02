import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIFICATION_IDS_KEY = "debt-reminder-notification-ids";
const TWO_WEEKS_IN_SECONDS = 14 * 24 * 60 * 60;

type Debtor = { name: string; remainingAmount: number };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function clearDebtReminders() {
  const ids = JSON.parse(
    (await AsyncStorage.getItem(NOTIFICATION_IDS_KEY)) ?? "[]",
  ) as string[];

  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
  await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
}

export async function scheduleDebtReminder(debtors: Debtor[]) {
  await clearDebtReminders();

  if (debtors.length === 0 || Platform.OS === "web") return;

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("debt-reminders", {
      name: "تذكيرات المديونيات",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  const names = debtors.slice(0, 5).map((debtor) => debtor.name).join("، ");
  const extra = debtors.length > 5 ? ` وغيرهم (${debtors.length} عملاء)` : "";
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "تذكير بالمديونيات",
      body: `لم يتم السداد بالكامل: ${names}${extra}`,
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: "debt-reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TWO_WEEKS_IN_SECONDS,
      repeats: true,
    },
  });

  await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify([id]));
}
