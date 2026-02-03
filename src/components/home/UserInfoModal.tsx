import React from 'react';
import { User, Mail, Shield, Bus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AuthUser } from '@/services/authService';

interface UserInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
  busPlate?: string;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({
  open,
  onOpenChange,
  user,
  busPlate,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      driver: 'Conductor',
      admin: 'Administrador',
      parent: 'Padre/Tutor',
    };
    return roles[role] || role;
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'driver':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <Avatar className="h-20 w-20 mb-2 ring-4 ring-primary/20">
            <AvatarImage src="" alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-xl">{user.name}</DialogTitle>
          <DialogDescription className="flex items-center justify-center gap-2">
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Username */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Usuario</p>
              <p className="font-medium truncate">{user.username}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Correo Electrónico</p>
              <p className="font-medium truncate">{user.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Rol</p>
              <p className="font-medium">{getRoleLabel(user.role)}</p>
            </div>
          </div>

          {/* Bus Assigned - Only for drivers */}
          {user.role === 'driver' && (
            <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-secondary/30">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/30">
                <Bus className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Bus Asignado</p>
                <p className="font-bold text-lg">{busPlate || 'Sin asignar'}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserInfoModal;
