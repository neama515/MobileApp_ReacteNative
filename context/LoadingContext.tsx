import React, { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";

type LoadingContextValue = {
  runWithLoading: <T>(message: string, operation: () => Promise<T>) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const pendingOperations = useRef(0);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const runWithLoading = useCallback<LoadingContextValue["runWithLoading"]>(async (label, operation) => {
    pendingOperations.current += 1;
    setMessage(label);
    setVisible(true);
    try {
      return await operation();
    } finally {
      pendingOperations.current = Math.max(0, pendingOperations.current - 1);
      if (pendingOperations.current === 0) {
        setVisible(false);
        setMessage("");
      }
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ runWithLoading }}>
      {children}
      <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
        <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.38)", alignItems: "center", justifyContent: "center" }}>
          <View style={{ minWidth: 190, maxWidth: "85%", paddingHorizontal: 24, paddingVertical: 20, borderRadius: 16, backgroundColor: "white", alignItems: "center", gap: 12, elevation: 8 }}>
            <ActivityIndicator size="large" color="#34699A" />
            <Text accessibilityRole="alert" style={{ color: "#1e293b", fontSize: 16, fontWeight: "600", textAlign: "center" }}>{message}</Text>
          </View>
        </View>
      </Modal>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("useLoading must be used inside LoadingProvider");
  return context;
}
