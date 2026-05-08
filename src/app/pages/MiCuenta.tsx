import { motion } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { User, Package, LogOut, Edit } from 'lucide-react';
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginData.email, loginData.password);
    if (success) {
      toast.success('Sesión iniciada correctamente');
    } else {
      toast.error('Credenciales incorrectas');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register({
      name: registerData.name,
      email: registerData.email,
      phone: registerData.phone,
    });
    if (success) {
      toast.success('Cuenta creada correctamente');
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileData);
    setIsEditing(false);
    toast.success('Perfil actualizado correctamente');
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: any = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      delivered: 'Entregado',
    };
    return texts[status] || status;
  };

  if (!user) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="font-display text-4xl font-bold mb-2">
              Mi Cuenta
            </h1>
            <p className="text-muted-foreground">
              Inicia sesión o crea una cuenta para continuar
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="bg-card rounded-xl p-8 shadow-md border border-border">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Contraseña</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      Iniciar Sesión
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <div className="bg-card rounded-xl p-8 shadow-md border border-border">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-name">Nombre Completo</Label>
                      <Input
                        id="register-name"
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, name: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, email: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-phone">Teléfono</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, phone: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-password">Contraseña</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      Crear Cuenta
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">
              Mi Cuenta
            </h1>
            <p className="text-muted-foreground">
              Bienvenido, {user.name}
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </motion.div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Mis Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-8 shadow-md border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl font-bold">
                  Información Personal
                </h2>
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile-name">Nombre Completo</Label>
                    <Input
                      id="profile-name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-phone">Teléfono</Label>
                    <Input
                      id="profile-phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-address">Dirección</Label>
                    <Input
                      id="profile-address"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-1"
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
