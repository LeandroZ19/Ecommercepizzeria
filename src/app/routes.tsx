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
    ],
  },
]);
