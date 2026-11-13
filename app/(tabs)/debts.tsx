import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { styles } from "../../style/styles";
import { db } from "../firebase/firebase";
import { scheduleDebtReminder } from "../services/debtNotifications";

type Debtor = {
  id: string;
  name: string;
  country: string;
  remainingAmount: number;
};

type CountryGroup = {
  country: string;
  debtors: Debtor[];
  total: number;
};

let savedDebtsScrollOffset = 0;

export default function Debts() {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<CountryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const listRef = useRef<FlatList<CountryGroup>>(null);

  const loadDebts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const snapshot = await getDocs(
        query(collection(db, "clients"), where("userId", "==", user.uid)),
      );
      const debtors = snapshot.docs
        .map((client) => ({ id: client.id, ...client.data() }) as Debtor)
        .filter((client) => Number(client.remainingAmount || 0) > 0)
        .sort((a, b) => a.name.localeCompare(b.name, "ar"));

      const grouped = debtors.reduce<Record<string, CountryGroup>>((result, debtor) => {
        const country = debtor.country?.trim() || "غير محدد";
        if (!result[country]) result[country] = { country, debtors: [], total: 0 };
        result[country].debtors.push(debtor);
        result[country].total += Number(debtor.remainingAmount);
        return result;
      }, {});

      setGroups(Object.values(grouped).sort((a, b) => a.country.localeCompare(b.country, "ar")));
      await scheduleDebtReminder(debtors);
    } catch (error) {
      console.error("Error loading debts", error);
    } finally {
      setLoading(false);
    }
  }, [user]);


  const filteredGroups = useMemo(() => {
    const searchText = search.trim().toLocaleLowerCase("ar");
    if (!searchText) return groups;

    return groups
      .map((group) => {
        const countryMatches = group.country.toLocaleLowerCase("ar").includes(searchText);
        const debtors = countryMatches
          ? group.debtors
          : group.debtors.filter((debtor) =>
              debtor.name.toLocaleLowerCase("ar").includes(searchText),
            );

        return {
          ...group,
          debtors,
          total: debtors.reduce((sum, debtor) => sum + Number(debtor.remainingAmount), 0),
        };
      })
      .filter((group) => group.debtors.length > 0);
  }, [groups, search]);

  const totalDebt = filteredGroups.reduce((sum, group) => sum + group.total, 0);

  const pendingRestoreOffset = useRef<number | null>(null);

  // useFocusEffect(
  //   useCallback(() => {
  //     loadDebts();
  //     if (savedDebtsScrollOffset > 0) {
  //       pendingRestoreOffset.current = savedDebtsScrollOffset;
  //     }
  //   }, [loadDebts]),
  // );
  useFocusEffect(
    useCallback(() => {
      loadDebts();
      if (savedDebtsScrollOffset > 0) {
        pendingRestoreOffset.current = savedDebtsScrollOffset;
      }
    }, [loadDebts]),
  );
  return (
    <View style={[styles.container, { paddingHorizontal: 10, paddingTop: 16 }]}>
      <Text style={styles.title}>المديونيات</Text>
      <Text style={{ textAlign: "right", marginBottom: 14, color: "#8C1007", fontWeight: "bold" }}>
        إجمالي المستحق: {totalDebt} جنيه
      </Text>
      <TextInput
        style={[styles.input, { marginBottom: 12 }]}
        placeholder="ابحث بالاسم أو البلد..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
        textAlign="right"
      />

      {loading ? <ActivityIndicator size="large" color="#34699A" /> : (
        <FlatList
          ref={listRef}
          data={filteredGroups}
          keyExtractor={(item) => item.country}
          onScroll={(event) => {
            savedDebtsScrollOffset = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          onContentSizeChange={() => {
            if (pendingRestoreOffset.current != null) {
              const offset = pendingRestoreOffset.current;
              pendingRestoreOffset.current = null;
              requestAnimationFrame(() => {
                listRef.current?.scrollToOffset({ offset, animated: false });
              });
            }
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {search ? "لا توجد نتائج مطابقة" : "لا توجد مديونيات حالياً"}
            </Text>
          }
          renderItem={({ item: group }) => (
            <View style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: "#34699A", padding: 11, borderRadius: 8 }}>
                <Text style={{ color: "white", fontWeight: "bold", textAlign: "right", fontSize: 17 }}>
                  {group.country} — {group.total} جنيه
                </Text>
              </View>
              {group.debtors.map((debtor) => (
                <TouchableOpacity
                  key={debtor.id}
                  style={[styles.clientBox, { backgroundColor: "#FFF7CC", marginTop: 7 }]}
                  onPress={() => router.push(`/screens/ClientDetails?id=${encodeURIComponent(debtor.id)}&name=${encodeURIComponent(debtor.name)}&country=${encodeURIComponent(debtor.country)}&from=debts`)}
                >
                  <Text style={[styles.clientName, { textAlign: "right" }]}>{debtor.name}</Text>
                  <Text style={{ color: "#8C1007", fontWeight: "bold", textAlign: "right", marginTop: 4 }}>
                    المتبقي: {debtor.remainingAmount} جنيه
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}
