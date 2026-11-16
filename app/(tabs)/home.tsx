import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import { styles } from "../../style/styles";
import { db } from "../firebase/firebase";
interface Client {
  id: string;
  name: string;
  country: string;
  userId: string;
  hasRemaining?: boolean;
  remainingAmount?: number;
}
interface InvoiceData {
  createdAt: number;
  remaining: number;
  number: string;
  date: string;
  items: any[];
  payments: any[];
  total: number;
}

// تظل القيمة موجودة عند الرجوع من شاشة العميل في نفس جلسة التطبيق.
let savedHomeScrollOffset = 0;

const Home = () => {
  const { user } = useAuth();
  const { runWithLoading } = useLoading();
  const router = useRouter();
  const { search: restoredSearch } = useLocalSearchParams<{ search?: string }>();

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const clientsListRef = useRef<FlatList<Client>>(null);
  const [loading, setLoading] = useState(true);
  const pendingRestoreOffset = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (savedHomeScrollOffset > 0) {
        pendingRestoreOffset.current = savedHomeScrollOffset;
      }
    }, []),
  );
  useEffect(() => {
    if (typeof restoredSearch === "string") setSearch(restoredSearch);
  }, [restoredSearch]);

  // useEffect(() => {
  //   if (
  //     loading ||
  //     pendingRestoreOffset.current !== null ||
  //     savedHomeScrollOffset <= 0 ||
  //     filteredClients.length === 0
  //   ) {
  //     return;
  //   }

  //   const frame = requestAnimationFrame(() => {
  //     clientsListRef.current?.scrollToOffset({
  //       offset: savedHomeScrollOffset,
  //       animated: false,
  //     });
  //     pendingRestoreOffset.current = null;
  //   });
  //   return () => cancelAnimationFrame(frame);
  // }, [filteredClients.length, loading]);

  useFocusEffect(
    useCallback(() => {
      if (savedHomeScrollOffset <= 0) return;

      const frame = requestAnimationFrame(() => {
        clientsListRef.current?.scrollToOffset({
          offset: savedHomeScrollOffset,
          animated: false,
        });
      });
      return () => cancelAnimationFrame(frame);
    }, []),
  );

const [error,setError]=useState("")
  const loadClients = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "clients"),
        where("userId", "==", user.uid),
      );
      setLoading(true);

      const querySnapshot = await getDocs(q);

      const clientsData: any[] = [];

      for (const docItem of querySnapshot.docs) {
        const data = docItem.data();

        clientsData.push({
          id: docItem.id,
          name: data.name,
          country: data.country,
          userId: data.userId,
          hasRemaining: (data.remainingAmount || 0) > 0,
          remainingAmount: data.remainingAmount || 0,
        });
      }

      clientsData.sort((a, b) => a.name.localeCompare(b.name, "ar"));
      setClients(clientsData);
    } catch (err) {
      setError("خطأ في تحميل العملاء")
      console.error("Error loading clients", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }
    if (!hasLoaded.current) {
      void runWithLoading("جاري تحميل العملاء...", loadClients);
      hasLoaded.current = true;
    }
  }, [user, runWithLoading]);

  const saveClient = async () => {
    console.log(
      "saveClient called, user:",
      user ? user.uid : null,
      "name:",
      name,
      "country:",
      country,
    );

    if (!name || !country) {
      Alert.alert("تنبيه", "من فضلك أدخل الاسم والبلد");
      return;
    }

    if (!user) {
      Alert.alert("خطأ", "المستخدم غير مسجل حالياً");
      return;
    }

    try {
      if (editingId) {
        const clientRef = doc(db, "clients", editingId);
        await updateDoc(clientRef, { name, country, userId: user.uid });

        setClients((prev) =>
          prev.map((c) =>
            c.id === editingId ? { ...c, name, country, userId: user.uid } : c,
          ),
        );

        setEditingId(null);
        console.log("✅ updated client", editingId);
      } else {
        const docRef = await addDoc(collection(db, "clients"), {
          name,
          country,
          userId: user.uid,
        });

        const newClient: Client = {
          id: docRef.id,
          name,
          country,
          userId: user.uid,
        };

        setClients((prev) => [...prev, newClient]);
        console.log("✅ added client", newClient);
      }

      setName("");
      setCountry("");
    } catch (err) {
      console.error("❌ Error saving client", err);
      Alert.alert("خطأ", "حدث خطأ أثناء الحفظ");
    }
  };

  const deleteClient = async (id: string) => {
    Alert.alert("تأكيد", "هل أنت متأكد من حذف هذا العميل؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "نعم",
        style: "destructive",
        onPress: () => runWithLoading("جاري حذف العميل...", async () => {
          if (!user) {
            Alert.alert("خطأ", "المستخدم غير مسجل حالياً");
            return;
          }

          try {
            const clientRef = doc(db, "clients", id);
            const docSnap = await getDoc(clientRef);

            if (!docSnap.exists()) {
              Alert.alert("خطأ", "العميل غير موجود");
              return;
            }

            const data = docSnap.data() as any;

            if (data.userId !== user.uid) {
              Alert.alert("خطأ", "لا يمكنك حذف عميل لا يخصك");
              return;
            }

            await deleteDoc(clientRef);

            setClients((prev) => prev.filter((c) => c.id !== id));
            console.log("✅ deleted client", id);
          } catch (err) {
            console.error("❌ Error deleting client", err);
            Alert.alert("خطأ", "حدث خطأ أثناء حذف العميل");
          }
        }),
      },
    ]);
  };

  useEffect(() => {
    if (!search.trim()) {
      setFilteredClients(clients);
    } else {
      const lower = search.toLowerCase();
      setFilteredClients(
        clients.filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            c.country.toLowerCase().includes(lower),
        ),
      );
    }
  }, [search, clients]);

  const startEditing = (c: Client) => {
    setEditingId(c.id);
    setName(c.name);
    setCountry(c.country);
  };
  console.log(clients);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingVertical: 0, paddingHorizontal: 10 },
        ]}
      >
        {loading && <Text>جاري التحميل...</Text>}

        <Text style={styles.title}>📋 قائمة العملاء</Text>

        <View style={{ marginBottom: 5 }}>
          <TextInput
            style={styles.input}
            placeholder="اسم العميل"
            placeholderTextColor="#000"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="البلد"
            placeholderTextColor="#000"
            value={country}
            onChangeText={setCountry}
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: editingId ? "#ebbf24" : "#34699A" },
            ]}
            onPress={() => runWithLoading(editingId ? "جاري حفظ التعديلات..." : "جاري إضافة العميل...", saveClient)}
          >
            <Text style={styles.buttonText}>
              {editingId ? "💾 حفظ التعديلات" : "➕ إضافة عميل"}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="ابحث بالأسم او البلد ..."
            placeholderTextColor="#000"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={{ flex: 1 }}>
          {filteredClients.length === 0 ? (
            <Text style={styles.emptyText}>لا يوجد عملاء</Text>
          ) : (
            <FlatList
              ref={clientsListRef}
              data={filteredClients}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 0 }}
              scrollEventThrottle={16}
              onScroll={(event) => {
                savedHomeScrollOffset = event.nativeEvent.contentOffset.y;
              }}
                onContentSizeChange={() => {
                  if (pendingRestoreOffset.current != null) {
                    const offset = pendingRestoreOffset.current;
                    pendingRestoreOffset.current = null;
                    requestAnimationFrame(() => {
                      clientsListRef.current?.scrollToOffset({ offset, animated: false });
                    });
                  }
                }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.clientBox,
                    item.hasRemaining && { backgroundColor: "#FFF7CC" },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      // نحفظ الموضع قبل الانتقال حتى يعود المستخدم لنفس العميل في القائمة.
                      clientsListRef.current?.scrollToOffset({
                        offset: savedHomeScrollOffset,
                        animated: false,
                      });
                      router.push(
                        `/screens/ClientDetails?id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}&country=${encodeURIComponent(item.country)}&returnSearch=${encodeURIComponent(search)}`,
                      );
                    }}
                  >
                    <Text style={[styles.clientName, { textAlign: "left" }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.clientCountry, { textAlign: "left" }]}>
                      {item.country}
                    </Text>

                    {item.hasRemaining && (
                      <Text
                        style={{
                          color: "red",
                          fontWeight: "bold",
                          marginTop: 5,
                          fontSize: 16,
                        }}
                      >
                        {" "}
                        المتبقي: {item.remainingAmount} جنيه
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#ebbf24" },
                      ]}
                      onPress={() => startEditing(item)}
                    >
                      <Text style={styles.actionText}>✏️ تعديل</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#8C1007" },
                      ]}
                      onPress={() => deleteClient(item.id)}
                    >
                      <Text style={styles.actionText}>🗑 حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Home;
