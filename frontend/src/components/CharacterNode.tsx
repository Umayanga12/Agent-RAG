import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { User, Edit2, Trash2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type Property = {
  name: string;
  type: 'text' | 'dropdown' | 'radio';
  options?: string[];
};

export type CharacterNodeData = {
  label: string;
  properties: Property[];
  behaviours: string[];
  locked?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
};

const CharacterNode = memo(({ data }: NodeProps<CharacterNodeData>) => {
  return (
    <Card className="min-w-[220px] shadow-medium border-2 border-primary/20 bg-card hover:shadow-lg transition-all">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-accent !w-3 !h-3 !border-2 !border-card"
      />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-sm truncate">{data.label}</h3>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={data.onToggleLock}
              title={data.locked ? "Unlock character" : "Lock character"}
            >
              {data.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={data.onEdit}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
              onClick={data.onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Properties */}
        {data.properties.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Properties</p>
            <div className="space-y-1">
              {data.properties.map((prop, idx) => (
                <div key={idx} className="text-xs bg-muted/50 px-2 py-1 rounded">
                  <span className="font-semibold">{prop.name}</span>
                  <span className="text-muted-foreground ml-1">({prop.type})</span>
                  {prop.options && prop.options.length > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-1 ml-1">
                      {prop.type === 'dropdown' ? 'Options: ' : 'Choices: '}
                      {prop.options.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Behaviours */}
        {data.behaviours.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Behaviours</p>
            <div className="space-y-1">
              {data.behaviours.map((behaviour, idx) => (
                <div key={idx} className="text-xs bg-accent/10 px-2 py-1 rounded text-black-400">
                  {behaviour}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-accent !w-3 !h-3 !border-2 !border-card"
      />
    </Card>
  );
});

CharacterNode.displayName = 'CharacterNode';

export default CharacterNode;
