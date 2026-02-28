import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type RelationshipDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { label: string; description: string }) => void;
  onDelete?: () => void;
  initialLabel?: string;
  initialDescription?: string;
};

export const RelationshipDialog = ({ 
  open, 
  onOpenChange, 
  onSave, 
  onDelete,
  initialLabel,
  initialDescription 
}: RelationshipDialogProps) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setLabel(initialLabel || '');
    setDescription(initialDescription || '');
  }, [initialLabel, initialDescription, open]);

  const handleSave = () => {
    if (label.trim()) {
      onSave({ label: label.trim(), description: description.trim() });
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Relationship</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship Type</Label>
            <Input
              id="relationship"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., friends, enemies, family"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the nature of this relationship..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!label.trim()}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
