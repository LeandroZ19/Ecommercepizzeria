/**
 * routes — Configuración de rutas de la aplicación RapiPizza.
 *
 * Todas las rutas comparten el Layout base (header, footer, widgets).
 * Rutas protegidas (checkout) redirigen a /mi-cuenta si no hay sesión activa.
 *
 * Mapa de rutas:
 * / → Home
 * /menu → Catálogo de productos
 * /promociones → Ofertas vigentes
 * /producto/:id → Detalle de pizza
 * /pizza-personalizada → Creador de pizza
 * /carrito → Carrito de compras
 * /checkout → Finalización de pedido (requiere auth)
 * /mi-cuenta → Perfil de usuario / login
 * /nosotros → Historia y valores
 * /contacto → Formulario de contacto
 * /soporte → FAQ y políticas
 */

import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Promociones from './pages/Promociones';
import Carrito from './pages/Carrito';
import Checkout from './pages/Checkout';
import MiCuenta from './pages/MiCuenta';
import Nosotros from './pages/Nosotros';
import Contacto from './pages/Contacto';
import Soporte from './pages/Soporte';
import ProductDetail from './pages/ProductDetail';
import CustomPizza from './pages/CustomPizza';
import Admin from './pages/Admin';
import RapiPizzaVR from './pages/RapiPizzaVR';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'menu', Component: Menu },
      { path: 'promociones', Component: Promociones },
      { path: 'producto/:id', Component: ProductDetail },
      { path: 'pizza-personalizada', Component: CustomPizza },
      { path: 'carrito', Component: Carrito },
      { path: 'checkout', Component: Checkout },
      { path: 'mi-cuenta', Component: MiCuenta },
      { path: 'nosotros', Component: Nosotros },
      { path: 'contacto', Component: Contacto },
      { path: 'soporte', Component: Soporte },
      { path: 'admin', Component: Admin },
      { path: 'rapipizza-vr', Component: RapiPizzaVR },
    ],
  },
]);
