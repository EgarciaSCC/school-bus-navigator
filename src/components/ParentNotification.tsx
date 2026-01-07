import React, { useEffect, useState } from 'react';
import { Bell, Users, Clock, MapPin, X, Check } from 'lucide-react';

interface ParentNotificationProps {
  stopName: string;
  distance: number;
  etaMinutes: number;
  studentCount: number;
  onClose: () => void;
}

const ParentNotification: React.FC<ParentNotificationProps> = ({
  stopName,
  distance,
  etaMinutes,
  studentCount,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSending, setIsSending] = useState(true);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
    
    // Simulate sending notification
    const sendTimer = setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
    }, 1500);

    // Auto-close after 8 seconds
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 8000);

    return () => {
      clearTimeout(sendTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatETA = (minutes: number): string => {
    if (minutes < 1) return '<1 min';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
    return `${minutes} min`;
  };

  return (
    <div
      className={`fixed top-20 right-4 z-50 max-w-sm transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-grey-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-purple-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Bell className="w-5 h-5" />
            <span className="font-semibold">Notificación a Padres</span>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-grey-600">Enviando notificación...</span>
              </>
            ) : isSent ? (
              <>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-green-600 font-medium">¡Notificación enviada!</span>
              </>
            ) : null}
          </div>

          {/* Stop info */}
          <div className="bg-grey-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-semibold text-grey-800">{stopName}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-grey-600">
                <Clock className="w-4 h-4" />
                <span>Llegada en:</span>
              </div>
              <span className="font-bold text-primary">{formatETA(etaMinutes)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-grey-600">
                <MapPin className="w-4 h-4" />
                <span>Distancia:</span>
              </div>
              <span className="font-medium text-grey-800">{formatDistance(distance)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-grey-600">
                <Users className="w-4 h-4" />
                <span>Padres notificados:</span>
              </div>
              <span className="font-medium text-grey-800">{studentCount}</span>
            </div>
          </div>

          {/* Message preview */}
          <div className="text-xs text-grey-500 italic border-l-2 border-primary/30 pl-3">
            "El bus escolar llegará a <strong>{stopName}</strong> en aproximadamente <strong>{formatETA(etaMinutes)}</strong>. Por favor prepara a tu hijo/a."
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentNotification;
