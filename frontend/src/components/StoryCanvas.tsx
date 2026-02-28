import { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  MarkerType,
  Panel,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Link, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CharacterNode, { CharacterNodeData } from './CharacterNode';
import { CharacterDialog } from './CharacterDialog';
import { RelationshipDialog } from './RelationshipDialog';
import { toast } from 'sonner';

const nodeTypes = {
  character: CharacterNode,
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

export interface StoryCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onAddCharacter: () => void;
  onEditEdge: (edge: Edge) => void;
}

export const StoryCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onAddCharacter,
  onEditEdge,
}: StoryCanvasProps) => {
  const connectingNodeRef = useRef<string | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `edge_${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        label: 'relationship',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--accent))',
        },
        style: {
          stroke: 'hsl(var(--accent))',
          strokeWidth: 2,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
      toast.success('Relationship created');
    },
    [setEdges]
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    onEditEdge(edge);
  }, [onEditEdge]);

  const deleteAllEdges = () => {
    setEdges([]);
    toast.success('All relationships deleted');
  };

  const exportDiagram = () => {
    const data = {
      nodes: nodes.map((node) => ({
        id: node.id,
        label: node.data.label,
        properties: node.data.properties,
        behaviours: node.data.behaviours,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        label: edge.label,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story-diagram.json';
    a.click();
    toast.success('Diagram exported');
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Background className="bg-muted/30" />
        <Controls className="bg-card border-border" />
        <MiniMap
          className="bg-card border-border"
          nodeColor={(node) => 'hsl(var(--primary))'}
          maskColor="hsl(var(--muted) / 0.5)"
        />

        <Panel position="top-right" className="space-x-2">
          <Card className="p-2 flex gap-2">
            <Button onClick={onAddCharacter} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Entity
            </Button>
            <Button onClick={exportDiagram} size="sm" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={deleteAllEdges}
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={edges.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Clear Relationships
            </Button>
          </Card>
        </Panel>

        <Panel position="top-left">
          <Card className="p-4 max-w-xs">
            <h3 className="font-semibold mb-2 text-sm">Quick Guide</h3>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Add characters with the button above</li>
              <li>• Drag from the dots to create relationships</li>
              <li>• Click relationships to edit them</li>
              <li>• Use character controls to edit or delete</li>
            </ul>
          </Card>
        </Panel>
      </ReactFlow>
    </div>
  );
};
