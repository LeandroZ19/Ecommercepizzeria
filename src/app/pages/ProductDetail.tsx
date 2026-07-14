/**
 * ProductDetail — Página de detalle de producto universal.
 *
 * Busca el producto en dos fuentes:
 *  1. detailedPizzas (pizzas con tamaños, ingredientes, nutrición)
 *  2. allProducts    (combos, promos y complementos del menú real)
 *
 * Todos los productos muestran zoom de imagen estilo Amazon.
 * Pizzas: selector de tamaño + precio dinámico.
 * Combos/promos: descripción completa + precio fijo.
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { detailedPizzas, type DetailedProduct } from '../data/productsDetailed';
import { allProducts, type ExtendedProduct } from '../data/products';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Check, Info, Flame, Package, Clock, Users, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';
import ImageMagnifier from '../components/ImageMagnifier';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extendedToDetailed(p: ExtendedProduct): DetailedProduct & { _isCombo: boolean; _subcategory?: string } {
  return {
    id:          p.id,
    name:        p.name,
    description: p.description,
    image:       p.image,
    category:    p.category,
    basePrice:   p.price,
    _isCombo:    true,
    _subcategory: p.subcategory,
  };
}

function parseComboIncludes(description: string): string[] {
  return description.split(/[,]+/).map(s => s.trim()).filter(Boolean);
}

const SECTION_LABELS: Record<string, string> = {
  'combo-rapilover': 'Combo Rapilover',
  'promo-ame-peppe': 'Promo Ame & Peppe',
  'promo-rapilover': 'Promo Rapilover',
  'pizza-personal':  'Pizza Personal',
  'pizza-doble':     'Pizza Doble',
  'combo-6':         'Combos 6 Porciones',
  'promo-8':         'Promos 8 Porciones',
  'promo-extrema':   'Promos Extremas',
  'complemento':     'Complementos',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const detailed = detailedPizzas.find(p => p.id === id);
  const extended = !detailed ? allProducts.find(p => p.id === id || p.detailId === id) : null;

  type UnifiedProduct = (DetailedProduct & { _isCombo?: boolean; _subcategory?: string }) | null;
  const product: UnifiedProduct = detailed
    ? { ...detailed, _isCombo: false }
    : extended
    ? extendedToDetailed(extended)
    : null;

  const baseFixedPrice = extended?.price ?? 0;
  const hasSizes = !product?._isCombo && 'sizes' in (product ?? {}) && ((product as any)?.sizes?.length ?? 0) > 0;

  const [showARModal, setShowARModal] = useState(false);

  const [selectedSize, setSelectedSize] = useState(() => {
    if (!hasSizes) return 'default';
    const sizes = (product as any)?.sizes ?? [];
    return sizes[1]?.id ?? sizes[0]?.id ?? 'default';
  });

  if (!product) {
    return (
      <div className="py-20 text-center container mx-auto px-4">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h1 className="font-display text-3xl font-bold mb-4">Producto no encontrado</h1>
        <p className="text-muted-foreground mb-6">El producto que buscas no existe o fue removido del menú.</p>
        <Link to="/menu"><Button>Ver Menú Completo</Button></Link>
      </div>
    );
  }

  const sizes = (product as any)?.sizes as any[] | undefined;
  const currentSize   = hasSizes ? sizes?.find((s: any) => s.id === selectedSize) : undefined;
  const displayPrice  = hasSizes ? (currentSize?.price ?? 0) : baseFixedPrice;

  const handleAddToCart = () => {
    addToCart({
      id:          hasSizes ? `${product.id}-${selectedSize}` : product.id,
      name:        hasSizes ? `${product.name} (${currentSize?.name})` : product.name,
      description: product.description,
      price:       displayPrice,
      image:       product.image,
      category:    product.category,
      size:        (hasSizes ? selectedSize : undefined) as any,
    });
    toast.success(`${product.name} agregado al carrito`, { icon: <Check className="w-4 h-4" /> });
  };

  const related = product._isCombo
    ? allProducts.filter(p => p.subcategory === extended?.subcategory && p.id !== id).slice(0, 3)
    : detailedPizzas.filter(p => p.id !== id).slice(0, 3);

  return (
    <div className="py-6 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4 md:mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Menú
          </Button>
        </motion.div>

        {product._subcategory && (
          <div className="mb-4">
            <Badge variant="secondary" className="text-xs">
              {SECTION_LABELS[product._subcategory] ?? product._subcategory}
            </Badge>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">

          {/* Columna izquierda: imagen */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-border bg-card aspect-square">
              <ImageMagnifier src={product.image} alt={product.name} zoom={2.5} lensSize={130} className="w-full h-full" />
            </div>
            <p className="hidden md:block text-xs text-center text-muted-foreground">
              🔍 Pasa el cursor sobre la imagen para hacer zoom
            </p>

            {/* Info nutricional */}
            {!product._isCombo && (product as any).nutritionalInfo && (
              <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                <h3 className="font-display text-sm font-bold mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Información Nutricional <span className="text-muted-foreground font-normal">(por porción)</span>
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Calorías', value: (product as any).nutritionalInfo.calories, unit: 'kcal' },
                    { label: 'Proteínas', value: (product as any).nutritionalInfo.protein, unit: 'g' },
                    { label: 'Carbos', value: (product as any).nutritionalInfo.carbs, unit: 'g' },
                    { label: 'Grasas', value: (product as any).nutritionalInfo.fat, unit: 'g' },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="bg-muted/40 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="font-bold text-xs">{value}<span className="text-[10px] font-normal"> {unit}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Columna derecha: detalles */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-5">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-3">{product.name}</h1>
              <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Alérgenos */}
            {!product._isCombo && (product as any).allergens?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-sm font-medium">Alérgenos:</span>
                {(product as any).allergens.map((a: string) => (
                  <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                ))}
              </div>
            )}

            {/* Ingredientes (pizzas detalladas) */}
            {!product._isCombo && (product as any).ingredients && (
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-display text-base font-bold mb-3">Ingredientes</h3>
                <ul className="space-y-1.5">
                  {(product as any).ingredients.map((ing: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* "Qué incluye" (combos) */}
            {product._isCombo && (
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-display text-base font-bold mb-3">¿Qué incluye?</h3>
                <ul className="space-y-1.5">
                  {parseComboIncludes(product.description).map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Selector de tamaño */}
            {hasSizes && sizes && (
              <div>
                <h3 className="font-display text-base font-bold mb-3">Elige tu tamaño</h3>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map((size: any) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      aria-pressed={selectedSize === size.id}
                      className={`relative p-3 rounded-xl border-2 transition-all text-center focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        selectedSize === size.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {selectedSize === size.id && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="font-bold text-xs md:text-sm">{size.name}</p>
                      <p className="text-[10px] text-muted-foreground">{size.diameter}</p>
                      <p className="text-[10px] text-muted-foreground mb-1">{size.slices} porciones</p>
                      <p className="font-bold text-xs text-primary">S/ {size.price.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Precio y CTA */}
            <div className="bg-card rounded-xl p-4 md:p-6 shadow-md border border-border lg:sticky lg:top-24">
              <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 15–30 min</span>
                {hasSizes && currentSize && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {currentSize.slices} porciones</span>
                )}
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Precio:</span>
                <span className="font-display text-3xl md:text-4xl font-bold text-primary">
                  S/ {displayPrice.toFixed(2)}
                </span>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="w-full h-12">
                Agregar al Carrito
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowARModal(true)}
                className="w-full h-11 gap-2 mt-3 border-dashed"
              >
                <QrCode className="w-4 h-4" />
                Ver en Realidad Aumentada
              </Button>
            </div>

            {/* Modal AR QR */}
            <Dialog open={showARModal} onOpenChange={setShowARModal}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-display">
                    <QrCode className="w-5 h-5 text-primary" />
                    Ver {product.name} en AR
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Escanea este código QR con tu celular para ver el modelo 3D de la pizza sobre tu mesa usando la cámara.
                  </p>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-inner border border-border">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          `${window.location.origin}/ar-viewer.html?product=${encodeURIComponent(product.name)}`
                        )}`}
                        alt="Código QR para AR"
                        className="w-48 h-48 block"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  {/* Marcador Hiro directamente en la página */}
                  <div className="border border-border rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Marcador AR — imprímelo o muéstralo en pantalla:</p>
                    <div className="flex items-center gap-4">
                      <img
                        src="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/HIRO.jpg"
                        alt="Marcador Hiro para AR"
                        className="w-28 h-28 rounded-lg border border-border flex-shrink-0 bg-white"
                        loading="lazy"
                      />
                      <div className="text-xs text-muted-foreground space-y-1.5">
                        <p>1. Escanea el QR con tu celular.</p>
                        <p>2. Apunta la cámara al marcador de la izquierda.</p>
                        <p>3. La pizza aparecerá en 3D 🍕</p>
                        <p className="opacity-70 pt-1">Requiere <strong>Chrome Android</strong> o <strong>Safari iOS</strong>.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <ul className="text-xs text-muted-foreground space-y-1 px-1">
              <li>✓ Preparado al momento con ingredientes frescos</li>
              <li>✓ Horneado en horno de piedra a alta temperatura</li>
              <li>✓ Tiempo de preparación: 15–25 minutos</li>
            </ul>
          </motion.div>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 md:mt-16">
            <h2 className="font-display text-2xl font-bold mb-5">También te puede gustar</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {related.map((rel: any) => {
                const relId    = rel.detailId ?? rel.id;
                const relPrice = rel.sizes ? (rel.sizes[1]?.price ?? rel.sizes[0]?.price) : (rel.price ?? rel.basePrice ?? 0);
                return (
                  <Link key={rel.id} to={`/producto/${relId}`}
                    className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group border border-border">
                    <div className="aspect-square overflow-hidden">
                      <img src={rel.image} alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-display text-sm font-bold mb-1 line-clamp-2">{rel.name}</h3>
                      <p className="font-bold text-primary text-sm">S/ {relPrice.toFixed(2)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
