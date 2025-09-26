import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { styles } from "../css/styles";

export default function Index() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (!authContext) return null;
  const { user, login, loading } = authContext;

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("خطأ", error.message);
    }
  };


  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>أهلاً بعودتك 👋</Text>
        <Text style={styles.subtitle}>سجّل الدخول للمتابعة</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="أدخل البريد الإلكتروني"
          placeholderTextColor="#000"
          style={[styles.input, { textAlign: "right" }]}
          keyboardType="email-address"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="أدخل كلمة المرور"
          placeholderTextColor="#000"
          secureTextEntry
          style={[styles.input, { textAlign: "right" }]}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>تسجيل الدخول</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity >
          <Text style={styles.linkText}>
            ليس لديك حساب؟{" "}
            <Text onPress={() => router.push("/SignUp")} style={styles.linkHighlight}>إنشاء حساب جديد</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
