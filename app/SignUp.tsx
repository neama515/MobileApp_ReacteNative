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
import { styles } from "../style/styles";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (!authContext) return null;
  const { register, loading } = authContext;

  const handleSignUp = async () => {
    try {
      await register(email, password);
      Alert.alert("تم", "تم إنشاء الحساب بنجاح 🎉", [
        { text: "موافق", onPress: () => router.replace("/") },
      ]);
    } catch (error: any) {
      Alert.alert("خطأ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>إنشاء حساب جديد ✨</Text>
      <Text style={styles.subtitle}>من فضلك أدخل بياناتك</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>إنشاء الحساب</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/")}>
        <Text style={styles.linkText}>
          لديك حساب بالفعل؟{" "}
          <Text style={styles.linkHighlight}>تسجيل الدخول</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
