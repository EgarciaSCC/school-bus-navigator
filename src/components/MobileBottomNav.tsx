import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bus, CreditCard, UserPlus, UtensilsCrossed, Home as HomeIcon, LifeBuoy } from 'lucide-react';

const navItems = [
  { icon: UserPlus, label: 'Admisiones', path: '/admisiones', color: '#FC4554' },
  { icon: CreditCard, label: 'Pagos', path: '/pagos', color: '#FC4554' },
  { icon: HomeIcon, label: 'Inicio', path: '/', color: undefined },
  { icon: Bus, label: 'Rutas', path: '/rutas', color: '#610CF4' },
  { icon: UtensilsCrossed, label: 'Cafetería', path: '/cafeteria', color: '#610CF4' },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl active:scale-95 transition-all ${
                  isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={isActive && item.color ? { backgroundColor: `${item.color}15` } : isActive ? { backgroundColor: 'hsl(var(--primary) / 0.1)' } : undefined}
                >
                  <Icon
                    className="w-5 h-5"
                    style={item.color ? { color: isActive ? item.color : `${item.color}99` } : undefined}
                  />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
