import React from 'react';
import { MapPin, Users, CheckCircle, UserPlus, UserMinus, X, UserX, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Stop, Student } from '@/types/route';
import { Button } from '@/components/ui/button';

interface StopDetailSheetProps {
  stop: Stop | null;
  open: boolean;
  onClose: () => void;
  onStudentAction: (student: Student, action: 'picked' | 'dropped' | 'absent') => void;
  routeDirection: 'outbound' | 'return';
  onCompleteStop?: () => void;
  canCompleteStop?: boolean;
}

const StopDetailSheet: React.FC<StopDetailSheetProps> = ({
  stop,
  open,
  onClose,
  onStudentAction,
  routeDirection,
  onCompleteStop,
  canCompleteStop = false,
}) => {
  if (!stop) return null;

  // Check if all students have been processed (picked/dropped/absent)
  const allStudentsProcessed = stop.students.length === 0 || 
    stop.students.every(s => 
      routeDirection === 'outbound' 
        ? s.status === 'picked' || s.status === 'absent'
        : s.status === 'dropped' || s.status === 'absent'
    );

  const pendingStudents = stop.students.filter(s => s.status === 'waiting').length;

  return (
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
                          onClick={() => onStudentAction(student, 'picked')}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                          title="Estudiante subió"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onStudentAction(student, 'absent')}
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
                          onClick={() => onStudentAction(student, 'dropped')}
                          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                          title="Estudiante bajó"
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onStudentAction(student, 'absent')}
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
                    Debes confirmar el estado de {pendingStudents} estudiante(s) antes de completar la parada.
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
  );
};

export default StopDetailSheet;
