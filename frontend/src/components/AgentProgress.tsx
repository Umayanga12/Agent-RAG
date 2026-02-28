import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export interface AgentStage {
  name: "planning" | "retrieval" | "summarization" | "verification";
  status: "pending" | "started" | "complete";
  data?: {
    plan?: string;
    sub_questions?: string[];
    chunk_count?: number;
  };
}

interface AgentProgressProps {
  stages: AgentStage[];
}

const stageConfig = {
  planning: {
    label: "Planning",
    icon: "🎯",
    description: "Analyzing question",
  },
  retrieval: {
    label: "Retrieval",
    icon: "📚",
    description: "Finding relevant context",
  },
  summarization: {
    label: "Summarization",
    icon: "✍️",
    description: "Creating answer",
  },
  verification: {
    label: "Verification",
    icon: "✅",
    description: "Verifying accuracy",
  },
};

export const AgentProgress: React.FC<AgentProgressProps> = ({ stages }) => {
  if (stages.length === 0) return null;

  return (
    <div className="p-4 mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Agent Progress
        </h3>
        
        {stages.map((stage, index) => {
          const config = stageConfig[stage.name];
          const isActive = stage.status === "started";
          const isComplete = stage.status === "complete";
          const isPending = stage.status === "pending";

          return (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {isComplete && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {isActive && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  {isPending && (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span
                      className={`font-medium text-sm ${
                        isComplete
                          ? "text-green-700"
                          : isActive
                          ? "text-blue-700"
                          : "text-gray-400"
                      }`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      isComplete || isActive
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {config.description}
                  </p>
                </div>

                {/* Progress Indicator */}
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="h-1 w-16 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 animate-pulse rounded-full w-3/4"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stage Details */}
              {isComplete && stage.data && (
                <div className="ml-8 mt-2 p-3 bg-white rounded-lg border border-gray-200">
                  {stage.name === "planning" && stage.data.plan && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700">
                        Search Strategy:
                      </div>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded">
                        {stage.data.plan}
                      </pre>
                      
                      {stage.data.sub_questions && stage.data.sub_questions.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-gray-700 mb-1">
                            Sub-questions:
                          </div>
                          <ul className="space-y-1">
                            {stage.data.sub_questions.map((q, i) => (
                              <li
                                key={i}
                                className="text-xs text-gray-600 flex items-start gap-2"
                              >
                                <span className="text-blue-600">•</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {stage.name === "retrieval" && stage.data.chunk_count !== undefined && (
                    <div className="text-xs text-gray-600">
                      Retrieved{" "}
                      <span className="font-semibold text-blue-600">
                        {stage.data.chunk_count}
                      </span>{" "}
                      relevant chunks
                    </div>
                  )}
                </div>
              )}

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className="ml-2 h-4 w-px bg-gray-300"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
