/**
 * Menu — Catálogo completo de productos de RapiPizza.
 *
 * Muestra todos los productos agrupados por sección según el menú real:
 * - Combo Rapilover, Promo Ame & Peppe, Promo Rapilover, Pizza Personal,
 *   Pizza Doble, Combos 6P, Promos 8P, Promos Extremas, Complementos.
 *
 * Funcionalidades:
 * - Búsqueda en tiempo real por nombre / descripción
 * - Filtro por sección con scroll horizontal en móvil
 * - Grilla responsiva (2 → 4 columnas)
 * - Tarjetas de altura uniforme (flex column con descripción flex-1)
 * - CTA final para pizza personalizada
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  allProducts,
  type ProductCategory,
  type ExtendedProduct,
} from '../data/products';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Eye, Search } from 'lucide-react';
import { toast } from 'sonner';

// ─── Definición de secciones del menú ────────────────────────────────────────

interface MenuSection {
  id: 'all' | ProductCategory;
  label: string;
  emoji: string;
}

const SECTIONS: MenuSection[] = [
  { id: 'all',             label: 'Todo el Menú',       emoji: '🍕' },
  { id: 'combo-rapilover', label: 'Combo Rapilover',    emoji: '🔥' },
  { id: 'promo-ame-peppe', label: 'Ame & Peppe',        emoji: '⭐' },
  { id: 'promo-rapilover', label: 'Promo Rapilover',    emoji: '🎉' },
  { id: 'pizza-personal',  label: 'Pizza Personal',     emoji: '🍕' },
  { id: 'pizza-doble',     label: 'Pizza Doble',        emoji: '2️⃣' },
  { id: 'combo-6',         label: 'Combos 6 Porciones', emoji: '📦' },
  { id: 'promo-8',         label: 'Promos 8 Porciones', emoji: '👨‍👩‍👧‍👦' },
  { id: 'promo-extrema',   label: 'Promos Extremas',    emoji: '💥' },
  { id: 'complemento',     label: 'Complementos',       emoji: '🧄' },
  /** Bebidas — gaseosas y jugos artesanales */
  { id: 'drink',           label: 'Bebidas',            emoji: '🥤' },
];

// ─── Componente de tarjeta de producto ───────────────────────────────────────

/**
 * ProductCard — Tarjeta de producto con altura uniforme.
 *
 * Usa flex-col con la descripción como flex-1 para que todas las
 * tarjetas en la misma fila tengan la misma altura independientemente
 * del largo del texto.
 */
function ProductCard({
  product,
  index,
}: {
  product: ExtendedProduct;
  index: number;
}) {
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product);
    toast.success(`${product.name} agregado al carrito`);
  };

  // Todos los productos tienen página de detalle
  const detailPageId = product.detailId ?? product.id;

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-border flex flex-col h-full"
      aria-label={product.name}
    >
      {/* Imagen — aspecto fijo para igualdad de altura */}
      <div className="relative overflow-hidden aspect-[4/3] flex-shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badge de precio */}
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold shadow-md">
          S/ {product.price.toFixed(2)}
        </div>

        {/* Badge popular */}
        {product.popular && (
          <div className="absolute top-2 left-2">
            <Badge className="text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground">
              Popular
            </Badge>
          </div>
        )}
      </div>

      {/* Contenido — flex-1 para altura uniforme */}
      <div className="flex flex-col flex-1 p-2.5 md:p-4">
        {/* Nombre */}
        <h3 className="font-display text-xs md:text-base font-bold mb-1 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Descripción — crece para igualar alturas */}
        <p className="text-[10px] md:text-xs text-muted-foreground mb-2 flex-1 line-clamp-2 md:line-clamp-3 leading-relaxed">
          {product.description}
        </p>

        {/* Precio prominente */}
        <p className="text-primary font-bold text-sm md:text-base mb-2">
          S/ {product.price.toFixed(2)}
        </p>

        {/* Botones de acción — vertical en móvil, horizontal en md+ */}
        <div className="flex flex-col sm:flex-row gap-1 mt-auto">
          <Link to={`/producto/${detailPageId}`} className="flex-1">
            <Button variant="outline" className="w-full h-7 md:h-8 text-[10px] md:text-xs" size="sm">
              <Eye className="w-3 h-3 mr-1 hidden sm:inline" aria-hidden="true" />
              Ver
            </Button>
          </Link>
          <Button
            onClick={handleAdd}
            className="flex-1 h-7 md:h-8 text-[10px] md:text-xs"
            size="sm"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            + Carrito
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

type ActiveSection = 'all' | ProductCategory;

/** Página del catálogo de productos */
export default function Menu() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('all');
  const [searchQuery, setSearchQuery]     = useState('');

  // Filtrado por sección
  const bySection: ExtendedProduct[] =
    activeSection === 'all'
      ? allProducts
      : allProducts.filter(p => p.subcategory === activeSection);

  // Filtrado adicional por búsqueda
  const filtered: ExtendedProduct[] = searchQuery.trim()
    ? bySection.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bySection;

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-3 md:px-4">

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-10"
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">
            Nuestro Menú
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            {allProducts.length} productos — combos, promos y complementos
          </p>
        </motion.div>

        {/* Buscador */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg mx-auto mb-5"
        >
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-11 h-11"
              aria-label="Buscar productos en el menú"
            />
          </div>
        </motion.div>

        {/* Filtro de secciones — scroll horizontal en móvil */}
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex overflow-x-auto gap-2 pb-3 mb-6 md:mb-8 scrollbar-hide"
          aria-label="Filtrar por sección del menú"
        >
          {SECTIONS.map(section => {
            const count =
              section.id === 'all'
                ? allProducts.length
                : allProducts.filter(p => p.subcategory === section.id).length;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                aria-pressed={activeSection === section.id}
                aria-label={`${section.label} (${count} productos)`}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                <span aria-hidden="true">{section.emoji}</span>
                {section.label}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </motion.nav>

        {/* Grilla de productos */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 items-stretch">
            {filtered.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          /* Estado vacío */
          <div className="text-center py-20" role="status">
            <Search className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" aria-hidden="true" />
            <p className="text-lg font-medium mb-2">Sin resultados</p>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `No encontramos productos que coincidan con "${searchQuery}"`
                : 'No hay productos en esta sección'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Limpiar búsqueda
              </Button>
            )}
          </div>
        )}

        {/* CTA pizza personalizada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-10 text-center text-primary-foreground"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
            ¿Quieres crear tu propia pizza?
          </h2>
          <p className="text-sm md:text-base mb-5 opacity-90 max-w-xl mx-auto">
            Elige tu masa, salsa, queso y los ingredientes que más te gusten.
            La vista previa se actualiza en tiempo real.
          </p>
          <Link to="/pizza-personalizada">
            <Button size="lg" variant="secondary">
              Crear Pizza Personalizada 🍕
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
