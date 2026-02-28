import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ArchitecturePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = location.state || {};

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">No Architecture Data Found</h1>
        <Button onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  const { plan, architecture } = data;

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Architecture: {plan.project_name}</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Back to Canvas</Button>
      </div>

      <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-4">
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Complexity</h3>
                  <p>{plan.system_complexity}</p>
                </div>
                <div>
                  <h3 className="font-semibold">User Scale</h3>
                  <p>{plan.user_scale}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Architectural Style</h3>
                  <p>{architecture.architectural_style}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scalability Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{plan.scalability?.strategy_name}</p>
                <p className="text-muted-foreground">{plan.scalability?.description}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {plan.scalability?.components_scaled.map((c: string, i: number) => (
                    <Badge key={i} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {architecture.components.map((comp: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {comp.name}
                      <Badge>{comp.type}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{comp.description}</p>
                    <div className="mb-2">
                      <h4 className="font-semibold text-sm">Technologies:</h4>
                      <div className="flex gap-1 flex-wrap">
                        {comp.technologies.map((tech: string, i: number) => (
                          <Badge key={i} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Responsibilities:</h4>
                      <ul className="list-disc list-inside text-sm">
                        {comp.responsibilities.map((resp: string, i: number) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="integration" className="space-y-4">
             <div className="grid grid-cols-1 gap-4">
              {architecture.integration_points.map((point: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {point.source_component} → {point.target_component}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm">Protocol</h4>
                        <p>{point.communication_protocol.protocol}</p>
                        <p className="text-sm text-muted-foreground">{point.communication_protocol.description}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Data Formats</h4>
                         <div className="flex gap-1 flex-wrap">
                        {point.data_formats.map((fmt: string, i: number) => (
                          <Badge key={i} variant="outline">{fmt}</Badge>
                        ))}
                      </div>
                      </div>
                    </div>
                    {point.description && <p className="mt-2 text-sm">{point.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {architecture.deployment_topology.map((node: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle>{node.name}</CardTitle>
                    <Badge variant="secondary">{node.type}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2"><strong>Platform:</strong> {node.platform}</p>
                    <div className="mb-2">
                      <h4 className="font-semibold text-sm">Components:</h4>
                      <div className="flex gap-1 flex-wrap">
                        {node.components_deployed.map((comp: string, i: number) => (
                          <Badge key={i} variant="outline">{comp}</Badge>
                        ))}
                      </div>
                    </div>
                    {node.scaling_policy && (
                       <p className="text-sm"><strong>Scaling:</strong> {node.scaling_policy}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ArchitecturePage;
