import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle, Bus } from 'lucide-react';
import isotipoNCA from '@/assets/isotipo-NCA.png';
import { testAESEncryption } from '@/config/auth';

const Login: React.FC = () => {
  // Run AES encryption test on component mount
  useEffect(() => {
    console.log('🔐 Testing AES-256-CBC Encryption...');
    const result = testAESEncryption();
    console.log('Test result:', result);
  }, []);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setShowErrors(true);
      return;
    }
    
    const result = await login(username, password);
    
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-red-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900 to-red-700 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <img src={isotipoNCA} alt="NCA Transport" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">NCA App</h1>
            <p className="text-white/80 text-sm mt-1">Sistema de Gestión Académica</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/*<div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                <Bus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Inicio de Sesión - Conductor</span>
              </div>
            </div>*/}
          

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setShowErrors(false);
                    setError('');
                  }}
                  className={`pl-10 h-12 ${showErrors && !username.trim() ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
                  autoComplete="username"
                />
              </div>
              {showErrors && !username.trim() && (
                <p className="text-xs text-destructive">El usuario es requerido</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setShowErrors(false);
                    setError('');
                  }}
                  className={`pl-10 pr-12 h-12 ${showErrors && !password.trim() ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {showErrors && !password.trim() && (
                <p className="text-xs text-destructive">La contraseña es requerida</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </Button>

            {/* Demo credentials hint 
            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Credenciales de prueba: <span className="font-medium text-foreground">driver</span> / <span className="font-medium text-foreground">Driver.1234</span>
              </p>
            </div>*/}
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2024 NCA Apps. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
