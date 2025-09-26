import React, { createContext, useState, ReactNode } from "react";

export type Band = {
    id: string;
    name: string;
    price: number;
    type: "كرتونة" | "كيلو" | "بالواحد";
};

export type InvoiceItem = Band & { qty: number };

type InvoiceContextType = {
    selectedInvoiceItems: Record<string, InvoiceItem[]>; 
    setSelectedInvoiceItems: (clientId: string, items: InvoiceItem[]) => void;
};

export const InvoiceContext = createContext<InvoiceContextType>({
    selectedInvoiceItems: {},
    setSelectedInvoiceItems: () => { },
});

export const InvoiceProvider = ({ children }: { children: ReactNode }) => {
    const [selectedInvoiceItems, setItems] = useState<Record<string, InvoiceItem[]>>({});

    const setSelectedInvoiceItems = (clientId: string, items: InvoiceItem[]) => {
        setItems(prev => ({ ...prev, [clientId]: items }));
    };

    return (
        <InvoiceContext.Provider value={{ selectedInvoiceItems, setSelectedInvoiceItems }}>
            {children}
        </InvoiceContext.Provider>
    );
};
