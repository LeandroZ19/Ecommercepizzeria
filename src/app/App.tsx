/**
 * App — Componente raíz de RapiPizza.
 *
 * Configura los proveedores globales en orden:
 * 1. AuthProvider — sesión de usuario (localStorage)
 * 2. CartProvider — carrito persistente por usuario
 * 3. RouterProvider — enrutamiento con React Router v7
 * 4. Toaster — notificaciones toast (Sonner)
 */
// MARKER-MAKE-KIT-INVOKED

import { RouterProvider } from 'react-router';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </CartProvider>
    </AuthProvider>
  );
}