import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  MapPin, 
  Users, 
  Gauge, 
  Route, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  Loader2,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RouteReport } from '@/types/routeReport';

interface RouteReportModalProps {
  open: boolean;
  onClose: () => void;
  report: RouteReport | null;
  onSubmit: (report: RouteReport) => Promise<boolean>;
}

const RouteReportModal: React.FC<RouteReportModalProps> = ({
  open,
  onClose,
  report,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!report) return null;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit(report);
      if (success) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Reporte de Ruta
          </DialogTitle>
        </DialogHeader>

        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-center">¡Reporte Enviado!</h3>
            <p className="text-sm text-muted-foreground text-center">
              El reporte ha sido enviado exitosamente al sistema.
            </p>
            <Button onClick={handleClose} className="mt-4">
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Route Info Header */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-lg">{report.routeName}</h3>
              <p className="text-sm text-muted-foreground">
                {report.direction === 'outbound' ? 'Ruta de Ida' : 'Ruta de Regreso'}
              </p>
            </div>

            {/* Time Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Inicio</p>
                <p className="font-semibold">{formatTime(report.startTime)}</p>
              </div>
              <div className="bg-card border rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Fin</p>
                <p className="font-semibold">{formatTime(report.endTime)}</p>
              </div>
              <div className="bg-card border rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Duración</p>
                <p className="font-semibold">{formatDuration(report.totalDurationMinutes)}</p>
              </div>
            </div>

            {/* Distance & Speed */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Velocidad y Distancia
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Route className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Distancia</span>
                  </div>
                  <p className="text-xl font-bold">{report.totalDistanceKm} km</p>
                </div>
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Vel. Promedio</span>
                  </div>
                  <p className="text-xl font-bold">{report.averageSpeedKmh} km/h</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground px-1">
                <span>Vel. Mínima: {report.minSpeedKmh} km/h</span>
                <span>Vel. Máxima: {report.maxSpeedKmh} km/h</span>
              </div>
            </div>

            {/* Stops */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Paradas
              </h4>
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completadas</span>
                  <span className="font-semibold">
                    {report.stopsCompleted} / {report.totalStops}
                  </span>
                </div>
              </div>
            </div>

            {/* Students */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Estudiantes
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {report.studentsPicked}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">Recogidos</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {report.studentsDropped}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">Dejados</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                  <XCircle className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                  <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                    {report.studentsAbsent}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">Ausentes</p>
                </div>
              </div>
            </div>

            {/* Incidents */}
            {report.incidentsReported > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-700 dark:text-orange-400">
                    {report.incidentsReported} incidente(s) reportado(s)
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RouteReportModal;
