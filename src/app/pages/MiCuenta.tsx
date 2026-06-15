/**
 * MiCuenta — Perfil de usuario, historial de pedidos y configuración.
 *
 * Flujos soportados:
 * - Sin sesión: formularios de login y registro
 * - Con sesión: perfil editable, historial de pedidos y opción de logout
 *
 * Requiere AuthContext para gestión de estado de autenticación.
 * Responsivo con layout en columna única para móvil.
 */

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { User, Package, LogOut, Edit, Mail, Phone, MapPin, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function MiCuenta() {
  const { user, login, register, logout, updateProfile, orders } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  // Sync profileData with user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginData.email, loginData.password);
    if (success) {
      toast.success('¡Bienvenido de nuevo!');
    } else {
      toast.error('Credenciales incorrectas');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(
      registerData.name,
      registerData.email,
      registerData.password,
    );
    if (success) {
      toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
    } else {
      toast.error('No se pudo crear la cuenta. ¿Ya tienes una cuenta con ese email?');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileData);
    setIsEditing(false);
    toast.success('Perfil actualizado correctamente');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending:   'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      sent:      'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      confirmed: 'bg-blue-100 text-blue-800',
    };
    return variants[status] ?? 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending:   'Pendiente',
      preparing: 'En preparación',
      sent:      'En camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      confirmed: 'Confirmado',
    };
    return texts[status] ?? status;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            {/* Left Side - Branding */}
            <div className="hidden md:block">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="font-display text-5xl font-bold mb-6">
                  ¡Bienvenido a<br />RapiPizza!
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Crea tu cuenta o inicia sesión para disfrutar de:
                </p>
                <ul className="space-y-4">
                  {[
                    'Pedidos más rápidos y seguros',
                    'Historial de tus compras',
                    'Direcciones guardadas',
                    'Ofertas exclusivas',
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Right Side - Forms */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                  <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-background">
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-none data-[state=active]:bg-background">
                    Registrarse
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="p-8">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Contraseña
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12" size="lg">
                      Iniciar Sesión
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      Usa cualquier email y contraseña para acceder
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="p-8">
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Nombre Completo
                      </Label>
                      <Input
                        id="register-name"
                        placeholder="Juan Pérez"
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, name: e.target.value })
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        Email
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, email: e.target.value })
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        Teléfono
                      </Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="+51 999 888 777"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, phone: e.target.value })
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Contraseña
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12" size="lg">
                      Crear Cuenta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Mi Cuenta
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Bienvenido, <span className="font-medium text-foreground">{user.name}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => logout()} className="gap-2 text-sm">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </motion.div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 md:mb-8 w-full md:w-auto">
            <TabsTrigger value="profile" className="gap-2 flex-1 md:flex-none">
              <User className="w-4 h-4" />
              <span className="text-sm md:text-base">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 flex-1 md:flex-none">
              <Package className="w-4 h-4" />
              <span className="text-sm md:text-base">Mis Pedidos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 md:p-8 shadow-md border border-border"
            >
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="font-display text-xl md:text-2xl font-bold">
                  Información Personal
                </h2>
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden md:inline">Editar</span>
                  </Button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 md:space-y-6">
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Nombre Completo
                    </Label>
                    <Input
                      id="profile-name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Teléfono
                    </Label>
                    <Input
                      id="profile-phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      disabled={!isEditing}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Dirección
                    </Label>
                    <Input
                      id="profile-address"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address: e.target.value })
                      }
                      disabled={!isEditing}
                      className="h-11"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button type="submit">
                      Guardar Cambios
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </form>
            </motion.div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-card rounded-xl p-12 shadow-md border border-border text-center">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">
                    No tienes pedidos aún
                  </h3>
                  <p className="text-muted-foreground">
                    ¡Haz tu primer pedido y disfruta de nuestras pizzas!
                  </p>
                </div>
              ) : (
                orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl p-6 shadow-md border border-border"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-display text-xl font-bold mb-1">
                          Pedido #{order.id}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date).toLocaleDateString('es-PE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge className={getStatusBadge(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            S/ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-border flex justify-between items-center">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-xl text-primary">
                        S/ {order.total.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
