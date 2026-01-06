import React from 'react';
import {
  AlertTriangle,
  XCircle,
  GitBranch,
  Wrench,
  CheckCircle,
  UserPlus,
  UserMinus,
  Flag,
  Play,
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

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-4xl w-full px-4">
      <div className="panel-card p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Primary Actions */}
          <button
            onClick={onCompleteStop}
            className="btn-success shrink-0"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Completar Parada</span>
          </button>
          
          <button
            onClick={() => onReportIncident('student_picked')}
            className="btn-primary shrink-0"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Recogido</span>
          </button>
          
          <button
            onClick={() => onReportIncident('student_dropped')}
            className="btn-secondary shrink-0"
          >
            <UserMinus className="w-5 h-5" />
            <span className="hidden sm:inline">Dejado</span>
          </button>

          <div className="w-px h-8 bg-border mx-1 shrink-0" />

          {/* Incident Reports */}
          <button
            onClick={() => onReportIncident('high_traffic')}
            className="btn-action bg-yellow-100 text-yellow-900 hover:bg-yellow-200 shrink-0"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="hidden md:inline">Tráfico</span>
          </button>
          
          <button
            onClick={() => onReportIncident('road_closed')}
            className="btn-action bg-red-100 text-red-900 hover:bg-red-200 shrink-0"
          >
            <XCircle className="w-5 h-5" />
            <span className="hidden md:inline">Vía Cerrada</span>
          </button>
          
          <button
            onClick={() => onReportIncident('forced_detour')}
            className="btn-action bg-purple-100 text-purple-900 hover:bg-purple-200 shrink-0"
          >
            <GitBranch className="w-5 h-5" />
            <span className="hidden md:inline">Desvío</span>
          </button>
          
          <button
            onClick={() => onReportIncident('breakdown')}
            className="btn-action bg-grey-100 text-grey-900 hover:bg-grey-200 shrink-0"
          >
            <Wrench className="w-5 h-5" />
            <span className="hidden md:inline">Avería</span>
          </button>

          <div className="w-px h-8 bg-border mx-1 shrink-0" />

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
  );
};

export default ActionBar;
