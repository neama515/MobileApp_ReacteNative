import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '../../components/haptic-tab';
import { styles } from '../../css/styles';

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
          title: 'العملاء',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'الملف الشخصي',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
