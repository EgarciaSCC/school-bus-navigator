import React, { useState } from 'react';
import {
  AlertTriangle,
  XCircle,
  Wrench,
  CheckCircle,
  Flag,
  Play,
  Plus,
  X,
  CloudRain,
  MessageSquare,
} from 'lucide-react';
import { IncidentType } from '@/types/route';

interface ActionBarProps {
  routeStatus: 'not_started' | 'in_progress' | 'completed';
  onStartRoute: () => void;
  onReportIncident: (type: IncidentType) => void;
  onCompleteStop: () => void;
  onFinishRoute: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  routeStatus,
  onStartRoute,
  onReportIncident,
  onCompleteStop,
  onFinishRoute,
}) => {
  const [showIncidentMenu, setShowIncidentMenu] = useState(false);

  if (routeStatus === 'not_started') {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={onStartRoute}
          className="btn-primary text-lg px-8 py-4 animate-bounce-soft"
        >
          <Play className="w-6 h-6" />
          Iniciar Ruta
        </button>
      </div>
    );
  }

  if (routeStatus === 'completed') {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="panel-card p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <span className="font-bold text-lg">¡Ruta Completada!</span>
        </div>
      </div>
    );
  }

  const incidentOptions = [
    { type: 'high_traffic' as IncidentType, icon: AlertTriangle, label: 'Tráfico Alto', bgClass: 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200' },
    { type: 'road_closed' as IncidentType, icon: XCircle, label: 'Vía Cerrada', bgClass: 'bg-red-100 text-red-900 hover:bg-red-200' },
    { type: 'breakdown' as IncidentType, icon: Wrench, label: 'Bus Averiado', bgClass: 'bg-gray-100 text-gray-900 hover:bg-gray-200' },
    { type: 'weather' as IncidentType, icon: CloudRain, label: 'Clima Adverso', bgClass: 'bg-blue-100 text-blue-900 hover:bg-blue-200' },
    { type: 'custom' as IncidentType, icon: MessageSquare, label: 'Personalizada', bgClass: 'bg-purple-100 text-purple-900 hover:bg-purple-200' },
  ];

  return (
    <>
      {/* Main Action Buttons Container */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-md px-4">
        <div className="panel-card p-3">
          <div className="flex items-center gap-3">
            {/* Complete Stop */}
            <button
              onClick={onCompleteStop}
              className="btn-success shrink-0"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Completar Parada</span>
            </button>

            <div className="w-px h-8 bg-border shrink-0" />

            {/* Finish Route */}
            <button
              onClick={onFinishRoute}
              className="btn-danger shrink-0"
            >
              <Flag className="w-5 h-5" />
              <span className="hidden sm:inline">Finalizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Incident Button - Independent */}
      <div className="absolute bottom-4 right-4 z-20">
        <button
          onClick={() => setShowIncidentMenu(!showIncidentMenu)}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center
            shadow-lg transition-all duration-200
            ${showIncidentMenu 
              ? 'bg-red-500 text-white rotate-45' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'}
          `}
        >
          {showIncidentMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>

        {/* Incident Menu Popup */}
        {showIncidentMenu && (
          <div className="absolute bottom-16 right-0 z-50 bg-card rounded-xl shadow-2xl border border-border p-2 min-w-[180px] animate-in slide-in-from-bottom-2 duration-200">
            <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
              Reportar Novedad
            </p>
            {incidentOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => {
                  onReportIncident(option.type);
                  setShowIncidentMenu(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
                  text-sm font-medium transition-colors mb-1 last:mb-0 ${option.bgClass}
                `}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ActionBar;
