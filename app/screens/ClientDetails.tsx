import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { styles } from "../../css/styles";
import { db } from "../firebase/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRef } from "react";
import { Button, ScrollView, StatusBar } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useAuth } from "../../context/AuthContext";

type Band = {
  id: string;
  name: string;
  price: number;
  type?: "كرتونة" | "كيلو" | "عدد";
};
type InvoiceItem = Band & { qty: number };
type PaymentMethod = "نقدا" |
  "بنك"
  | "بريد"
  | "فودافون كاش"
  | "أورانج كاش"
  ;



type Invoice = {
  id: string;
  date: string;
  items: InvoiceItem[];
  createdAt: number;
  total: number;
  payments: {
    id: string;
    method: PaymentMethod;
    amount: number;
    date: string;
  }[];
  remaining: number;
  note?: string
};

export default function ClientDetails() {
  const { name, country } = useLocalSearchParams<{ name: string; country: string }>();


  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const clientId = params.id as string;

  const [activeTab, setActiveTab] = useState<"bands" | "invoices">("bands");

  //Bands
  const [bands, setBands] = useState<Band[]>([]);
  const [newBandName, setNewBandName] = useState("");
  const [newBandPrice, setNewBandPrice] = useState("");
  const [newBandType, setNewBandType] = useState<Band["type"]>();
  const [searchTerm, setSearchTerm] = useState("");

  // Edit band
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBandData, setEditBandData] = useState<Band | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editType, setEditType] = useState<Band["type"]>();

  // Invoices
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<
    InvoiceItem[]
  >([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editSelectedInvoice, setEditSelectedInvoice] = useState(false);
  const [editSelectedInvoiceItem, setEditSelectedInvoiceItem] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const invoiceRef = useRef<View>(null);
  const invoiceCaptureRef = useRef<View>(null);
  const { user } = useAuth(); 

  const [initialPayment, setInitialPayment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("نقدا" as PaymentMethod);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  // Load bands 
  useEffect(() => {
    if (!clientId || !user) return;

    const fetchBands = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "clients", clientId, "items")
        );

        const fetchedBands = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Band, "id">),
        }));

        setBands(fetchedBands);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };

    fetchBands();
  }, [clientId, user]);

  // Function to change arabic numbers to english (in price of band)
  function arabicToEnglishNumbers(str: string) {
    return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  }

  // Load last 15 invoices 
  useEffect(() => {
    if (!clientId || !user) return;

    const fetchInvoices = async () => {
      try {


        const snapshot = await getDocs(
          collection(db, "clients", clientId, "invoices")
        );

        const fetchedInvoices = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setInvoices(fetchedInvoices);

      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };

    fetchInvoices();
  }, [clientId, user]);

  // add band 
  const addBand = async () => {
    if (!newBandName || !newBandPrice || !clientId) return;
    const newBand = {
      name: newBandName,
      price: parseFloat(arabicToEnglishNumbers(newBandPrice)),
      type: newBandType,
    };
    if (newBand.type === undefined) {
      delete newBand.type;
    }
    const docRef = await addDoc(
      collection(db, "clients", clientId, "items"),
      newBand
    );
    setBands([...bands, { id: docRef.id, ...newBand }]);
    setNewBandName("");
    setNewBandPrice("");
  };

  // edit band
  const saveEditedBand = async () => {
    if (!clientId || !editBandData) return;
    const updated = {
      name: editName,
      price: parseFloat(arabicToEnglishNumbers(editPrice)),
      type: editType,
    };

    if (updated.type === undefined) {
      delete updated.type;
    }
    await updateDoc(
      doc(db, "clients", clientId, "items", editBandData.id),
      updated
    );
    setBands((prev) =>
      prev.map((b) => (b.id === editBandData.id ? { ...b, ...updated } : b))
    );
    setEditModalVisible(false);
  };

  //  delete band
  const deleteBand = async (id: string) => {
    if (!clientId) return;
    await deleteDoc(doc(db, "clients", clientId, "items", id));
    setBands((prev) => prev.filter((b) => b.id !== id));
    Alert.alert("تم الحذف", "تم حذف البند بنجاح ✅");
  };
  // calc total of all bands of an invoice
  const calculateTotal = (items: InvoiceItem[]) =>
    items.reduce((sum, item) => sum + item.price * item.qty, 0);
  // calc total of payments of an invoice
  const getPaidAmount = (invoice: Invoice) =>
    (invoice.payments || []).reduce((sum, p) => sum + p.amount, 0);



  // create new invoice
  const createInvoice = async () => {
    try {
      if (!clientId || selectedInvoiceItems.length === 0) return;    
      const total = calculateTotal(selectedInvoiceItems);
      const paid = parseFloat(initialPayment) || 0;
      const payments =
        paid > 0
          ? [
            {
              id: Date.now().toString(),
              method: paymentMethod,   
              amount: paid,
              date: paymentDate.toISOString(), 
            },
          ]
          : [];

      const newInvoice = {
        date: new Date().toLocaleDateString(), 
        items: selectedInvoiceItems,
        createdAt: Date.now(),
        total,
        payments,
        remaining: total - paid, 
      };

      const docRef = await addDoc(
        collection(db, "clients", clientId, "invoices"),
        newInvoice
      );

      setInvoices((prev) => [{ id: docRef.id, ...newInvoice }, ...prev]);


      setSelectedInvoiceItems([]);
      setInitialPayment("");
      setPaymentMethod("بنك");
      setPaymentDate(new Date());
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

// change date of payment 
  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false); 
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };


  // delete invoice
  const deleteInvoice = async (id: string) => {
    if (!clientId) return;
    await deleteDoc(doc(db, "clients", clientId, "invoices", id));
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  // function of downloading invoice as PDF
  const generatePDF = async (invoice: Invoice) => {
    const total = invoice.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const paid = (invoice.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const remaining = total - paid;

    const paymentsHTML =
      invoice.payments && invoice.payments.length > 0
        ? `
        ${invoice.note ? `
  <div style="margin-top:20px; border:1px dashed black; padding:10px;">
    <h3 style="margin:0; text-align:center;">ملاحظات</h3>
    <p style="margin:5px 0; text-align:right;">${invoice.note}</p>
  </div>
` : ""}
      <h2 style="margin-top:5px; text-align:center;">الدفعات</h2>
      <table>
        <thead>
          <tr>
            <th>الطريقة</th>
            <th>المبلغ</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.payments
          .map(
            (p) => `
              <tr>
                <td>${p.method}</td>
                <td>${p.amount}</td>
                <td>${new Date(p.date).toISOString().split("T")[0]}</td>
              </tr>
            `
          )
          .join("")}
        </tbody>
      </table>
    `
        : `<p style="margin-top:20px; text-align:center; font-weight:bold;">لا يوجد دفعات</p>`;

    const html = `
  <html dir="rtl">
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          text-align: right;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          text-align: center;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid black;
          padding: 7px;
        }
        table {
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        thead {
          display: table-header-group;
        }
        tfoot {
          display: table-footer-group;
        }
      </style>
    </head>
    <body>
      <h1 style="text-align:center;">فاتورة شراء</h1>
      <p><strong>اسم العميل:</strong> ${name}</p>
      <p><strong>البلد:</strong> ${country}</p>
      <p><strong>التاريخ:</strong> ${invoice.date}</p>

      <!-- جدول الأصناف -->
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>النوع</th>
            <th>السعر</th>
            <th>الكمية</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items
        .map(
          (i) => `
              <tr>
                <td style="text-align:right;">${i.name}</td>
                <td>${i.type}</td>
                <td>${i.price}</td>
                <td>${i.qty}</td>
                <td>${(i.price * i.qty).toFixed(2)}</td>
              </tr>
            `
        )
        .join("")}
        </tbody>
      </table>

      <!-- جدول الدفعات -->
      ${paymentsHTML}

      <div style="margin-top:20px; border:1px solid black; padding:10px;">
        <p><strong>الإجمالي الكلي:</strong> ${total.toFixed(2)} جنيه</p>
        <p><strong>إجمالي المدفوع:</strong> ${paid.toFixed(2)} جنيه</p>
        <p><strong>المتبقي:</strong> ${remaining.toFixed(2)} جنيه</p>
      </div>
    </body>
  </html>
  `;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };





  // function of downloading invoice as an image
  const generateFullInvoiceImage = async (invoice: Invoice) => {
    if (!invoiceCaptureRef.current) return;

    try {
      const uri = await captureRef(invoiceCaptureRef, {
        format: "png",
        quality: 1,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("خطأ", "المشاركة غير متاحة على هذا الجهاز");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("خطأ", "حدث خطأ أثناء إنشاء صورة الفاتورة");
    }
  };

// add payment to invoice
  const addPaymentToInvoice = async (
    clientId: string,
    invoiceId: string,
    method: PaymentMethod,
    amount: number | string
  ) => {
    try {
      if (!clientId || !invoiceId) {
        Alert.alert("خطأ", "معرّف العميل أو الفاتورة غير موجود");
        return;
      }

      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert("خطأ", "أدخل مبلغ صالح للدفعة");
        return;
      }

      const invoiceRef = doc(db, "clients", clientId, "invoices", invoiceId);
      const snap = await getDoc(invoiceRef);

      if (!snap.exists()) {
        Alert.alert("خطأ", "الفاتورة غير موجودة");
        return;
      }

      const data = snap.data();
      const total = data.total || 0;

      const currentRemaining = data.remaining !== undefined ? data.remaining : total;

      if (parsedAmount > currentRemaining) {
        Alert.alert("خطأ", "المبلغ أكبر من المتبقي");
        return;
      }

      const newPayment = {
        id: Date.now().toString(),
        method,
        amount: parsedAmount,
        date: new Date().toISOString(),
      };

      const oldPayments = (data.payments || []) as any[];
      const updatedPayments = [...oldPayments, newPayment];

      const updatedRemaining = currentRemaining - parsedAmount;

      await updateDoc(invoiceRef, {
        payments: updatedPayments,
        remaining: updatedRemaining,
      });

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, payments: updatedPayments, remaining: updatedRemaining }
            : inv
        )
      );
      setPaymentModal(false)
      setSelectedInvoice(null)
      Alert.alert("تم", "تمت إضافة الدفعة بنجاح ✅");
    } catch (error) {
      console.error("خطأ أثناء إضافة الدفعة:", error);
      Alert.alert("خطأ", "تعذر إضافة الدفعة");
    }
  };


// edit invoice 
  const saveInvoiceChanges = async () => {
    if (!clientId || !editSelectedInvoiceItem) return;

    const newTotal = selectedInvoiceItems.reduce(
      (acc, item) => acc + (item.price * item.qty),
      0
    );

    const oldTotal = editSelectedInvoiceItem.total || 0;
    const oldRemaining = editSelectedInvoiceItem.remaining || 0;

    const diff = newTotal - oldTotal;

    const updatedRemaining = oldRemaining + diff;

    const payments = editSelectedInvoiceItem.payments || [];
    const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const remaining = Math.max(updatedRemaining, newTotal - paid);

    const updatedInvoice = {
      ...editSelectedInvoiceItem,
      items: selectedInvoiceItems,
      total: newTotal,
      remaining,
    };

    await updateDoc(
      doc(db, "clients", clientId, "invoices", editSelectedInvoiceItem.id),
      updatedInvoice
    );

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === editSelectedInvoiceItem.id ? updatedInvoice : inv
      )
    );

    setEditSelectedInvoiceItem(null);
    setSelectedInvoiceItems([]);
    setEditSelectedInvoice(false);
  };

  // function to transfer Remaining of any invoice To LastInvoice
  const transferRemainingToLastInvoice = async (
    clientId: string,
    sourceInvoiceId: string,
    lastInvoiceId: string,

  ) => {
    try {
      if (sourceInvoiceId === lastInvoiceId) {
        Alert.alert("خطأ", "لا يمكن ترحيل المتبقي لنفس الفاتورة");
        return;
      }

      const sourceRef = doc(db, "clients", clientId, "invoices", sourceInvoiceId);
      const lastRef = doc(db, "clients", clientId, "invoices", lastInvoiceId);

      const sourceSnap = await getDoc(sourceRef);
      const lastSnap = await getDoc(lastRef);

      if (!sourceSnap.exists() || !lastSnap.exists()) {
        Alert.alert("خطأ", "فاتورة غير موجودة");
        return;
      }

      const sourceData = sourceSnap.data();
      const lastData = lastSnap.data();

      const sourceRemaining = sourceData.remaining || 0;
      const lastRemaining = lastData.remaining || 0;

      if (sourceRemaining <= 0) {
        Alert.alert("تنبيه", "الفاتورة القديمة ليس بها متبقي للترحيل");
        return;
      }

      const updatedLastRemaining = lastRemaining + sourceRemaining;

      await updateDoc(lastRef, {
        remaining: updatedLastRemaining,
        note: `مجموع فاتوره ${invoiceNumber} : ${sourceRemaining} جنيه`,
      });

      await updateDoc(sourceRef, {
        remaining: 0,
      });


      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === lastInvoiceId) {
            return { ...inv, remaining: updatedLastRemaining, note: `مجموع فاتوره ${invoiceNumber} : ${sourceRemaining} جنيه` };
          }
          if (inv.id === sourceInvoiceId) {
            return { ...inv, remaining: 0 };
          }
          return inv;
        })
      );

      setSelectedInvoice(null)
      setVisible(false)
      setInvoiceNumber("")
      Alert.alert("تم", "تم ترحيل المتبقي للفاتورة الأخيرة ✅");
    } catch (err) {
      console.error("خطأ أثناء الترحيل:", err);
      Alert.alert("خطأ", "تعذر الترحيل");
    }
  };

  console.log('====================================');
  console.log(selectedInvoice);
  console.log('====================================');

  return (
    <View style={styles.container} >

      {
        selectedInvoice && (
          <View
            ref={invoiceCaptureRef}
            collapsable={false}
            style={{
              position: "absolute",
              left: -1000, 
              top: 0,
              width: 800, 
              padding: 10,
              backgroundColor: "white",
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 24, textAlign: "center", marginBottom: 10 }}>
              فاتورة شراء
            </Text>
            <Text style={{ fontWeight: "bold", fontSize: 18, textAlign: "right" }}>اسم العميل: <Text style={{ fontWeight: "400" }}>{name}</Text></Text>
            <Text style={{ fontWeight: "bold", fontSize: 18, textAlign: "right" }}>البلد: <Text style={{ fontWeight: "400" }}>{country}</Text></Text>
            <Text style={{ fontWeight: "bold", fontSize: 18, textAlign: "right" }}>التاريخ: <Text style={{ fontWeight: "400" }}>{selectedInvoice.date}</Text></Text>

            <View style={{ borderWidth: 1, marginTop: 10 }}>
              <View style={{ flexDirection: "row", borderBottomWidth: 1 }}>
                <Text style={{ flex: 2, textAlign: "right", fontWeight: "800", padding: 10, borderLeftWidth: 1 }}>الصنف</Text>
                <Text style={{ flex: 1, textAlign: "center", padding: 10, borderLeftWidth: 1 }}>النوع</Text>
                <Text style={{ flex: 1, textAlign: "center", padding: 10, borderLeftWidth: 1 }}>العدد</Text>
                <Text style={{ flex: 1, textAlign: "center", padding: 10, borderLeftWidth: 1 }}>السعر</Text>
                <Text style={{ flex: 1, textAlign: "center", padding: 10 }}>الإجمالي</Text>
              </View>

              {selectedInvoice.items.map((band) => (
                <View key={band.id} style={{ flexDirection: "row", borderBottomWidth: 1 }}>
                  <Text style={{ flex: 2, textAlign: "right", fontWeight: "800", padding: 10, borderLeftWidth: 1 }}>{band.name}</Text>
                  <Text style={{ flex: 1, textAlign: "center", padding: 10, borderLeftWidth: 1 }}>{band.type}</Text>
                  <Text style={{ flex: 1, textAlign: "center", padding: 10, borderLeftWidth: 1 }}>{band.qty}</Text>
                  <Text style={{ flex: 1, textAlign: "center", padding: 10, borderLeftWidth: 1 }}>{band.price}</Text>
                  <Text style={{ flex: 1, textAlign: "center", padding: 10 }}>{(band.qty * band.price).toFixed(2)}</Text>
                </View>
              ))}

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 5 }}>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>الإجمالي الكلي:</Text>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {selectedInvoice.total} جنيه
                </Text>
              </View>
              {selectedInvoice.note ? (<Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {selectedInvoice.note} جنيه
              </Text>):("")}
             
              {selectedInvoice.payments?.map((item) => (<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 5 }}>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>دفعة{item.method}:</Text>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {item.amount} جنيه
                </Text>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  بتاريخ: {new Date(item.date).toISOString().split("T")[0]}
                </Text>


              </View>))}

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 5 }}>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>المتبقي:</Text>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {selectedInvoice.remaining} جنيه
                </Text>
              </View>

            </View>
          </View>
        )
      }


      < View >
        <TouchableOpacity
          style={[styles.button, { flexDirection: "row", paddingVertical: 10, marginBottom: 0 }]}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-forward"
            size={30}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.buttonText]}>الرجوع</Text>
        </TouchableOpacity>
        {/* Tabs */}
        < View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginVertical: 5,
            gap: 20,
          }}
        >
          <TouchableOpacity onPress={() => setActiveTab("bands")}>
            <Text style={activeTab === "bands" ? styles.activeTab : styles.tab}>
              الأصناف
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab("invoices")}>
            <Text
              style={activeTab === "invoices" ? styles.activeTab : styles.tab}
            >
              الفواتير
            </Text>
          </TouchableOpacity>
        </View >
      </View >
      {/* Tab Bands */}
      {
        activeTab === "bands" && (
          <View>
            <TextInput
              placeholder="اسم الصنف" placeholderTextColor={"#000"}

              value={newBandName}
              onChangeText={setNewBandName}
              style={styles.input}
            />
            <TextInput
              placeholder="السعر لكل وحدة" placeholderTextColor={"#000"}

              value={newBandPrice}
              onChangeText={setNewBandPrice}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 7 }}>
              {(["عدد", "كرتونة", "كيلو"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewBandType(t)}
                  style={[
                    styles.typeBtn,
                    newBandType === t && { backgroundColor: "#34699A" },
                  ]}
                >
                  <Text style={{ color: newBandType === t ? "white" : "black" }}>
                    {t}
                  </Text>
                </TouchableOpacity>

              ))}
              <TouchableOpacity style={[styles.button,{paddingHorizontal:40}]} onPress={addBand}>
                <Text style={styles.buttonText}>إضافة صنف</Text>
              </TouchableOpacity>
            </View>

            

            <TextInput
              placeholder="ابحث عن بند..."
              placeholderTextColor={"#000"}
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={[styles.input, { marginVertical: 0 }]}
            />
          </View>
        )
      }

      {
        activeTab === "bands" && (
          <View style={{ flex: 1 }}>
            <FlatList
              data={bands.filter((b) =>
                b.name.toLowerCase().includes(searchTerm.toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item: band }) => {
                const existing = selectedInvoiceItems.find(
                  (i) => i.id === band.id
                );
                const qty = existing?.qty ?? 0;

                return (
                  <View
                    style={{ flexDirection: "column", marginBottom: 10, borderWidth: 1, paddingBottom: 10, borderRadius: 10 }}
                    key={band.id}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        borderBottomWidth: 1,
                        borderColor: "#475569",
                      }}
                    >
                      <Text
                        style={{
                          flex: 2,
                          color: "#000",
                          fontWeight: "800",
                          textAlign: "left", paddingLeft: 3,
                          paddingVertical: 10
                        }}
                      >
                        {band.name}
                      </Text>
                      <Text
                        style={{
                          flex: 1, color: "#000", textAlign: "center", borderLeftWidth: 1
                          , textAlignVertical: "center",
                          paddingVertical: 10
                        }}
                      >
                        {band.type}
                      </Text>
                      <Text
                        style={{
                          flex: 1, color: "#000", textAlign: "center", textAlignVertical: "center"
                          , paddingVertical: 10, borderLeftWidth: 1

                        }}
                      >
                        {band.price} جنيه
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row-reverse",
                        gap: 5,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          {
                            backgroundColor: "#34699A",
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            marginVertical: 5,
                            borderRadius: 4,
                            flexDirection: "row",
                          },
                        ]}
                        onPress={() => {
                          if (!existing) return;
                          const updated = selectedInvoiceItems
                            .map((i) =>
                              i.id === band.id ? { ...i, qty: i.qty - 1 } : i
                            )
                            .filter(i => i.qty > 0); 
                          setSelectedInvoiceItems(updated);
                        }}

                      >
                        <Text
                          style={[
                            styles.buttonText,
                            { padding: 0, fontSize: 20 },
                          ]}
                        >
                          إزاله
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.qtyInput}
                        value={qty.toString()}
                        keyboardType="numeric"
                        onChangeText={(v) => {
                          const n = Math.max(0, parseInt(arabicToEnglishNumbers(v)) || 0);
                          if (existing) {
                            const updated = selectedInvoiceItems
                              .map((i) =>
                                i.id === band.id ? { ...i, qty: n } : i
                              )
                              .filter(i => i.qty > 0); 
                            setSelectedInvoiceItems(updated);
                          } else if (n > 0) {
                            setSelectedInvoiceItems([
                              ...selectedInvoiceItems,
                              { ...band, qty: n },
                            ]);
                          }
                        }}

                      />
                      <TouchableOpacity
                        style={[
                          {
                            backgroundColor: "#34699A",
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            marginVertical: 5,
                            borderRadius: 4,
                            flexDirection: "row",
                          },
                        ]}
                        onPress={() => {
                          if (existing) {
                            const updated = selectedInvoiceItems.map((i) =>
                              i.id === band.id ? { ...i, qty: i.qty + 1 } : i
                            );
                            setSelectedInvoiceItems(updated);
                          } else {
                            setSelectedInvoiceItems([
                              ...selectedInvoiceItems,
                              { ...band, qty: 1 },
                            ]);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.buttonText,
                            { padding: 0, fontSize: 20 },
                          ]}
                        >
                          إضافة
                        </Text>
                      </TouchableOpacity>
                    </View>


                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: "#8C1007" }, 
                        ]}
                        onPress={() => {
                          Alert.alert(
                            "تأكيد الحذف",
                            "هل أنت متأكد من حذف هذا البند؟",
                            [
                              { text: "إلغاء", style: "cancel" },
                              {
                                text: "حذف",
                                style: "destructive",
                                onPress: () => deleteBand(band.id),
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.actionText}>🗑 حذف</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: "#ebbf24" }, 
                        ]}
                        onPress={() => {
                          setEditBandData(band);
                          setEditName(band.name);
                          setEditPrice(band.price.toString());
                          setEditType(band.type);
                          setEditModalVisible(true);
                        }}
                      >
                        <Text style={styles.actionText}>✏️ تعديل</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )
      }

      {/* Tab Invoices */}
      {
        activeTab === "invoices" && (
          <View style={{ flex: 1, padding: 0, width: 300, position: "relative", left: -14 }}>
            <View>
              <Text style={{ fontWeight: "bold", marginVertical: 10, textAlign: "left" }}>
                اختيار البنود للفاتورة:
              </Text>

              {selectedInvoiceItems.length > 0 ?

                (<View>

                  <View style={{ borderWidth: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        borderBottomWidth: 1,
                        borderColor: "#475569",
                      }}
                    >
                      <Text
                        style={{
                          flex: 1.5,
                          color: "#000",
                          fontWeight: "800",
                          textAlign: "right", paddingRight: 7
                          , paddingVertical: 10
                        }}
                      >
                        الصنف
                      </Text>
                      <Text
                        style={{
                          flex: 1, color: "#000", textAlign: "center", borderLeftWidth: 1
                          , textAlignVertical: "center",
                          paddingVertical: 10
                        }}
                      >
                        النوع
                      </Text>
                      <Text
                        style={{
                          flex: 1, color: "#000", textAlign: "center", borderLeftWidth: 1
                          , textAlignVertical: "center",
                          paddingVertical: 10
                        }}
                      >
                        العدد
                      </Text>
                      <Text
                        style={{
                          flex: 1, color: "#000", textAlign: "center", borderLeftWidth: 1
                          , textAlignVertical: "center",
                          paddingVertical: 10
                        }}
                      >
                        السعر
                      </Text>
                      <Text
                        style={{
                          flex: 1, color: "#000", textAlign: "center", textAlignVertical: "center"
                          , paddingVertical: 10, width: 300, borderLeftWidth: 1
                        }}
                      >
                        الإجمالي
                      </Text>
                    </View>
                    <ScrollView style={{ maxHeight: 300 }}>
                      {selectedInvoiceItems.filter(band => band.qty !== 0).map((band) => (
                        <View
                          style={{
                            flexDirection: "row",
                            borderBottomWidth: 1,
                            borderColor: "#475569",
                          }}
                          key={band.id}
                        >
                          <Text
                            style={{
                              flex: 1.5,
                              color: "#000",
                              fontWeight: "800",
                              textAlign: "right",
                              paddingRight: 10,
                              paddingVertical: 10
                            }}
                          >
                            {band.name}
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              color: "#000",
                              textAlign: "center",
                              borderLeftWidth: 1,
                              textAlignVertical: "center",
                              paddingVertical: 10
                            }}
                          >
                            {band.type}
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              color: "#000",
                              textAlign: "center",
                              borderLeftWidth: 1,
                              textAlignVertical: "center",
                              paddingVertical: 10
                            }}
                          >
                            {band.qty}
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              color: "#000",
                              textAlign: "center",
                              borderLeftWidth: 1,
                              textAlignVertical: "center",
                              paddingVertical: 10
                            }}
                          >
                            {band.price}
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              color: "#000",
                              textAlign: "center",
                              textAlignVertical: "center",
                              paddingVertical: 10, borderLeftWidth: 1,

                            }}
                          >
                            {(band.qty * band.price).toFixed(2)}
                          </Text>



                        </View>
                      ))}
                    </ScrollView>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 3 }}>
                      <Text style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        marginVertical: 5,
                        marginRight: 0,
                        textAlign: "center"
                      }}>الإجمالي الكلي:
                      </Text>
                      <Text style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        textAlign: "left",
                        marginVertical: 5
                      }}>
                        {selectedInvoiceItems.reduce((sum, b) => sum + b.qty * b.price, 0).toFixed(2)} جنيه
                      </Text>
                    </View>





                  </View>


                  <TouchableOpacity
                    style={[styles.button, { marginVertical: 5 }]}
                    onPress={editSelectedInvoice ? saveInvoiceChanges : createInvoice}
                  >
                    <Text style={styles.buttonText}>{editSelectedInvoice ? "حفظ التعديلات" : "إنشاء فاتورة جديدة"}</Text>
                  </TouchableOpacity></View>) : (<Text>لم يتم اختيار الأصناف بعد</Text>)
              }


            </View>

        
            <FlatList
              style={{ flex: 1 }}
              data={[...invoices].sort((a, b) => {
                const dateA = a.createdAt || 0; 
                const dateB = b.createdAt || 0;
                return dateB - dateA; 
              })}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.clientBox}
                  onPress={() => setSelectedInvoice(item)}
                >
                  <Text style={{ fontWeight: "bold", textAlign: "center" }}>
                    🧾 تاريخ الفاتورة: {item.date || "—"}
                  </Text>
                </TouchableOpacity>
              )}
            />


          </View>
        )
      }

      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { flex: 1, width: "100%", backgroundColor: "white", paddingTop: 120 }]}>
            <Text
              style={{
                fontWeight: 900,
                textAlign: "center",
                fontSize: 30,
                marginBottom: 5,
              }}
            >
              تعديل الصنف
            </Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.input}
              placeholder="اسم الصنف"
            />
            <TextInput
              value={editPrice}
              onChangeText={setEditPrice}
              style={styles.input}
              keyboardType="numeric"
              placeholder="السعر"
            />
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              {(["عدد", "كرتونة", "كيلو"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setEditType(t)}
                  style={[
                    styles.typeBtn,
                    editType === t && { backgroundColor: "#34699A" },
                  ]}
                >
                  <Text style={{ color: editType === t ? "white" : "black" }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.button]} onPress={saveEditedBand}>
              <Text style={styles.buttonText}>حفظ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.buttonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedInvoice} transparent={false} animationType="slide" onRequestClose={() => setSelectedInvoice(null)}
      >

        <StatusBar hidden />


        <View style={[styles.modalOverlay, {
          flex: 1,
          backgroundColor: "white"
        }]}>
          <View
            style={[styles.modalBox, { flex: 1, width: "100%", backgroundColor: "white", paddingTop: 20 }]}>

            {selectedInvoice && (
              <View style={[{ flex: 1, width: "100%", backgroundColor: "white", }]}>

                <View style={[styles.actions, { margin: 0 }]}>
                  <TouchableOpacity
                    style={[styles.button, { margin: 0 }]}
                    onPress={() => generateFullInvoiceImage(selectedInvoice!)}
                  >
                    <Text style={styles.buttonText}>تحميل صوره</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, { margin: 0 }]}
                    onPress={() => generatePDF(selectedInvoice)}
                  >
                    <Text style={styles.buttonText}>تحميل PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { paddingHorizontal: 40 }]}
                    onPress={() => { setSelectedInvoice(null) }}
                  >
                    <Text style={styles.buttonText}>إغلاق</Text>
                  </TouchableOpacity>
                </View>

                <View
                  ref={invoiceRef}
                  collapsable={false}
                  style={{
                    padding: 0, margin: 0
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 20, textAlign: "center", margin: 0, padding: 0 }}>
                    فاتورة شراء
                  </Text>

                  <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "right", margin: 0, padding: 0 }}>
                    اسم العميل:
                    <Text style={{ fontWeight: "400" }}>{name}</Text>
                  </Text>

                  <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "right", margin: 0, padding: 0 }}>
                    البلد:
                    <Text style={{ fontWeight: "400" }}>{country}</Text>
                  </Text>

                  <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "right", margin: 0, padding: 0 }}>
                    التاريخ:
                    <Text style={{ fontWeight: "400" }}>{selectedInvoice.date}</Text>
                  </Text>

                  <View style={{ borderWidth: 1, marginTop: 0 }}>
                    <View style={{ flexDirection: "row", borderBottomWidth: 1 }}>
                      <Text style={{ flex: 1.5, textAlign: "right", fontWeight: "800", padding: 5 }}>
                        الصنف
                      </Text>
                      <Text style={{ flex: 1, textAlign: "center", padding: 5, borderLeftWidth: 1 }}>النوع</Text>
                      <Text style={{ flex: 1, textAlign: "center", padding: 5, borderLeftWidth: 1 }}>العدد</Text>
                      <Text style={{ flex: 1, textAlign: "center", padding: 5, borderLeftWidth: 1 }}>السعر</Text>
                      <Text style={{ flex: 1, textAlign: "center", paddingHorizontal: 2, paddingVertical: 3, fontSize: 13, borderLeftWidth: 1 }}>الإجمالي</Text>
                    </View>

                    <ScrollView style={{ maxHeight: 190 }}>
                      {selectedInvoice.items.map((band) => (
                        <View key={band.id} style={{ flexDirection: "row", borderBottomWidth: 1 }}>
                          <Text style={{ flex: 1.5, textAlign: "right", fontWeight: "800", padding: 5 }}>
                            {band.name}
                          </Text>
                          <Text style={{ flex: 1, textAlign: "center", padding: 5, borderLeftWidth: 1 }}>
                            {band.type}
                          </Text>
                          <Text style={{ flex: 1, textAlign: "center", padding: 5, borderLeftWidth: 1 }}>
                            {band.qty}
                          </Text>
                          <Text style={{ flex: 1, textAlign: "center", padding: 5, borderLeftWidth: 1 }}>
                            {band.price}
                          </Text>
                          <Text style={{ flex: 1, textAlign: "center", padding: 2, fontSize: 20, borderLeftWidth: 1 }}>
                            {(band.qty * band.price).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 0,
                        paddingHorizontal: 0,
                      }}
                    >
                      <Text style={{ fontWeight: "bold", fontSize: 16 }}>الإجمالي الكلي:</Text>
                      <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                        {selectedInvoice.total}جنيه
                      </Text>
                    </View>
                    {selectedInvoice.note ? (<Text style={{ fontWeight: "bold", fontSize: 16 }}>
                      {selectedInvoice.note} جنيه
                    </Text>) : ("")}
                    <ScrollView style={{ maxHeight: 80 }}>
                      {selectedInvoice.payments?.map((item) => (
                        <View
                          key={item.id}
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: 0,
                            paddingHorizontal: 5,
                          }}
                        >
                          <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                            دفعة {item.method}:
                            |</Text>
                          <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                            {item.amount} جنيه
                            |</Text>
                          <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                            بتاريخ: {new Date(item.date).toISOString().split("T")[0]}
                          </Text>
                        </View>
                      ))}

                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 0, paddingHorizontal: 5 }}>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>المتبقي:</Text>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                          {selectedInvoice.remaining} جنيه
                        </Text>
                      </View>

                    </ScrollView>

                  </View>

                </View>

                <View style={[styles.actions, { marginTop: 1, alignItems: "center", justifyContent: "center" }]}>
                  <TouchableOpacity
                    style={[styles.button, { marginVertical: 5 }]}
                    onPress={() => { setPaymentModal(true), setInvoiceId(selectedInvoice.id) }}
                  >
                    <Text style={styles.buttonText}>إضافة دفعه</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { paddingHorizontal: 12, backgroundColor: "#34699A" }]}
                    onPress={() => {
                      setSelectedInvoiceItems(selectedInvoice.items);
                      setEditSelectedInvoice(true);
                      setEditSelectedInvoiceItem(selectedInvoice);
                      setSelectedInvoice(null);
                      setActiveTab("bands");

                    }}
                  >
                    <Text style={styles.buttonText}>تعديل الفاتورة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: "#8C1007", paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10 }}
                    onPress={() => {
                      deleteInvoice(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                  >
                    <Text style={styles.actionText}>🗑 حذف</Text>
                  </TouchableOpacity>


                </View>

                <View>


                  <TouchableOpacity
                    style={[styles.button, { paddingHorizontal: 40, backgroundColor: "#34699A" }]}
                    onPress={() => setVisible(true)}
                  >
                    <Text style={styles.buttonText}>اضافه الاجمالي لاخر فاتورة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </View>
      </Modal>

      <Modal
        visible={paymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: "80%" }}>

            <TextInput
              placeholder="المبلغ المدفوع"
              value={paymentAmount}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9.]/g, "");
                const num = Number(cleaned);

                if (!isNaN(num)) {
                  if (num > selectedInvoice!.remaining) {
                    setPaymentAmount(selectedInvoice!.remaining.toString());
                    Alert.alert("تنبيه", `المبلغ لا يمكن أن يتجاوز ${selectedInvoice!.remaining} جنيه`);
                  } else {
                    setPaymentAmount(cleaned);
                  }
                } else {
                  setPaymentAmount("");
                }
              }}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                marginBottom: 10,
                borderRadius: 5,
              }}
            />

            <Text style={{ fontWeight: "bold" }}>اختر طريقة الدفع:</Text>
            <Picker
              selectedValue={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value)}
            >
              <Picker.Item label="بريد" value="بريد" />
              <Picker.Item label="بنك" value="بنك" />

              <Picker.Item label="نقدا" value="نقدا" />
              <Picker.Item label="فودافون كاش" value="فودافون كاش" />
              <Picker.Item label="أورانج كاش" value="أورانج كاش" />
            </Picker>
            <Text style={{ fontWeight: "bold" }}>أضغط علي التاريخ لاختيار تاريخ الدفع:</Text>

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={{ marginVertical: 10 }}>
                {paymentDate ? paymentDate.toLocaleDateString() : "اختر تاريخ الدفع"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, marginRight: 5 }]}
                onPress={() => {
                  const amountNumber = parseFloat(paymentAmount);

                  if (isNaN(amountNumber) || amountNumber <= 0) {
                    Alert.alert("خطأ", "من فضلك أدخل مبلغ صالح");
                    return;
                  }

                  if (clientId && invoiceId) {
                    addPaymentToInvoice(clientId, invoiceId, paymentMethod, amountNumber);
                  }

                  setPaymentModal(false);
                  setPaymentAmount(""); 
                }}
              >
                <Text style={styles.buttonText}>حفظ</Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={[styles.button, { flex: 1, marginLeft: 5, backgroundColor: "red" }]}
                onPress={() => setPaymentModal(false)}
              >
                <Text style={styles.buttonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={visible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              width: "80%",
            }}
          >
            <Text style={{ marginBottom: 10 }}>أدخل رقم الفاتورة:</Text>

            <TextInput
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              keyboardType="numeric"
              placeholder="رقم الفاتورة"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                marginBottom: 20,
                borderRadius: 5,
              }}
            />

            <Button title="تأكيد الترحيل" onPress={() => {
              if (!clientId || !selectedInvoice) return;

              const sortedInvoices = [...invoices].sort(
                (a, b) => b.createdAt - a.createdAt
              );
              const lastInvoice = sortedInvoices[0];

              if (!lastInvoice) return;

              transferRemainingToLastInvoice(
                clientId,
                selectedInvoice.id,
                lastInvoice.id      
              );
            }} />
            <View style={{ marginTop: 10 }} />
            <Button title="إلغاء" onPress={() => setVisible(false)} />
          </View>
        </View>
      </Modal>
    </View >
  );
}
