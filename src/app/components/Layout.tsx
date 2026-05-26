import { Link, Outlet, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Pizza,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import AccessibilityWidget from "./AccessibilityWidget";

export default function Layout() {
  const { getItemCount } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const itemCount = getItemCount();

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Menú", path: "/menu" },
    { name: "Promociones", path: "/promociones" },
    { name: "Nosotros", path: "/nosotros" },
    { name: "Contacto", path: "/contacto" },
    { name: "Soporte", path: "/soporte" },
  ];

  const authNavLinks = [
    { name: "Mis Pedidos", path: "/mi-cuenta", requiresAuth: true },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg bg-[#e25216]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Pizza className="w-8 h-8" />
              </motion.div>
              <span className="text-2xl font-display font-bold">
                RapiPizza
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    className={`text-sm font-medium transition-all hover:text-accent relative ${
                      isActive(link.path) ? "text-accent" : ""
                    }`}
                  >
                    {link.name}
                    {isActive(link.path) && (
                      <motion.div
                        layoutId="activeLink"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
              {user && authNavLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (navLinks.length + index) * 0.1 }}
                >
                  <Link
                    to={link.path}
                    className={`text-sm font-medium transition-all hover:text-accent relative ${
                      isActive(link.path) ? "text-accent" : ""
                    }`}
                  >
                    {link.name}
                    {isActive(link.path) && (
                      <motion.div
                        layoutId="activeLink"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* User */}
              <Link
                to="/mi-cuenta"
                className="hidden md:flex items-center gap-2 hover:text-accent transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {user ? user.name : "Mi Cuenta"}
                </span>
              </Link>

              {/* Cart */}
              <Link
                to="/carrito"
                className="relative flex items-center gap-2 hover:text-accent transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() =>
                  setMobileMenuOpen(!mobileMenuOpen)
                }
                className="lg:hidden p-2 hover:bg-primary/80 rounded-md transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden mt-4 pb-4 border-t border-primary-foreground/20 pt-4"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium transition-colors hover:text-accent ${
                      isActive(link.path) ? "text-accent" : ""
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                {user && authNavLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium transition-colors hover:text-accent ${
                      isActive(link.path) ? "text-accent" : ""
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/mi-cuenta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="md:hidden text-sm font-medium transition-colors hover:text-accent flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {user ? user.name : "Mi Cuenta"}
                </Link>
              </div>
            </motion.nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <AccessibilityWidget />

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground mt-auto bg-[#e25216]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="font-display text-lg mb-4">
                RapiPizza
              </h3>
              <p className="text-sm opacity-90">
                Expertos en la elaboración de las mejores pizzas artesanales, horneadas al instante.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display text-lg mb-4">
                Enlaces
              </h4>
              <ul className="space-y-2 text-sm opacity-90">
                <li>
                  <Link
                    to="/menu"
                    className="hover:text-accent transition-colors"
                  >
                    Menú
                  </Link>
                </li>
                <li>
                  <Link
                    to="/promociones"
                    className="hover:text-accent transition-colors"
                  >
                    Promociones
                  </Link>
                </li>
                <li>
                  <Link
                    to="/nosotros"
                    className="hover:text-accent transition-colors"
                  >
                    Nosotros
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contacto"
                    className="hover:text-accent transition-colors"
                  >
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-display text-lg mb-4">
                Soporte
              </h4>
              <ul className="space-y-2 text-sm opacity-90">
                <li>
                  <Link
                    to="/soporte"
                    className="hover:text-accent transition-colors"
                  >
                    Preguntas Frecuentes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/soporte"
                    className="hover:text-accent transition-colors"
                  >
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link
                    to="/soporte"
                    className="hover:text-accent transition-colors"
                  >
                    Políticas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-lg mb-4">
                Contacto
              </h4>
              <ul className="space-y-2 text-sm opacity-90">
                <li>📞 +51 903 582 008</li>
                <li>📧 info@rapipizza.com</li>
                <li>📍 Av. Sucre 112 San Gabriel, Villa María del Triunfo 15811</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-80">
            <p>
              &copy; 2024 RapiPizza. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}