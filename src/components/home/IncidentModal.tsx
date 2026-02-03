import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Car, 
  Construction, 
  Wrench, 
  CloudRain,
  MessageSquare,
  Check 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface IncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IncidentType {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const incidentTypes: IncidentType[] = [
  {
    id: 'traffic',
    label: 'Tráfico',
    icon: Car,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 hover:bg-orange-200',
  },
  {
    id: 'road_closed',
    label: 'Vía Cerrada',
    icon: Construction,
    color: 'text-red-600',
    bgColor: 'bg-red-100 hover:bg-red-200',
  },
  {
    id: 'mechanical',
    label: 'Fallo Mecánico',
    icon: Wrench,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 hover:bg-gray-200',
  },
  {
    id: 'weather',
    label: 'Clima',
    icon: CloudRain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200',
  },
  {
    id: 'custom',
    label: 'Personalizada',
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 hover:bg-purple-200',
  },
];

const IncidentModal: React.FC<IncidentModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    if (typeId !== 'custom') {
      setCustomMessage('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    
    if (selectedType === 'custom' && !customMessage.trim()) {
      toast({
        title: 'Mensaje requerido',
        description: 'Por favor ingresa un mensaje para la novedad personalizada.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const selectedIncident = incidentTypes.find(t => t.id === selectedType);
    
    toast({
      title: 'Novedad reportada',
      description: `Se ha reportado: ${selectedIncident?.label}${selectedType === 'custom' ? ` - ${customMessage}` : ''}`,
    });
    
    setIsSubmitting(false);
    setSelectedType(null);
    setCustomMessage('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedType(null);
    setCustomMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-secondary" />
            Reportar Novedad
          </DialogTitle>
          <DialogDescription>
            Selecciona el tipo de novedad a reportar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Incident Type Grid */}
          <div className="grid grid-cols-2 gap-2">
            {incidentTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-xl 
                    transition-all duration-200 border-2
                    ${isSelected 
                      ? `border-primary ${type.bgColor}` 
                      : `border-transparent ${type.bgColor}`
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`p-2 rounded-full bg-white/50`}>
                    <Icon className={`w-6 h-6 ${type.color}`} />
                  </div>
                  <span className={`text-sm font-medium ${type.color}`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Message Input */}
          {selectedType === 'custom' && (
            <div className="space-y-2">
              <Textarea
                placeholder="Describe la novedad..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Máximo 200 caracteres ({customMessage.length}/200)
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            disabled={!selectedType || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Enviando...' : 'Reportar Novedad'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentModal;
