import { useEffect, useRef, useState, useCallback } from "react";
import { StoryCanvas } from "@/components/StoryCanvas";
import { useNodesState, useEdgesState, Node, Edge, Position } from "reactflow";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import dagre from "dagre";
import { CharacterDialog } from "@/components/CharacterDialog";
import { RelationshipDialog } from "@/components/RelationshipDialog";
import { CharacterNodeData, Property } from "@/components/CharacterNode";
import { Button } from "@/components/ui/button";

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

const Canves = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const wsRef = useRef<WebSocket | null>(null);

  const location = useLocation();

  // State lifted from StoryCanvas
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node<CharacterNodeData> | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);

  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-layout function
  const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Increased spacing for better layout
    dagreGraph.setGraph({ 
      rankdir: direction, 
      ranksep: 150, // Vertical spacing between layers
      nodesep: 100  // Horizontal spacing between nodes
    });

    nodes.forEach((node) => {
      const data = node.data as CharacterNodeData;
      
      // Calculate dynamic height based on content
      // Base height (header + padding) ~ 80px
      // Each property ~ 32px
      // Each behaviour ~ 32px
      // Section headers ~ 20px each if present
      
      let height = 80;
      
      if (data.properties && data.properties.length > 0) {
        height += 25; // Properties header
        height += data.properties.length * 35;
      }
      
      if (data.behaviours && data.behaviours.length > 0) {
        height += 25; // Behaviours header
        height += data.behaviours.length * 35;
      }

      // Add some buffer
      height += 20;

      dagreGraph.setNode(node.id, { width: 240, height: height });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = Position.Top;
      node.sourcePosition = Position.Bottom;

      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      node.position = {
        x: nodeWithPosition.x - 240 / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      };

      return node;
    });

    return { nodes: layoutedNodes, edges };
  };

  // Handlers
  const handleEditNode = useCallback((node: Node<CharacterNodeData>) => {
    setEditingNode(node);
    setCharacterDialogOpen(true);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    toast.success('Entity deleted');
  }, [setNodes, setEdges]);

  const handleToggleLock = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            draggable: !!node.data.locked,
            data: {
              ...node.data,
              locked: !node.data.locked,
            },
          }
          : node
      )
    );
  }, [setNodes]);

  const createNodeData = (data: any, id: string) => ({
    ...data,
    onEdit: () => handleEditNode({ id, data: { ...data } } as any), // We need the full node, but here we construct it partially or find it
    onDelete: () => handleDeleteNode(id),
    onToggleLock: () => handleToggleLock(id),
  });

  // We need to wrap the handlers to find the node in state when called
  const attachHandlers = (node: Node) => {
    node.data.onEdit = () => {
      setEditingNode(node);
      setCharacterDialogOpen(true);
    };
    node.data.onDelete = () => handleDeleteNode(node.id);
    node.data.onToggleLock = () => handleToggleLock(node.id);
    return node;
  };

  const handleAddCharacter = () => {
    setEditingNode(null);
    setCharacterDialogOpen(true);
  };

  const handleSaveCharacter = (data: { label: string; properties: Property[]; behaviours: string[] }) => {
    if (editingNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingNode.id
            ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
            : node
        )
      );
      toast.success('Entity updated');
    } else {
      const newNode: Node<CharacterNodeData> = {
        id: getNodeId(),
        type: 'character',
        position: { x: 0, y: 0 }, // Will be arranged or placed
        draggable: true,
        data: {
          ...data,
          locked: false,
          onEdit: () => { },
          onDelete: () => { },
          onToggleLock: () => { },
        },
      };
      
      // Attach handlers
      const nodeWithHandlers = attachHandlers(newNode);
      
      // Simple placement if not auto-layout
      nodeWithHandlers.position = {
        x: Math.random() * 500,
        y: Math.random() * 500
      };

      setNodes((nds) => [...nds, nodeWithHandlers]);
      toast.success('Entity added');
    }
  };

  const handleEditEdge = (edge: Edge) => {
    setEditingEdge(edge);
    setRelationshipDialogOpen(true);
  };

  const handleSaveRelationship = (data: { label: string; description: string }) => {
    if (editingEdge) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === editingEdge.id
            ? {
              ...edge,
              label: data.label,
              data: { description: data.description },
            }
            : edge
        )
      );
      toast.success('Relationship updated');
    }
  };

  const handleDeleteRelationship = () => {
    if (editingEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== editingEdge.id));
      toast.success('Relationship deleted');
    }
  };

  const handleGenerateSystem = () => {
    if (!wsRef.current) {
        toast.error("Not connected to server");
        return;
    }
    
    setIsGenerating(true);
    toast.info("Starting system generation...");
    
    // Serialize graph
    const graphData = {
        nodes: nodes.map(n => ({
            id: n.id,
            label: n.data.label,
            properties: n.data.properties,
            behaviours: n.data.behaviours
        })),
        edges: edges.map(e => ({
            source: e.source,
            target: e.target,
            label: e.label,
            description: e.data?.description
        }))
    };
    
    wsRef.current.send(JSON.stringify({
        type: "generate_system",
        data: graphData
    }));
  };


  useEffect(() => {
    // Check for project data passed via navigation
    const projectData = location.state?.projectData;
    if (projectData && projectData.entities) {
      console.log("DEBUG: Initializing graph from project data:", projectData);
      
      let newNodes: Node[] = [];
      let newEdges: Edge[] = [];

      // Create nodes for entities
      projectData.entities.forEach((entity: any) => {
        const id = entity.name;
        const node: Node = {
          id,
          type: "character", 
          position: { x: 0, y: 0 },
          data: { 
            label: entity.name,
            description: entity.description,
            properties: entity.properties?.map((p: any) => ({
              name: p.name,
              type: p.type || 'text',
              options: p.options
            })) || [],
            behaviours: entity.behaviors?.map((b: any) => b.description || b) || [],
            locked: false,
            onEdit: () => {}, // Placeholder
            onDelete: () => {}, // Placeholder
            onToggleLock: () => {} // Placeholder
          },
        };
        newNodes.push(node);
      });

      // Create edges for relationships
      if (projectData.relationships) {
        projectData.relationships.forEach((rel: any, index: number) => {
          newEdges.push({
            id: `e${index}`,
            source: rel.source,
            target: rel.target,
            label: rel.description,
            animated: true,
            type: 'smoothstep',
          });
        });
      }

      // Attach handlers to all nodes
      newNodes = newNodes.map(node => attachHandlers(node));

      // Apply Layout
      const layouted = getLayoutedElements(newNodes, newEdges);
      
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      // REMOVED EARLY RETURN HERE
    }

    const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
    const WS_URL = API_URL.replace(/^http/, 'ws');
    
    const savedThread = localStorage.getItem("threadId");
    const wsUrl = savedThread
      ? `${WS_URL}/ws?thread_id=${encodeURIComponent(savedThread)}`
      : `${WS_URL}/ws`;

    console.log("DEBUG: Canvas connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("DEBUG: Canvas WebSocket connected");
      toast.success("Connected to server");
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log("DEBUG: Canvas received:", parsed);

        if (parsed.type === "graph_update") {
          // Handle updates if necessary, ensuring handlers are attached
          toast.success("Graph updated from server");
        }
        
        if (parsed.type === "status") {
            toast.info(parsed.message);
        }
        
        if (parsed.type === "generation_result") {
            setIsGenerating(false);
            toast.success("System generated successfully!");
            navigate("/architecture", { state: { data: parsed.data } });
        }

      } catch (e) {
        console.error("Failed to parse WS message:", e);
      }
    };

    ws.onerror = (err) => {
      console.error("Canvas WS Error:", err);
      toast.error("Connection error");
    };

    return () => {
      ws.close();
    };
  }, [location.state]); // Removed setNodes, setEdges to avoid loop, added handlers deps if needed but they are stable

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
          <h1 className="text-xl font-bold">System Canvas</h1>
          <div className="flex gap-2">
              <Button 
                variant="default" 
                onClick={handleGenerateSystem}
                disabled={isGenerating || nodes.length === 0}
              >
                {isGenerating ? "Generating..." : "Generate System Plan"}
              </Button>
          </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {/* Right: Story canvas takes remaining space */}
        <section className="flex-1 overflow-hidden relative">
          <StoryCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
            onAddCharacter={handleAddCharacter}
            onEditEdge={handleEditEdge}
          />

          <CharacterDialog
            open={characterDialogOpen}
            onOpenChange={setCharacterDialogOpen}
            onSave={handleSaveCharacter}
            initialData={
              editingNode
                ? {
                  label: editingNode.data.label,
                  properties: editingNode.data.properties,
                  behaviours: editingNode.data.behaviours,
                }
                : undefined
            }
            title={editingNode ? 'Edit Entity' : 'Add Entity'}
          />

          <RelationshipDialog
            open={relationshipDialogOpen}
            onOpenChange={setRelationshipDialogOpen}
            onSave={handleSaveRelationship}
            onDelete={handleDeleteRelationship}
            initialLabel={editingEdge?.label as string}
            initialDescription={editingEdge?.data?.description as string}
          />
        </section>
      </main>
    </div>
  );
};

export default Canves;
