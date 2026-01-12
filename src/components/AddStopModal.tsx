import React, { useState } from 'react';
import { X, Plus, MapPin, Users, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stop, Student } from '@/types/route';

interface AddStopModalProps {
  open: boolean;
  onClose: () => void;
  onAddStop: (stop: Omit<Stop, 'id' | 'status' | 'completedAt'>) => void;
}

const AddStopModal: React.FC<AddStopModalProps> = ({ open, onClose, onAddStop }) => {
  const [stopName, setStopName] = useState('');
  const [address, setAddress] = useState('');
  const [studentNames, setStudentNames] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddStudentField = () => {
    setStudentNames(prev => [...prev, '']);
  };

  const handleRemoveStudentField = (index: number) => {
    setStudentNames(prev => prev.filter((_, i) => i !== index));
  };

  const handleStudentNameChange = (index: number, value: string) => {
    setStudentNames(prev => prev.map((name, i) => i === index ? value : name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stopName.trim() || !address.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Filter out empty student names and create student objects
    const students: Student[] = studentNames
      .filter(name => name.trim())
      .map((name, index) => ({
        id: `new-student-${Date.now()}-${index}`,
        name: name.trim(),
        status: 'waiting' as const,
      }));

    // For now, use placeholder coordinates (in a real app, this would geocode the address)
    // Using Bogotá area coordinates as default
    const placeholderCoordinates: [number, number] = [
      -74.0721 + (Math.random() - 0.5) * 0.02,
      4.7110 + (Math.random() - 0.5) * 0.02,
    ];

    const newStop: Omit<Stop, 'id' | 'status' | 'completedAt'> = {
      name: stopName.trim(),
      address: address.trim(),
      coordinates: placeholderCoordinates,
      students,
    };

    onAddStop(newStop);
    
    // Reset form
    setStopName('');
    setAddress('');
    setStudentNames(['']);
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    setStopName('');
    setAddress('');
    setStudentNames(['']);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Nueva Parada
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stop Name */}
          <div className="space-y-2">
            <Label htmlFor="stopName" className="text-sm font-medium">
              Nombre de la Parada *
            </Label>
            <Input
              id="stopName"
              placeholder="Ej: Casa Familia García"
              value={stopName}
              onChange={(e) => setStopName(e.target.value)}
              required
              maxLength={100}
              className="w-full"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Dirección *
            </Label>
            <Input
              id="address"
              placeholder="Ej: Calle 123 #45-67, Barrio Centro"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              maxLength={200}
              className="w-full"
            />
          </div>

          {/* Students */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Estudiantes
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStudentField}
                className="h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {studentNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Nombre del estudiante ${index + 1}`}
                    value={name}
                    onChange={(e) => handleStudentNameChange(index, e.target.value)}
                    maxLength={100}
                    className="flex-1"
                  />
                  {studentNames.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStudentField(index)}
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Puedes agregar múltiples estudiantes para esta parada
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !stopName.trim() || !address.trim()}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Parada
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStopModal;
