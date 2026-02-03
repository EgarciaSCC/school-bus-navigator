import React, { useState } from 'react';
import { Search, AlertTriangle, LogOut, Info, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import logoNCA from '@/assets/isotipo-NCA.png';
import UserInfoModal from './UserInfoModal';
import IncidentModal from './IncidentModal';

interface HomeHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  busPlate?: string;
  isPanelOpen?: boolean;
  onTogglePanel?: () => void;
  showPanelToggle?: boolean;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  searchQuery,
  onSearchChange,
  busPlate,
  isPanelOpen = false,
  onTogglePanel,
  showPanelToggle = false,
}) => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUserInfo = () => {
    setIsMenuOpen(false);
    setIsUserInfoOpen(true);
  };

  const handleReportIncident = () => {
    setIsMenuOpen(false);
    setIsIncidentOpen(true);
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setIsLogoutDialogOpen(true);
  };

  return (
    <>
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Search - Collapsible on mobile, always visible on desktop */}
          <div className={`flex items-center transition-all duration-200 ${isMobile && isSearchExpanded ? 'flex-1' : isMobile ? '' : 'flex-1 max-w-md'}`}>
            {isMobile ? (
              // Mobile: Collapsible search
              isSearchExpanded ? (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                  <Input
                    type="text"
                    placeholder="Buscar rutas, bus..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-3 h-9 bg-background border-border focus:border-primary"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery) {
                        setIsSearchExpanded(false);
                      }
                    }}
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchExpanded(true)}
                  className="text-accent hover:text-accent/80"
                >
                  <Search className="w-5 h-5" />
                </Button>
              )
            ) : (
              // Desktop/Tablet: Always visible search
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                <Input
                  type="text"
                  placeholder="Buscar rutas, bus, dirección..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 pr-3 h-10 bg-background border-border focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Logo - Center */}
          {(!isMobile || !isSearchExpanded) && (
            <div className={`${isMobile ? 'flex-1' : ''} flex justify-center`}>
              <img src={logoNCA} alt="NCA Logo" className="h-9 w-auto object-contain" />
            </div>
          )}

          {/* Right Section - Avatar and Panel Toggle */}
          <div className="flex items-center gap-2">
            {/* Panel Toggle Button - Only on Desktop/Tablet */}
            {showPanelToggle && onTogglePanel && !isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onTogglePanel}
                className="text-muted-foreground hover:text-foreground"
                title={isPanelOpen ? 'Ocultar panel' : 'Mostrar panel'}
              >
                {isPanelOpen ? (
                  <PanelRightClose className="w-5 h-5" />
                ) : (
                  <PanelRightOpen className="w-5 h-5" />
                )}
              </Button>
            )}

            {/* Avatar with Menu */}
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
              <PopoverContent 
                className="w-56 p-2" 
                align="end"
                sideOffset={8}
              >
                {/* User Quick Info */}
                <div className="px-2 py-2 mb-1">
                  <p className="font-semibold text-sm text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                
                <Separator className="my-1" />
                
                {/* Menu Items */}
                <div className="space-y-0.5">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 px-2 text-sm font-normal"
                    onClick={handleUserInfo}
                  >
                    <Info className="w-4 h-4 text-primary" />
                    Información del Usuario
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 px-2 text-sm font-normal"
                    onClick={handleReportIncident}
                  >
                    <AlertTriangle className="w-4 h-4 text-secondary" />
                    Reportar Novedad
                  </Button>
                  
                  <Separator className="my-1" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 px-2 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogoutClick}
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* User Info Modal */}
      <UserInfoModal
        open={isUserInfoOpen}
        onOpenChange={setIsUserInfoOpen}
        user={user}
        busPlate={busPlate}
      />

      {/* Incident Modal */}
      <IncidentModal
        open={isIncidentOpen}
        onOpenChange={setIsIncidentOpen}
      />

      {/* Logout Confirmation Dialog */}
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
    </>
  );
};

export default HomeHeader;
