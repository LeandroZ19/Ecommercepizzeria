/**
 * MiCuenta — Perfil e historial de pedidos para clientes.
 * Admin y Delivery son redirigidos a /admin al entrar.
 */

import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { User, Package, LogOut, Edit, Mail, Phone, MapPin, Lock, Hash, ListOrdered } from 'lucide-react';
import { fetchQueuePosition } from '../../../utils/supabase/db';
import { toast } from 'sonner';

// ─── Mapa de seguimiento (cliente ve la ruta directamente) ───────────────────

const STORE_COORDS: [number, number] = [-12.1628, -76.9443];

function DeliveryMap({ address }: { address: string }) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const mapInst = useRef<unknown>(null);
  const [error, setError] = useState('');

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
          html: '<div style="background:#e25216;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.4)"></div>',
          className: '', iconSize: [14, 14], iconAnchor: [7, 7],
        });
        L.marker(STORE_COORDS, { icon: storeIcon }).addTo(map)
          .bindPopup('<b>🍕 RapiPizza</b><br>Av. Sucre 112, VMT').openPopup();

        L.marker(clientCoords).addTo(map)
          .bindPopup(`<b>📍 Tu dirección</b><br>${address}`);

        L.polyline([STORE_COORDS, clientCoords], {
          color: '#e25216', weight: 3, dashArray: '6 4',
        }).addTo(map);

      } catch {
        if (!destroyed) setError('No se pudo cargar el mapa');
      }
    }

    init();
    return () => {
      destroyed = true;
      if (mapInst.current) { (mapInst.current as { remove: () => void }).remove(); mapInst.current = null; }
    };
  }, [address]);

  if (error) {
    return (
      <div className="h-44 bg-muted rounded-xl flex items-center justify-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="relative mt-3">
      <div ref={mapRef} className="h-44 rounded-xl overflow-hidden border border-border" />
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> RapiPizza (origen)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Tu dirección (destino)</span>
      </div>
    </div>
  );
}

// ─── Timeline de seguimiento ──────────────────────────────────────────────────

const TIMELINE_STEPS = ['pending', 'preparing', 'sent', 'delivered'] as const;
const TIMELINE_LABELS: Record<string, string> = {
  pending: 'Recibido', preparing: 'Preparando', sent: 'En camino', delivered: 'Entregado',
};

function OrderTimeline({ status }: { status: string }) {
  const currentIdx = TIMELINE_STEPS.indexOf(status as typeof TIMELINE_STEPS[number]);
  return (
    <div className="flex items-center mt-4">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i < currentIdx, cur = i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                done ? 'bg-green-500 border-green-500 text-white' :
                cur  ? 'bg-primary border-primary text-white' :
                        'bg-background border-muted-foreground/30 text-muted-foreground'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${
                cur ? 'text-primary' : done ? 'text-green-600' : 'text-muted-foreground'
              }`}>{TIMELINE_LABELS[step]}</span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 ${done ? 'bg-green-400' : 'bg-muted-foreground/20'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tarjeta de pedido ────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', preparing: 'bg-blue-100 text-blue-800',
  sent: 'bg-indigo-100 text-indigo-800', delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
const STATUS_TEXT: Record<string, string> = {
  pending: 'Pendiente', preparing: 'En preparación', sent: 'En camino',
  delivered: 'Entregado', cancelled: 'Cancelado',
};

function OrderCard({ order }: { order: Order }) {
  const isCancelled = order.status === 'cancelled';
  const showMap     = order.status === 'sent' && order.delivery_type === 'delivery' && !!order.address;
  const isActive    = order.status === 'pending' || order.status === 'preparing';
  const [queuePos, setQueuePos] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive) return;
    fetchQueuePosition(order.id).then(({ position }) => setQueuePos(position));
  }, [order.id, isActive]);

  return (
    <div className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            {order.order_number ? (
              <span className="flex items-center gap-1 text-primary font-bold text-base">
                <Hash className="w-4 h-4" />{order.order_number}
              </span>
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(order.date).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
            {order.district ? ` · ${order.district}` : ''}
          </p>
          {isActive && queuePos !== null && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              <ListOrdered className="w-3.5 h-3.5" />
              Posición en cola: #{queuePos}
            </div>
          )}
        </div>
        <Badge className={`text-xs ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {STATUS_TEXT[order.status] ?? order.status}
        </Badge>
      </div>

      {!isCancelled && <OrderTimeline status={order.status} />}

      <div className="space-y-1.5 mt-4 mb-4">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
              {item.name} <span className="font-medium text-foreground">×{item.quantity}</span>
            </span>
            <span className="font-medium flex-shrink-0">S/ {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Recojo'}
          {order.delivery_fee ? ` · +S/ ${order.delivery_fee.toFixed(2)} envío` : ''}
        </div>
        <span className="font-bold text-primary">S/ {order.total.toFixed(2)}</span>
      </div>

      {/* Mapa siempre visible cuando está en camino */}
      {showMap && (
        <div className="mt-3">
          <p className="text-xs font-medium text-indigo-700 flex items-center gap-1 mb-1">
            🚚 Tu pedido está en camino — ruta desde la tienda hasta tu dirección:
          </p>
          <DeliveryMap address={order.address!} />
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MiCuenta() {
  const { user, login, register, logout, updateProfile, orders, refreshOrders } = useAuth();
  const navigate  = useNavigate();
  const [tab,        setTab]        = useState<'profile' | 'orders'>('profile');
  const [isEditing,  setIsEditing]  = useState(false);

  // Admin y Delivery → redirigir directamente al panel
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'delivery')) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'customer') refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [loginData,    setLoginData]    = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', phone: '', password: '' });
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [registeredEmail,   setRegisteredEmail]   = useState('');
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    if (user) setProfileData({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, error } = await login(loginData.email, loginData.password);
    if (ok) toast.success('¡Bienvenido de nuevo!');
    else toast.error(error ?? 'Credenciales incorrectas.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, error } = await register(registerData.name, registerData.email, registerData.password, registerData.phone);
    if (ok) {
      toast.success('¡Bienvenido a RapiPizza! 🍕');
      setNeedsConfirmation(false);
    } else {
      const msg = (error ?? 'No se pudo crear la cuenta').split('\n')[0];
      if (msg.toLowerCase().includes('confirma') || msg.toLowerCase().includes('verifica')) {
        setNeedsConfirmation(true); setRegisteredEmail(registerData.email);
      }
      toast.error(msg, { duration: 6000 });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name: profileData.name, phone: profileData.phone, address: profileData.address });
    setIsEditing(false);
    toast.success('Perfil guardado correctamente');
  };

  // ── Vista sin sesión ─────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="hidden md:block">
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <h1 className="font-display text-5xl font-bold mb-6">¡Bienvenido a<br />RapiPizza!</h1>
                <p className="text-lg text-muted-foreground mb-8">Crea tu cuenta o inicia sesión para disfrutar de:</p>
                <ul className="space-y-4">
                  {['Pedidos más rápidos y seguros', 'Historial de tus compras', 'Seguimiento en tiempo real', 'Ofertas exclusivas'].map((item, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary" /></div>
                      <span className="text-muted-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                  <TabsTrigger value="login"    className="rounded-none data-[state=active]:bg-background">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-none data-[state=active]:bg-background">Registrarse</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="p-8">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Email</Label>
                      <Input id="login-email" type="email" placeholder="tu@email.com" value={loginData.email}
                        onChange={e => setLoginData({ ...loginData, email: e.target.value })} required className="h-12 placeholder:text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Contraseña</Label>
                      <Input id="login-password" type="password" placeholder="••••••••" value={loginData.password}
                        onChange={e => setLoginData({ ...loginData, password: e.target.value })} required className="h-12 placeholder:text-muted-foreground/40" />
                    </div>
                    <Button type="submit" className="w-full h-12" size="lg">Iniciar Sesión</Button>
                    <p className="text-sm text-center text-muted-foreground">Ingresa el email y contraseña con los que te registraste</p>
                  </form>
                </TabsContent>
                <TabsContent value="register" className="p-8">
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name" className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Nombre Completo</Label>
                      <Input id="reg-name" placeholder="Juan Pérez" value={registerData.name}
                        onChange={e => setRegisterData({ ...registerData, name: e.target.value })} required className="h-12 placeholder:text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Email</Label>
                      <Input id="reg-email" type="email" placeholder="tu@email.com" value={registerData.email}
                        onChange={e => setRegisterData({ ...registerData, email: e.target.value })} required className="h-12 placeholder:text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone" className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Teléfono</Label>
                      <Input id="reg-phone" type="tel" placeholder="+51 999 888 777" value={registerData.phone}
                        onChange={e => setRegisterData({ ...registerData, phone: e.target.value })} required className="h-12 placeholder:text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Contraseña</Label>
                      <Input id="reg-password" type="password" placeholder="••••••••" value={registerData.password}
                        onChange={e => setRegisterData({ ...registerData, password: e.target.value })} required className="h-12 placeholder:text-muted-foreground/40" />
                    </div>
                    <Button type="submit" className="w-full h-12" size="lg">Crear Cuenta</Button>
                    {needsConfirmation && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                        <p className="font-semibold text-amber-800 mb-1">📧 Confirma tu email</p>
                        <p className="text-amber-700 text-xs">Se envió un correo a <strong>{registeredEmail}</strong>. Revisa tu bandeja de entrada.</p>
                      </div>
                    )}
                  </form>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Admin/Delivery son redirigidos por el useEffect de arriba — no renderizar nada mientras redirige
  if (user.role !== 'customer') return null;

  // ── Vista cliente ─────────────────────────────────────────────────────────────

  return (
    <div className="py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-6xl">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">Mi Cuenta</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Bienvenido, <span className="font-medium text-foreground">{user.name}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => logout()} className="gap-2 text-sm">
            <LogOut className="w-4 h-4" />Cerrar Sesión
          </Button>
        </motion.div>

        {/* Tabs — renderizado condicional directo, sin TabsContent */}
        <div className="w-full">
          {/* TabsList solo como navegación visual */}
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-6 md:mb-8 w-full md:w-auto">
            <button
              onClick={() => setTab('profile')}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-4 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 md:flex-none ${
                tab === 'profile' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </button>
            <button
              onClick={() => { setTab('orders'); refreshOrders(); }}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-4 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 md:flex-none ${
                tab === 'orders' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Mis Pedidos</span>
              {orders.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {orders.length}
                </span>
              )}
            </button>
          </div>

          {/* Perfil */}
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 md:p-8 shadow-md border border-border"
            >
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="font-display text-xl md:text-2xl font-bold">Información Personal</h2>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 text-sm">
                    <Edit className="w-4 h-4" /><span className="hidden md:inline">Editar</span>
                  </Button>
                )}
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4 md:space-y-6">
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name" className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Nombre Completo</Label>
                    <Input id="profile-name" value={profileData.name}
                      onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone" className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Teléfono</Label>
                    <Input id="profile-phone" value={profileData.phone}
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email" className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Email</Label>
                    <Input id="profile-email" type="email" value={profileData.email} disabled className="h-11 opacity-60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-address" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Dirección</Label>
                    <Input id="profile-address" value={profileData.address}
                      onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                      disabled={!isEditing} className="h-11" />
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button type="submit">Guardar Cambios</Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  </div>
                )}
              </form>
            </motion.div>
          )}

          {/* Mis Pedidos */}
          {tab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {orders.length === 0 ? (
                <div className="bg-card rounded-xl p-12 shadow-md border border-border text-center">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">No tienes pedidos aún</h3>
                  <p className="text-muted-foreground mb-6">¡Haz tu primer pedido y disfruta de nuestras pizzas!</p>
                  <Button asChild><Link to="/menu">Ver el menú</Link></Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, index) => (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <OrderCard order={order} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
