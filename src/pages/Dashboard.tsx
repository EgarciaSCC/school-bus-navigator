import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, CreditCard, UserPlus, UtensilsCrossed, LayoutDashboard, LifeBuoy, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import logoNCA from '@/assets/isotipo-NCA.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, Info } from 'lucide-react';

const modules = [
  {
    id: 'admisiones',
    label: 'Admisiones',
    icon: UserPlus,
    path: '/admisiones',
    color: 'from-[#FC4554] to-[#d93a48]',
    iconBg: 'bg-[#FC4554]/15',
    available: false,
  },
  {
    id: 'pagos',
    label: 'Pagos',
    icon: CreditCard,
    path: '/pagos',
    color: 'from-[#FC4554] to-[#d93a48]',
    iconBg: 'bg-[#FC4554]/15',
    available: false,
  },
  {
    id: 'rutas',
    label: 'Rutas',
    icon: Bus,
    path: '/rutas',
    color: 'from-[#610CF4] to-[#4e09c4]',
    iconBg: 'bg-[#610CF4]/15',
    available: true,
  },
  {
    id: 'cafeteria',
    label: 'Cafetería',
    icon: UtensilsCrossed,
    path: '/cafeteria',
    color: 'from-[#610CF4] to-[#4e09c4]',
    iconBg: 'bg-[#610CF4]/15',
    available: false,
  },
  {
    id: 'tablero',
    label: 'Tablero',
    icon: LayoutDashboard,
    path: '/tablero',
    color: 'from-[#FFD464] to-[#e6be56]',
    iconBg: 'bg-[#FFD464]/15',
    available: false,
  },
  {
    id: 'soporte',
    label: 'Soporte',
    icon: LifeBuoy,
    path: '/soporte',
    color: 'from-[#3B82F6] to-[#2563EB]',
    iconBg: 'bg-[#3B82F6]/15',
    available: true,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = React.useState(false);

  const bottomNavItems = [
    { icon: UserPlus, label: 'Admisiones', path: '/admisiones', color: '#FC4554' },
    { icon: CreditCard, label: 'Pagos', path: '/pagos', color: '#FC4554' },
    { icon: HomeIcon, label: 'Inicio', path: '/', color: undefined, isHome: true },
    { icon: Bus, label: 'Rutas', path: '/rutas', color: '#610CF4' },
    { icon: UtensilsCrossed, label: 'Cafetería', path: '/cafeteria', color: '#610CF4' },
  ];

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleModuleClick = (mod: typeof modules[0]) => {
    if (mod.available) {
      navigate(mod.path);
    }
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex justify-center">
            <img src={logoNCA} alt="NCA Logo" className="h-10 w-auto object-contain cursor-pointer" onClick={() => navigate('/')} />
          </div>
          <div className="flex-1 flex justify-end">
            <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <PopoverTrigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end" sideOffset={8}>
                <div className="px-2 py-2 mb-1">
                  <p className="font-semibold text-sm text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Separator className="my-1" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 px-2 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { setIsMenuOpen(false); setIsLogoutDialogOpen(true); }}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            ¡Hola, {user?.name?.split(' ')[0] || 'Usuario'}!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            ¿Qué deseas hacer hoy?
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-lg sm:max-w-2xl">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod)}
                disabled={!mod.available}
                className={`
                  group relative flex flex-col items-center justify-center gap-3
                  rounded-2xl p-6 sm:p-8
                  bg-card border border-border
                  shadow-sm hover:shadow-lg
                  transition-all duration-200 ease-out
                  ${mod.available 
                    ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98] hover:border-primary/40' 
                    : 'cursor-not-allowed opacity-50'}
                `}
              >
                <div className={`
                  w-14 h-14 sm:w-16 sm:h-16 rounded-xl
                  bg-gradient-to-br ${mod.color}
                  flex items-center justify-center
                  shadow-md
                  transition-transform duration-200
                  group-hover:scale-110
                `}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={1.8} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-foreground">
                  {mod.label}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {/* Logout Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrará tu sesión actual y deberás iniciar sesión nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => logout()}>Cerrar Sesión</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          {/* Floating Support Button */}
          <button
            onClick={() => navigate('/soporte')}
            className="fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-lg shadow-[#3B82F6]/30 flex items-center justify-center active:scale-95 transition-transform"
          >
            <LifeBuoy className="w-6 h-6 text-white" />
          </button>

          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
            <div className="flex items-center justify-around py-1.5 px-2">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const isHome = 'isHome' in item && item.isHome;
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl active:scale-95 transition-all ${
                      isHome ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg ${isHome ? 'bg-primary/10' : ''}`}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={!isHome && item.color ? { color: item.color } : undefined}
                      />
                    </div>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  );
};

export default Dashboard;
