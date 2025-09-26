import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { InvoiceProvider } from "../context/InvoiceContext"; 
import { ActivityIndicator, Text, View } from "react-native";
import { BackHandler, Alert } from "react-native";

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log("Auth state:", { user, loading, segments });

    if (loading) return; 

    const inAuthGroup =
      segments[0] === undefined || segments[0] === "SignUp";

    if (!user && !inAuthGroup) {

      router.replace("/");
    } else if (user && inAuthGroup) {

      router.replace("/home");
    }
  }, [user, loading, segments]);


  useEffect(() => {
    const backAction = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        Alert.alert("تأكيد", "عايز تخرج من التطبيق؟", [
          { text: "إلغاء", style: "cancel" },
          { text: "خروج", onPress: () => BackHandler.exitApp() },
        ]);
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
        <Text>تحميل العملاء</Text>  
      </View>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InvoiceProvider> 
        <RootNavigator />
      </InvoiceProvider>    </AuthProvider>

  );
}
