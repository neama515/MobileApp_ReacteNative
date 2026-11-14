import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "../../components/haptic-tab";
import { styles } from "../../style/styles";
import { I18nManager } from 'react-native';

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: styles.container.backgroundColor,
          borderTopWidth: 0,
          paddingBottom: 30,
          height: 80,
        },
        tabBarActiveTintColor: "#34699A",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "900" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "العملاء",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={28} color={typeof color === "number" ? "#34699A" : color ?? "#34699A"} />
          ),
        }}
      />

      <Tabs.Screen
        name="debts"
        options={{
          title: "المديونيات",
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet" size={26} color={typeof color === "number" ? "#34699A" : color ?? "#34699A"} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "الملف الشخصي",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={28} color={typeof color === "number" ? "#34699A" : color ?? "#34699A"} />
          ),
        }}
      />
    </Tabs>
  );
}
