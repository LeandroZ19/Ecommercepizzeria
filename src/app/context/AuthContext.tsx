import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'pending' | 'confirmed' | 'delivered';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface AuthContextType {
  user: User | null;
  orders: Order[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'>) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders] = useState<Order[]>([
    {
      id: '001',
      date: '2026-04-10',
      total: 45.90,
      status: 'delivered',
      items: [
        { name: 'Pizza Margherita (Mediana)', quantity: 1, price: 25.90 },
        { name: 'Coca Cola 1.5L', quantity: 2, price: 10.00 },
      ],
    },
    {
      id: '002',
      date: '2026-04-12',
      total: 68.50,
      status: 'confirmed',
      items: [
        { name: 'Pizza Pepperoni (Grande)', quantity: 1, price: 35.90 },
        { name: 'Alitas BBQ', quantity: 1, price: 22.60 },
        { name: 'Sprite 1.5L', quantity: 1, price: 10.00 },
      ],
    },
  ]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - en producción esto llamaría a una API
    if (email && password) {
      setUser({
        id: '1',
        name: 'Usuario Demo',
        email: email,
        phone: '+51 999 888 777',
        address: 'Av. Principal 123, Lima',
      });
      return true;
    }
    return false;
  };

  const register = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    // Mock register - en producción esto llamaría a una API
    setUser({
      id: Date.now().toString(),
      ...userData,
    });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        orders,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
