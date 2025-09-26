import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 30,
    backgroundColor: "#DCDCDC", 
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#000",
    marginBottom: 32,
    textAlign: "center",
  },
input: {
  borderWidth: 1,
  borderColor: "#475569",
  marginBottom: 7,
  padding: 10,
  borderRadius: 10,
  backgroundColor: "#DCDCDC",
  color: "#000",        
  fontSize: 16,
},
 invoiceBox: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  invoiceTable: {
    marginBottom: 10,
  },
  tableHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  tableCell: {
    fontSize: 14,
    color: "#cbd5e1",
    textAlign: "center",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
    textAlign: "right",
    marginTop: 10,
  },
  itemBox: {
    backgroundColor: "#334155",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  itemPrice: {
    fontSize: 14,
    color: "#cbd5e1",
  },
  itemDescription: {
    fontSize: 12,
    color: "#94a3b8",
  },
  button: {
    backgroundColor: "#34699A", 
    padding: 7,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    fontSize: 14,
    color: "#000",
  },
  linkHighlight: {
    color: "#34699A",
    fontWeight: "600",
  },  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 18,
    marginTop: 20,
  },
clientBox: {
  backgroundColor: "#e2e2e2",       
  padding: 16,                      
  borderRadius: 12,
  marginVertical: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,               
  shadowRadius: 6,
  elevation: 5,                   
  borderWidth: 1,
  borderColor: "#000",           
}
,
  clientName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  clientCountry: {
    fontSize: 16,
    color: "#000",
    marginTop: 6,
  },
  actions: {
    flexDirection: "row-reverse",
    marginTop: 10,
    justifyContent: "center",
    alignItems:"flex-start",
    gap:3

  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },bandRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginVertical: 5,
  padding: 10,
  borderRadius: 8,
  backgroundColor: "#334155",
},
tab: {
    fontSize: 16,
    color: "#34699A",
  padding:7,
    borderRadius:10,
    fontWeight:900,
  },
  activeTab: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
        backgroundColor:"#34699A" ,padding:7,
    borderRadius:10

  },
  typeBtn: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#64748b",
    alignItems: "center",
    fontWeight:800
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: "#64748b",
    paddingTop: 10,
    paddingVertical: 1,
    width: 100,
    marginTop:0,
    textAlign: "center",
    borderRadius: 6,
    color: "#fff",
    backgroundColor: "#334155",
    fontSize:30
  },
  modalOverlay: {
    flex:1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#DCDCDC",
    paddingHorizontal: 10,
    borderRadius: 12,
  },
 
  invoiceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
