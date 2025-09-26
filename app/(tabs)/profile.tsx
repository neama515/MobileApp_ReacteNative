import { useRouter } from "expo-router";
import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { styles } from "../../css/styles";

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>أهلًا بيك 👋</Text>
      <Text style={styles.subtitle}>
        {user?.email ? `مسجل كـ ${user.email}` : "أنت مسجل دخول"}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}
