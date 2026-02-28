import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

type Property = {
  name: string;
  type: 'text' | 'dropdown' | 'radio';
  options?: string[];
};

type CharacterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { label: string; properties: Property[]; behaviours: string[] }) => void;
  initialData?: {
    label: string;
    properties: Property[];
    behaviours: string[];
  };
  title: string;
};

export const CharacterDialog = ({ open, onOpenChange, onSave, initialData, title }: CharacterDialogProps) => {
  const [label, setLabel] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [behaviours, setBehaviours] = useState<string[]>([]);

  // For adding new property
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyType, setNewPropertyType] = useState<'text' | 'dropdown' | 'radio'>('text');
  const [newPropertyOptions, setNewPropertyOptions] = useState('');

  // For adding new behaviour
  const [newBehaviour, setNewBehaviour] = useState('');

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label);
      setProperties(initialData.properties || []);
      setBehaviours(initialData.behaviours || []);
    } else {
      setLabel('');
      setProperties([]);
      setBehaviours([]);
    }
    setNewPropertyName('');
    setNewPropertyType('text');
    setNewPropertyOptions('');
    setNewBehaviour('');
  }, [initialData, open]);

  const handleSave = () => {
    if (label.trim()) {
      onSave({ label, properties, behaviours });
      onOpenChange(false);
    }
  };

  // Add property
  const addProperty = () => {
    if (!newPropertyName.trim()) return;

    const newProp: Property = {
      name: newPropertyName.trim(),
      type: newPropertyType,
      ...(newPropertyType !== 'text' && newPropertyOptions.trim()
        ? { options: newPropertyOptions.split(',').map((o) => o.trim()) }
        : {}),
    };

    setProperties([...properties, newProp]);
    setNewPropertyName('');
    setNewPropertyOptions('');
    setNewPropertyType('text');
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  // Add behaviour
  const addBehaviour = () => {
    if (newBehaviour.trim()) {
      setBehaviours([...behaviours, newBehaviour.trim()]);
      setNewBehaviour('');
    }
  };

  const removeBehaviour = (index: number) => {
    setBehaviours(behaviours.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Character Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Character Name</Label>
            <Input
              id="name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter character name"
            />
          </div>

          {/* Properties */}
          <div className="space-y-2">
            <Label>Properties</Label>
            <div className="flex flex-col gap-2 border p-3 rounded-md">
              <div className="flex flex-col gap-2">
                <Input
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  placeholder="Property name (e.g., status)"
                />

                <div className="flex gap-2">
                  <Select value={newPropertyType} onValueChange={(v) => setNewPropertyType(v as any)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                    </SelectContent>
                  </Select>

                  {newPropertyType !== 'text' && (
                    <Input
                      value={newPropertyOptions}
                      onChange={(e) => setNewPropertyOptions(e.target.value)}
                      placeholder="Options (comma separated)"
                    />
                  )}

                  <Button type="button" onClick={addProperty} variant="secondary">
                    Add
                  </Button>
                </div>
              </div>

              {properties.length > 0 && (
                <div className="space-y-2 mt-2">
                  {properties.map((prop, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                      <div className="flex-1 text-sm">
                        <span className="font-semibold">{prop.name}</span> ({prop.type})
                        {prop.options && prop.options.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            [ {prop.options.join(', ')} ]
                          </span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeProperty(idx)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Behaviours */}
          <div className="space-y-2">
            <Label>Behaviours</Label>
            <div className="flex gap-2">
              <Input
                value={newBehaviour}
                onChange={(e) => setNewBehaviour(e.target.value)}
                placeholder="Add behaviour (e.g., brave, loyal)"
                onKeyDown={(e) => e.key === 'Enter' && addBehaviour()}
              />
              <Button type="button" onClick={addBehaviour} variant="secondary">
                Add
              </Button>
            </div>
            {behaviours.length > 0 && (
              <div className="space-y-1 mt-2">
                {behaviours.map((behaviour, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-accent/10 p-2 rounded">
                    <span className="flex-1 text-sm">{behaviour}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeBehaviour(idx)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
