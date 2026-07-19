import { motion } from 'motion/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  fetchAllOrders, fetchItemsByOrderId, updateOrderStatus,
  fetchProductsWithStock, updateProductStock,
} from '../../../utils/supabase/db';
import type { OrderWithItems, OrderItemRow, ProductRow } from '../../../utils/supabase/db';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Package, ChevronDown, ChevronUp, RefreshCw, Hash,
  Clock, CheckCircle, Truck, XCircle, MapPin, Navigation, LogOut, ShoppingBag,
  Boxes, Search, AlertTriangle, TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Constantes ────────────────────────────────────────────────────────────────

const STORE_COORDS: [number, number] = [-12.1628, -76.9443];

type OrderStatus = 'pending' | 'preparing' | 'sent' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   'Pendiente',
  preparing: 'En preparación',
  sent:      'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  sent:      'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// ─── Mapa de ruta (Leaflet) ────────────────────────────────────────────────────

function RouteMap({ address, orderId }: { address: string; orderId: string }) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const mapInst = useRef<unknown>(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    let destroyed = false;

    async function init() {
      if (!mapRef.current) return;
      try {
        const L = (await import('leaflet')).default;
        // @ts-expect-error internal
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const encoded = encodeURIComponent(address + ', Lima, Perú');
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
          { headers: { 'Accept-Language': 'es' } },
        );
        const data = await res.json();
        if (destroyed) return;

        const clientCoords: [number, number] = data[0]
          ? [parseFloat(data[0].lat), parseFloat(data[0].lon)]
          : STORE_COORDS;

        if (mapInst.current) (mapInst.current as { remove: () => void }).remove();

        const map = L.map(mapRef.current!).fitBounds([STORE_COORDS, clientCoords], { padding: [30, 30] });
        mapInst.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
        }).addTo(map);

        const storeIcon = L.divIcon({
          html: '<div style="background:#e25216;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>',
          className: '', iconSize: [16, 16], iconAnchor: [8, 8],
        });
        L.marker(STORE_COORDS, { icon: storeIcon }).addTo(map)
          .bindPopup('<b>🍕 RapiPizza</b><br>Av. Sucre 112, VMT').openPopup();

        const clientIcon = L.divIcon({
          html: '<div style="background:#1d4ed8;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>',
          className: '', iconSize: [16, 16], iconAnchor: [8, 8],
        });
        L.marker(clientCoords, { icon: clientIcon }).addTo(map)
          .bindPopup(`<b>📍 Cliente</b><br>${address}`);

        L.polyline([STORE_COORDS, clientCoords], {
          color: '#e25216', weight: 4, dashArray: '8 5',
        }).addTo(map);

        setLoading(false);
      } catch {
        if (!destroyed) { setError('No se pudo cargar el mapa'); setLoading(false); }
      }
    }

    init();
    return () => {
      destroyed = true;
      if (mapInst.current) { (mapInst.current as { remove: () => void }).remove(); mapInst.current = null; }
    };
  }, [address, orderId]);

  if (error) return (
    <div className="h-52 bg-muted rounded-xl flex items-center justify-center text-sm text-muted-foreground">{error}</div>
  );

  return (
    <div style={{ isolation: 'isolate' }} className="relative">
      {loading && (
        <div className="absolute inset-0 bg-muted rounded-xl flex items-center justify-center z-10">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={mapRef} className="h-52 rounded-xl overflow-hidden border border-border" />
      <div className="absolute top-2 left-2 bg-white/90 rounded-lg px-2 py-1 text-xs font-medium shadow flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-primary" /> Tienda
        <span className="mx-1 text-muted-foreground">→</span>
        <div className="w-3 h-3 rounded-full bg-blue-600" /> Cliente
      </div>
    </div>
  );
}

// ─── Tarjeta de entrega (DELIVERY) ─────────────────────────────────────────────

function DeliveryCard({
  order,
  onStatusChange,
}: {
  order: OrderWithItems;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [expanded,      setExpanded]      = useState(false);
  const [showMap,       setShowMap]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [items,         setItems]         = useState<OrderItemRow[]>([]);
  const [fetchingItems, setFetchingItems] = useState(false);
  const hasFetched = useRef(false);

  const status = order.status as OrderStatus;

  // Al expandir por primera vez, carga items directamente de order_items
  useEffect(() => {
    if (!expanded || hasFetched.current) return;
    hasFetched.current = true;
    setFetchingItems(true);
    fetchItemsByOrderId(order.id).then(({ data }) => {
      setItems(data);
      setFetchingItems(false);
    });
  }, [expanded, order.id]);

  const handleStartRoute = async () => {
    setLoading(true);
    await onStatusChange(order.id, 'sent');
    setLoading(false);
    setExpanded(true);
    setShowMap(true);
  };

  const handleDeliver = async () => {
    setLoading(true);
    await onStatusChange(order.id, 'delivered');
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            {order.order_number
              ? <span className="text-xs font-bold text-primary">#{order.order_number}</span>
              : <Hash className="w-4 h-4 text-primary" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {order.customer_name || 'Cliente'} · {order.district || 'Sin distrito'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {order.address || 'Sin dirección'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <Badge className={`text-xs ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            {order.customer_phone && (
              <p className="text-sm flex items-center gap-2">
                <span className="text-base">📞</span>
                <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline font-medium">
                  {order.customer_phone}
                </a>
              </p>
            )}
            {order.address && (
              <p className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{order.address}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Pago: {order.payment_method === 'card' ? 'Tarjeta' : 'Efectivo'} · Total: <strong>S/ {order.total.toFixed(2)}</strong>
            </p>
          </div>

          {/* Productos del pedido */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Productos</p>
            {fetchingItems ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                Cargando productos...
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-1.5">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product_name} <span className="font-medium text-primary">×{item.quantity}</span></span>
                    <span className="font-medium">S/ {(item.subtotal ?? item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Sin detalle de productos</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {status === 'preparing' && (
              <Button onClick={handleStartRoute} disabled={loading} className="gap-2 flex-1">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Navigation className="w-4 h-4" />}
                Empezar Ruta
              </Button>
            )}
            {status === 'sent' && (
              <Button onClick={handleDeliver} disabled={loading} className="gap-2 flex-1 bg-green-600 hover:bg-green-700">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Marcar Entregado
              </Button>
            )}
            {order.address && (status === 'pending' || status === 'preparing' || status === 'sent') && (
              <Button variant="outline" onClick={() => setShowMap(s => !s)} className="gap-2">
                <MapPin className="w-4 h-4" />
                {showMap ? 'Ocultar mapa' : 'Ver mapa'}
              </Button>
            )}
          </div>

          {showMap && order.address && (
            <RouteMap address={order.address} orderId={order.id} />
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Panel de Delivery ─────────────────────────────────────────────────────────

function DeliveryPanel({ orders, loading, onStatusChange, onRefresh }: {
  orders: OrderWithItems[];
  loading: boolean;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onRefresh: () => void;
}) {
  const allDelivery   = orders.filter(o => o.delivery_type === 'delivery' && !['delivered', 'cancelled'].includes(o.status));
  const pendingOrders = allDelivery.filter(o => o.status === 'pending');
  const activeOrders  = allDelivery.filter(o => o.status === 'preparing' || o.status === 'sent');
  const completedToday = orders.filter(o => {
    const isToday = new Date(o.created_at).toDateString() === new Date().toDateString();
    return o.delivery_type === 'delivery' && o.status === 'delivered' && isToday;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <Truck className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-primary">{activeOrders.length}</p>
          <p className="text-xs text-muted-foreground">En preparación / En ruta</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-600">{completedToday.length}</p>
          <p className="text-xs text-muted-foreground">Entregados hoy</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Mis Entregas</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {pendingOrders.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Nuevos pedidos ({pendingOrders.length})
              </p>
              {pendingOrders.map(order => <DeliveryCard key={order.id} order={order} onStatusChange={onStatusChange} />)}
            </div>
          )}
          {activeOrders.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">
                En preparación / En ruta ({activeOrders.length})
              </p>
              {activeOrders.map(order => <DeliveryCard key={order.id} order={order} onStatusChange={onStatusChange} />)}
            </div>
          )}
          {allDelivery.length === 0 && (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-semibold">No hay pedidos activos</p>
              <p className="text-sm text-muted-foreground mt-1">Los pedidos nuevos aparecerán aquí</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta de pedido (ADMIN) ─────────────────────────────────────────────────

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:   'preparing',
  preparing: 'sent',
  sent:      'delivered',
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:   'Marcar en preparación',
  preparing: 'Marcar en camino',
  sent:      'Marcar entregado',
};

const NEXT_ICON: Partial<Record<OrderStatus, React.ReactNode>> = {
  pending:   <Clock className="w-3.5 h-3.5" />,
  preparing: <Truck className="w-3.5 h-3.5" />,
  sent:      <CheckCircle className="w-3.5 h-3.5" />,
};

function AdminOrderCard({
  order,
  onStatusChange,
}: {
  order: OrderWithItems;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [expanded,      setExpanded]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [items,         setItems]         = useState<OrderItemRow[]>([]);
  const [fetchingItems, setFetchingItems] = useState(false);
  const hasFetched = useRef(false);

  const status = order.status as OrderStatus;
  const nextSt = NEXT_STATUS[status];

  // Al expandir por primera vez, carga items directamente de order_items
  useEffect(() => {
    if (!expanded || hasFetched.current) return;
    hasFetched.current = true;
    setFetchingItems(true);
    fetchItemsByOrderId(order.id).then(({ data }) => {
      setItems(data);
      setFetchingItems(false);
    });
  }, [expanded, order.id]);

  const handleAdvance = async () => {
    if (!nextSt) return;
    setLoading(true);
    await onStatusChange(order.id, nextSt);
    setLoading(false);
  };

  const handleCancel = async () => {
    setLoading(true);
    await onStatusChange(order.id, 'cancelled');
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            {order.order_number
              ? <span className="text-xs font-bold text-primary">#{order.order_number}</span>
              : <Hash className="w-4 h-4 text-primary" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {order.customer_name || 'Cliente'} — {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Recojo'}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {order.district ? ` · ${order.district}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <Badge className={`text-xs ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</Badge>
          <span className="font-bold text-primary text-sm">S/ {order.total.toFixed(2)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">

          {/* Productos */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Productos pedidos
            </p>
            {fetchingItems ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                Cargando...
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-1.5">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{item.product_name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>×{item.quantity}</span>
                      <span className="font-semibold text-foreground">
                        S/ {(item.subtotal ?? item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-primary">S/ {order.total.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Sin productos registrados en este pedido
              </p>
            )}
          </div>

          {/* Info cliente */}
          <div className="text-xs text-muted-foreground space-y-1">
            {order.address && <p>📍 {order.address}</p>}
            {order.customer_phone && <p>📞 {order.customer_phone}</p>}
            {order.payment_method && (
              <p>💳 {order.payment_method === 'card' ? 'Tarjeta' : 'Efectivo'}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2 flex-wrap pt-1">
            {nextSt && (
              <Button size="sm" onClick={handleAdvance} disabled={loading} className="gap-1.5">
                {loading
                  ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : NEXT_ICON[status]}
                {NEXT_LABEL[status]}
              </Button>
            )}
            {status !== 'delivered' && status !== 'cancelled' && (
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={loading}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="w-3.5 h-3.5" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Página Admin ──────────────────────────────────────────────────────────────

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin   = user?.role === 'admin';
  const isAllowed = user?.role === 'admin' || user?.role === 'delivery';

  const [orders,    setOrders]    = useState<OrderWithItems[]>([]);
  const [loadingO,  setLoadingO]  = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'inventario'>('pedidos');
  const [products,  setProducts]  = useState<ProductRow[]>([]);
  const [loadingP,  setLoadingP]  = useState(false);
  const [stockEdit, setStockEdit] = useState<Record<string, string>>({});
  const [savingStock, setSavingStock] = useState<Record<string, boolean>>({});
  const [searchProd, setSearchProd]   = useState('');

  useEffect(() => {
    if (user && !isAllowed) navigate('/');
  }, [user, isAllowed, navigate]);

  const loadOrders = useCallback(async () => {
    setLoadingO(true);
    const { data, error } = await fetchAllOrders();
    if (error) toast.error('Error al cargar pedidos');
    else setOrders(data);
    setLoadingO(false);
  }, []);

  const loadInventory = useCallback(async () => {
    setLoadingP(true);
    const { data, error } = await fetchProductsWithStock();
    if (error) toast.error('Error al cargar inventario');
    else setProducts(data);
    setLoadingP(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (activeTab === 'inventario' && isAdmin) loadInventory();
  }, [activeTab, isAdmin, loadInventory]);

  const handleStockSave = async (productId: string) => {
    const raw = stockEdit[productId];
    const newStock = parseInt(raw, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Ingresa un número válido');
      return;
    }
    setSavingStock(prev => ({ ...prev, [productId]: true }));
    const { error } = await updateProductStock(productId, newStock);
    setSavingStock(prev => ({ ...prev, [productId]: false }));
    if (error) {
      toast.error('Error al actualizar stock');
    } else {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      setStockEdit(prev => { const n = { ...prev }; delete n[productId]; return n; });
      toast.success('Stock actualizado');
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const { error } = await updateOrderStatus(orderId, status);
    if (error) {
      toast.error('Error al actualizar estado');
    } else {
      toast.success(`Estado actualizado: ${STATUS_LABELS[status]}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
  };

  if (!user) return null;

  // ── Vista DELIVERY ──────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Truck className="w-6 h-6 text-primary" />
                  <h1 className="font-display text-2xl font-bold">Panel de Delivery</h1>
                </div>
                <p className="text-muted-foreground text-sm">{user.name} — Repartidor</p>
              </div>
              <Button variant="outline" onClick={() => logout()} className="gap-2 text-sm">
                <LogOut className="w-4 h-4" />Cerrar Sesión
              </Button>
            </div>
          </motion.div>
          <DeliveryPanel
            orders={orders}
            loading={loadingO}
            onStatusChange={handleStatusChange}
            onRefresh={loadOrders}
          />
        </div>
      </div>
    );
  }

  // ── Vista ADMIN ─────────────────────────────────────────────────────────────

  const today       = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const pending     = orders.filter(o => o.status === 'pending').length;
  const preparing   = orders.filter(o => o.status === 'preparing').length;
  const inRoute     = orders.filter(o => o.status === 'sent').length;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProd.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(searchProd.toLowerCase()),
  );

  const lowStock  = products.filter(p => p.stock <= 5 && p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Panel de Administración</h1>
            <p className="text-muted-foreground text-sm">Administrador — {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={activeTab === 'pedidos' ? loadOrders : loadInventory}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />Actualizar
            </Button>
            <Button variant="outline" onClick={() => logout()} className="gap-2">
              <LogOut className="w-4 h-4" />Cerrar Sesión
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pedidos Hoy',    value: todayOrders.length, icon: Package,       color: 'text-primary' },
            { label: 'Pendientes',     value: pending,            icon: Clock,         color: 'text-yellow-600' },
            { label: 'En Preparación', value: preparing,          icon: RefreshCw,     color: 'text-blue-600' },
            { label: 'En Ruta',        value: inRoute,            icon: Truck,         color: 'text-indigo-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pedidos'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'inventario'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Inventario
            {outOfStock > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {outOfStock}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB: Pedidos ── */}
        {activeTab === 'pedidos' && (
          loadingO ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-semibold">No hay pedidos aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <AdminOrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )
        )}

        {/* ── TAB: Inventario ── */}
        {activeTab === 'inventario' && (
          <div>
            {/* Alertas de stock */}
            {(lowStock > 0 || outOfStock > 0) && (
              <div className="flex flex-wrap gap-3 mb-5">
                {outOfStock > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    {outOfStock} producto{outOfStock > 1 ? 's' : ''} sin stock
                  </div>
                )}
                {lowStock > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg px-3 py-2 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    {lowStock} con stock bajo (≤5)
                  </div>
                )}
              </div>
            )}

            {/* Buscador */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto o categoría..."
                value={searchProd}
                onChange={e => setSearchProd(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingP ? (
              <div className="flex items-center justify-center py-16">
                <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-card rounded-xl p-12 text-center border border-border">
                <Boxes className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-semibold">
                  {searchProd ? 'Sin resultados' : 'No hay productos'}
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  <span>Producto</span>
                  <span className="text-center w-20">Categoría</span>
                  <span className="text-center w-20">Stock actual</span>
                  <span className="text-center w-28">Actualizar</span>
                </div>
                <div className="divide-y divide-border">
                  {filteredProducts.map(product => {
                    const isEditing  = product.id in stockEdit;
                    const isSaving   = savingStock[product.id] ?? false;
                    const stockValue = isEditing ? stockEdit[product.id] : String(product.stock);
                    const isLow      = product.stock > 0 && product.stock <= 5;
                    const isEmpty    = product.stock === 0;

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"
                      >
                        {/* Nombre + imagen */}
                        <div className="flex items-center gap-3 min-w-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">S/ {product.price.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Categoría */}
                        <div className="w-20 text-center">
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {product.category ?? '—'}
                          </span>
                        </div>

                        {/* Stock badge */}
                        <div className="w-20 flex justify-center">
                          <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${
                            isEmpty  ? 'bg-red-100 text-red-700'
                            : isLow  ? 'bg-yellow-100 text-yellow-700'
                            :          'bg-green-100 text-green-700'
                          }`}>
                            {isEmpty && <XCircle className="w-3 h-3" />}
                            {isLow && !isEmpty && <TrendingDown className="w-3 h-3" />}
                            {product.stock}
                          </span>
                        </div>

                        {/* Input + guardar */}
                        <div className="w-28 flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-16 text-center text-sm px-1"
                            value={stockValue}
                            onChange={e =>
                              setStockEdit(prev => ({ ...prev, [product.id]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            className="h-8 px-2 text-xs"
                            disabled={!isEditing || isSaving}
                            onClick={() => handleStockSave(product.id)}
                          >
                            {isSaving
                              ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              : <CheckCircle className="w-3.5 h-3.5" />
                            }
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
