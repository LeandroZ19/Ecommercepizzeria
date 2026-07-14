/**
 * CartContext — Estado global del carrito de compras.
 *
 * Persistencia por usuario: el carrito se guarda en localStorage con la
 * clave "cart_<userId>" (o "cart_guest" para sesiones sin login).
 * Cuando el usuario cierra sesión, el carrito de huésped se limpia.
 *
 * Funciones expuestas:
 * - addToCart / removeFromCart / updateQuantity / clearCart
 * - applyCoupon / removeCoupon — sistema de cupones de descuento
 * - getTotal / getDiscount / getFinalTotal / getItemCount — derivados
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'pizza' | 'drink' | 'side';
  size?: 'small' | 'medium' | 'large';
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
}

export interface DayPromo {
  active: boolean;
  name: string;
  discount: number;
  dayName: string;
}

interface CartContextType {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  activeDayPromo: DayPromo | null;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  getDiscount: () => number;
  getFinalTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Promos automáticas por día de la semana (dayOfWeek: 0=Dom … 6=Sáb)
const DAY_PROMOS: Record<number, { name: string; discount: number; dayName: string }> = {
  2: { name: 'Martes de Pizza 2x1', discount: 50, dayName: 'Martes' },
  4: { name: 'Jueves de Combos -30%', discount: 30, dayName: 'Jueves' },
  0: { name: 'Domingo Especial -15%', discount: 15, dayName: 'Domingo' },
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Promo automática activa hoy (si hay una)
  const todayDow = new Date().getDay();
  const activeDayPromo: DayPromo | null = DAY_PROMOS[todayDow]
    ? { active: true, ...DAY_PROMOS[todayDow] }
    : null;

  // Cargar el carrito desde el almacenamiento local cuando el usuario inicie sesión
  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
        }
      }
    } else {
      // Vaciar el carrito cuando el usuario cierre sesión
      setItems([]);
      setAppliedCoupon(null);
    }
  }, [user]);

  // Guarda el carrito en el almacenamiento local cada vez que cambien los artículos.
  useEffect(() => {
    if (user && items.length > 0) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(items));
    } else if (user && items.length === 0) {
      localStorage.removeItem(`cart_${user.id}`);
    }
  }, [items, user]);

  const addToCart = (product: Product) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentItems, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const applyCoupon = (code: string): boolean => {
    const validCoupons = [
      { code: 'PROMO10',    discount: 10 },
      { code: 'PRIMERA',    discount: 15 },
      { code: 'FAMILIA25',  discount: 25 },
      { code: 'HAPPY20',    discount: 20 },
      { code: 'PARTY15',    discount: 15 },
      { code: 'INVIERNO20', discount: 20 },
      { code: 'PERU15',     discount: 15 },
      { code: 'ESCOLAR10',  discount: 10 },
      { code: 'NAVIDAD25',  discount: 25 },
      { code: 'DOMINGO15',  discount: 15 },
    ];

    const coupon = validCoupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase()
    );

    if (coupon) {
      setAppliedCoupon(coupon);
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getDiscount = () => {
    const total = getTotal();
    // La promo del día se aplica siempre. Si el usuario además tiene cupón, se acumula.
    const dayDiscount = activeDayPromo ? (total * activeDayPromo.discount) / 100 : 0;
    const couponDiscount = appliedCoupon ? (total * appliedCoupon.discount) / 100 : 0;
    // El descuento final es el mayor entre los dos (no acumulable, protege al usuario)
    return Math.max(dayDiscount, couponDiscount);
  };

  const getFinalTotal = () => {
    return Math.max(0, getTotal() - getDiscount());
  };

  return (
    <CartContext.Provider
      value={{
        items,
        appliedCoupon,
        activeDayPromo,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        applyCoupon,
        removeCoupon,
        getDiscount,
        getFinalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
