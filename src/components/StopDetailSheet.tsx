import React, { useState } from 'react';
import { MapPin, Users, CheckCircle, UserPlus, UserMinus, X, UserX, AlertCircle, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Stop, Student } from '@/types/route';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StopDetailSheetProps {
  stop: Stop | null;
  open: boolean;
  onClose: () => void;
  onStudentAction: (student: Student, action: 'picked' | 'dropped' | 'absent') => void;
  routeDirection: 'outbound' | 'return';
  onCompleteStop?: () => void;
  canCompleteStop?: boolean;
  busLocation?: [number, number] | null;
}

// Calculate distance between two coordinates in km using Haversine formula
const calculateDistanceKm = (
  coord1: [number, number],
  coord2: [number, number]
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const lat1 = (coord1[1] * Math.PI) / 180;
  const lat2 = (coord2[1] * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const StopDetailSheet: React.FC<StopDetailSheetProps> = ({
  stop,
  open,
  onClose,
  onStudentAction,
  routeDirection,
  onCompleteStop,
  canCompleteStop = false,
  busLocation,
}) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ student: Student; action: 'picked' | 'dropped' | 'absent' } | null>(null);
  const [distanceToStop, setDistanceToStop] = useState<number>(0);
  if (!stop) return null;

  // Check if all students have been processed (picked/dropped/absent)
  const allStudentsProcessed = stop.students.length === 0 || 
    stop.students.every(s => 
      routeDirection === 'outbound' 
        ? s.status === 'picked' || s.status === 'absent'
        : s.status === 'dropped' || s.status === 'absent'
    );

  const pendingStudentsCount = stop.students.filter(s => s.status === 'waiting').length;

  // Handle student action with distance check
  const handleStudentAction = (student: Student, action: 'picked' | 'dropped' | 'absent') => {
    // Only check distance for 'picked' or 'dropped' actions (not 'absent')
    if ((action === 'picked' || action === 'dropped') && busLocation && stop.coordinates) {
      const distance = calculateDistanceKm(busLocation, stop.coordinates);
      
      if (distance > 1) {
        setDistanceToStop(distance);
        setPendingAction({ student, action });
        setConfirmDialogOpen(true);
        return;
      }
    }
    
    // Execute action directly if no confirmation needed
    onStudentAction(student, action);
  };

  const confirmPendingAction = () => {
    if (pendingAction) {
      onStudentAction(pendingAction.student, pendingAction.action);
      setPendingAction(null);
    }
    setConfirmDialogOpen(false);
  };

  const cancelPendingAction = () => {
    setPendingAction(null);
    setConfirmDialogOpen(false);
  };

  return (
    <>
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Ubicación distante
            </AlertDialogTitle>
            <AlertDialogDescription>
              Te encuentras a <strong>{distanceToStop.toFixed(2)} km</strong> de la parada original del estudiante.
              <br /><br />
              ¿Deseas confirmar esta acción de todos modos?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPendingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0">
          <SheetHeader className="p-6 bg-gradient-to-r from-purple-900 to-red-700">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-white text-xl">{stop.name}</SheetTitle>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm mt-2">
            <MapPin className="w-4 h-4" />
            <span>{stop.address}</span>
          </div>
        </SheetHeader>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">
              Estudiantes ({stop.students.length})
            </h3>
          </div>

          {stop.students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No hay estudiantes en esta parada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stop.students.map((student) => (
                <div
                  key={student.id}
                  className={`
                    flex items-center justify-between p-4 rounded-xl border-2 transition-all
                    ${student.status === 'picked' ? 'bg-green-50 border-green-200' :
                      student.status === 'dropped' ? 'bg-blue-50 border-blue-200' :
                      student.status === 'absent' ? 'bg-orange-50 border-orange-200' :
                      'bg-card border-border hover:border-primary/50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                      ${student.status === 'picked' ? 'bg-green-500' :
                        student.status === 'dropped' ? 'bg-blue-500' :
                        student.status === 'absent' ? 'bg-orange-500' :
                        'bg-gray-400'}
                    `}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {student.status === 'waiting' ? 'Esperando' :
                         student.status === 'picked' ? 'Recogido' : 
                         student.status === 'absent' ? 'No abordó' : 'Dejado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Ruta de ida: opciones de recoger o marcar ausente */}
                    {routeDirection === 'outbound' && student.status === 'waiting' && (
                      <>
                        <button
                          onClick={() => handleStudentAction(student, 'picked')}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                          title="Estudiante subió"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStudentAction(student, 'absent')}
                          className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                          title="No abordó"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {routeDirection === 'outbound' && student.status === 'picked' && (
                      <div className="p-2 rounded-lg bg-green-100">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                    {routeDirection === 'outbound' && student.status === 'absent' && (
                      <div className="p-2 rounded-lg bg-orange-100">
                        <UserX className="w-5 h-5 text-orange-500" />
                      </div>
                    )}

                    {/* Ruta de regreso: opciones de dejar o marcar ausente */}
                    {routeDirection === 'return' && student.status === 'waiting' && (
                      <>
                        <button
                          onClick={() => handleStudentAction(student, 'dropped')}
                          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                          title="Estudiante bajó"
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStudentAction(student, 'absent')}
                          className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                          title="No abordó"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {routeDirection === 'return' && student.status === 'dropped' && (
                      <div className="p-2 rounded-lg bg-blue-100">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                    {routeDirection === 'return' && student.status === 'absent' && (
                      <div className="p-2 rounded-lg bg-orange-100">
                        <UserX className="w-5 h-5 text-orange-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Complete Stop Button */}
          {canCompleteStop && stop.status === 'active' && (
            <div className="mt-6 pt-4 border-t">
              {!allStudentsProcessed && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="text-sm text-orange-700">
                    Debes confirmar el estado de {pendingStudentsCount} estudiante(s) antes de completar la parada.
                  </p>
                </div>
              )}
              <Button
                onClick={onCompleteStop}
                disabled={!allStudentsProcessed}
                className="w-full"
                size="lg"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Completar Parada
              </Button>
            </div>
          )}
        </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default StopDetailSheet;
