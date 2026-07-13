/**
 * Admin — Panel de administración para roles admin y delivery.
 * - Pestaña "Pedidos": gestión de todos los pedidos con cambio de estado
 * - Pestaña "Inventario": edición de stock por producto (solo admin)
 * Redirige a / si el usuario no tiene rol admin o delivery.
 */

import { motion } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fetchAllOrders, updateOrderStatus, fetchProductsWithStock, updateProductStock } from '../../../utils/supabase/db';
import type { OrderWithItems, ProductRow } from '../../../utils/supabase/db';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Package,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Hash,
  Boxes,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Status helpers ───────────────────────────────────────────────────────────

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

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending:   'preparing',
  preparing: 'sent',
  sent:      'delivered',
  delivered: null,
  cancelled: null,
};

const NEXT_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   'Marcar en preparación',
  preparing: 'Marcar en camino',
  sent:      'Marcar entregado',
  delivered: '',
  cancelled: '',
};

// ─── Tarjeta de pedido ────────────────────────────────────────────────────────

function OrderCard({
  order,
  isAdmin,
  onStatusChange,
}: {
  order: OrderWithItems;
  isAdmin: boolean;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const status   = order.status as OrderStatus;
  const nextSt   = NEXT_STATUS[status];

  const handleAdvance = async () => {
    if (!nextSt) return;
    setLoading(true);
    await onStatusChange(order.id, nextSt);
    setLoading(false);
  };

  const handleCancel = async () => {
    if (status === 'delivered' || status === 'cancelled') return;
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
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            {order.order_number ? (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">#{order.order_number}</span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Hash className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {order.customer_name || 'Cliente'} — {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Recojo'}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString('es-PE', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
              {order.district ? ` · ${order.district}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge className={`text-xs ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </Badge>
          <span className="font-bold text-primary text-sm">S/ {order.total.toFixed(2)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          {/* Items */}
          <div className="space-y-1.5">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.product_name} <span className="font-medium text-foreground">×{item.quantity}</span>
                </span>
                <span>S/ {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Info adicional */}
          {order.address && (
            <p className="text-xs text-muted-foreground">📍 {order.address}</p>
          )}
          {order.customer_phone && (
            <p className="text-xs text-muted-foreground">📞 {order.customer_phone}</p>
          )}

          {/* Acciones */}
          <div className="flex gap-2 flex-wrap">
            {nextSt && (
              <Button
                size="sm"
                onClick={handleAdvance}
                disabled={loading}
                className="gap-1.5"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  {
                    preparing: <Clock className="w-3.5 h-3.5" />,
                    sent:      <Truck className="w-3.5 h-3.5" />,
                    delivered: <CheckCircle className="w-3.5 h-3.5" />,
                  }[nextSt] ?? null
                )}
                {NEXT_STATUS_LABELS[status]}
              </Button>
            )}
            {isAdmin && status !== 'delivered' && status !== 'cancelled' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              >
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

// ─── Página Admin ─────────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const isAdmin    = user?.role === 'admin';
  const isAllowed  = user?.role === 'admin' || user?.role === 'delivery';

  const [orders,   setOrders]   = useState<OrderWithItems[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingO, setLoadingO] = useState(true);
  const [loadingP, setLoadingP] = useState(false);
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});

  // Guard de rol
  useEffect(() => {
    if (user && !isAllowed) {
      navigate('/');
    }
  }, [user, isAllowed, navigate]);

  const loadOrders = useCallback(async () => {
    setLoadingO(true);
    const { data, error } = await fetchAllOrders();
    if (error) {
      toast.error('Error al cargar pedidos');
    } else {
      setOrders(data);
    }
    setLoadingO(false);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadingP(true);
    const { data, error } = await fetchProductsWithStock();
    if (error) {
      toast.error('Error al cargar productos');
    } else {
      setProducts(data);
      const initial: Record<string, string> = {};
      data.forEach(p => { initial[p.id] = String(p.stock); });
      setStockEdits(initial);
    }
    setLoadingP(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const { error } = await updateOrderStatus(orderId, status);
    if (error) {
      toast.error('Error al actualizar estado');
    } else {
      toast.success(`Estado actualizado: ${STATUS_LABELS[status]}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
  };

  const handleStockSave = async (productId: string) => {
    const newStock = parseInt(stockEdits[productId] ?? '0', 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Stock inválido');
      return;
    }
    const { error } = await updateProductStock(productId, newStock);
    if (error) {
      toast.error('Error al actualizar stock');
    } else {
      toast.success('Stock actualizado');
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    }
  };

  // Stats
  const today     = new Date().toDateString();
  const todayOrders    = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const pending        = orders.filter(o => o.status === 'pending').length;
  const preparing      = orders.filter(o => o.status === 'preparing').length;
  const lowStock       = products.filter(p => p.stock <= 10).length;

  if (!user) return null;

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Panel de Administración</h1>
            <p className="text-muted-foreground text-sm">
              {isAdmin ? 'Administrador' : 'Delivery'} — {user.name}
            </p>
          </div>
          <Button variant="outline" onClick={loadOrders} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pedidos Hoy',       value: todayOrders.length, icon: Package,      color: 'text-primary' },
            { label: 'Pendientes',         value: pending,            icon: Clock,        color: 'text-yellow-600' },
            { label: 'En Preparación',     value: preparing,          icon: RefreshCw,    color: 'text-blue-600' },
            { label: 'Stock Bajo',         value: lowStock,           icon: Boxes,        color: 'text-red-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" onValueChange={(v) => { if (v === 'inventory') loadProducts(); }}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Pedidos
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="inventory" className="gap-2">
                <Boxes className="w-4 h-4" />
                Inventario
              </TabsTrigger>
            )}
          </TabsList>

          {/* Pedidos */}
          <TabsContent value="orders">
            {loadingO ? (
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
                  <OrderCard
                    key={order.id}
                    order={order}
                    isAdmin={isAdmin}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Inventario */}
          {isAdmin && (
            <TabsContent value="inventory">
              {loadingP ? (
                <div className="flex items-center justify-center py-16">
                  <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-4 font-semibold">Producto</th>
                        <th className="text-left p-4 font-semibold hidden md:table-cell">Categoría</th>
                        <th className="text-center p-4 font-semibold">Stock</th>
                        <th className="text-center p-4 font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, i) => {
                        const currentStock = parseInt(stockEdits[product.id] ?? String(product.stock), 10);
                        const stockColor   = currentStock === 0
                          ? 'text-red-600'
                          : currentStock <= 10
                          ? 'text-orange-500'
                          : 'text-green-600';

                        return (
                          <tr
                            key={product.id}
                            className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {product.image && (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <span className="font-medium line-clamp-2">{product.name}</span>
                              </div>
                            </td>
                            <td className="p-4 hidden md:table-cell text-muted-foreground capitalize">
                              {product.category ?? '—'}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={stockEdits[product.id] ?? String(product.stock)}
                                  onChange={(e) =>
                                    setStockEdits(prev => ({ ...prev, [product.id]: e.target.value }))
                                  }
                                  className={`w-20 text-center font-bold ${stockColor}`}
                                />
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStockSave(product.id)}
                              >
                                Guardar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
