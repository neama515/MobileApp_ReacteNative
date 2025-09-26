import * as SecureStore from "expo-secure-store";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { app } from "../app/firebase/firebase";

interface AuthContextType {
  user: User | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = getAuth(app);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    (async () => {
      const storedUser = await SecureStore.getItemAsync("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    })();
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await SecureStore.setItemAsync("user", JSON.stringify(currentUser));
      } else {
        setUser(null);
        await SecureStore.deleteItemAsync("user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

 
  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      if (currentUser) {
        const token = await currentUser.getIdToken(); 
        await SecureStore.setItemAsync("userToken", token); 
      }

    } catch (error: any) {
      console.error("Login error:", error.message);
      throw error; 
    }
  };


  const logout = async () => {
    await signOut(auth); await SecureStore.deleteItemAsync("user");

    setUser(null); 
  };


  return (
    <AuthContext.Provider value={{ user, register, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
