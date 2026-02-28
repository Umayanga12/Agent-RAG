import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "../assets/animation.json";
import animationData1 from "../assets/Ghostsmart.json";
import { AgentProgress, AgentStage } from "../components/AgentProgress";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AgentChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentStages, setAgentStages] = useState<AgentStage[]>([
    { name: "planning", status: "pending" },
    { name: "retrieval", status: "pending" },
    { name: "summarization", status: "pending" },
    { name: "verification", status: "pending" },
  ]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetStages = () => {
    setAgentStages([
      { name: "planning", status: "pending" },
      { name: "retrieval", status: "pending" },
      { name: "summarization", status: "pending" },
      { name: "verification", status: "pending" },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    resetStages();

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Prepare assistant message
    let assistantContent = "";
    
    try {
      abortControllerRef.current = new AbortController();
      
      const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
      const response = await fetch(`${API_URL}/qa/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userMessage }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, {stream: true});
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse Vercel AI SDK Data Stream Protocol
          // Format: "0:\"text\"" for text chunks, "2:{...}" for data chunks
          
          if (line.startsWith("0:")) {
            // Text chunk
            const text = JSON.parse(line.substring(2));
            assistantContent += text;
            
            // Update last message or create new one
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === "assistant") {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: assistantContent },
                ];
              } else {
                return [...prev, { role: "assistant", content: assistantContent }];
              }
            });
          } else if (line.startsWith("2:")) {
            // Data chunk
            const data = JSON.parse(line.substring(2));
            console.log("Data chunk:", data);
            
            if (data.type === "stage") {
                setAgentStages((prev) =>
                prev.map((stage) =>
                  stage.name === data.stage
                    ? {
                        ...stage,
                        status: data.status,
                        data: data.data,
                      }
                    : stage
                )
              );
            }
          } else if (line.startsWith("3:")) {
            // Error chunk
            const error = JSON.parse(line.substring(2));
            console.error("Error chunk:", error);
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${error.message}. Please try again.`,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="bg-gray-50 w-full min-h-screen relative flex flex-col font-sans">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 w-16 h-16 rounded-lg">
              <Lottie animationData={animationData} loop={true} width={1} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-semibold text-gray-800 tracking-tight">
                Sri Lankan Constitution Q&A
              </h1>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                AI-Powered Constitutional Assistant
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isLoading ? "bg-blue-500 animate-pulse" : "bg-green-500"
              }`}
            />
            <span className="text-xs font-medium text-gray-500">
              {isLoading ? "Processing..." : "Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-5xl mx-auto pt-20 pb-32 px-4">
        {hasMessages ? (
          <div className="space-y-4">

            {/* Messages */}
            {messages.map((message, index) => (
              <React.Fragment key={index}>
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-teal-600 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
                {isLoading &&
                  message.role === "user" &&
                  (index === messages.length - 1 ||
                    index === messages.length - 2) && (
                    <AgentProgress stages={agentStages} />
                  )}
              </React.Fragment>
            ))}

            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="w-[20vh] h-[20vh] shadow-sm flex items-center justify-center mb-6">
              <Lottie animationData={animationData1} loop={true} width={1} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Sri Lankan Constitution Assistant
            </h2>
            <p className="text-gray-500 max-w-md mb-8">
              Ask questions about the Constitution of Sri Lanka. Our AI system analyzes
              constitutional provisions, articles, and amendments to provide accurate,
              source-backed answers.
            </p>

            {/* Centered Input */}
            <div className="w-full max-w-2xl">
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/60 p-2 flex items-center gap-2 transition-all duration-300 focus-within:shadow-2xl focus-within:border-teal-500/30 focus-within:ring-4 focus-within:ring-teal-500/10">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about fundamental rights, presidential powers, amendments..."
                    className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-[15px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    rows={1}
                    autoFocus
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      input.trim() && !isLoading
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 hover:scale-105 active:scale-95"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Input Area (Bottom) */}
      {hasMessages && (
        <div className="fixed bottom-0 left-0 w-full z-40 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pb-6 pt-10">
          <div className="max-w-3xl mx-auto px-4">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/60 p-2 flex items-center gap-2 transition-all duration-300 focus-within:shadow-2xl focus-within:border-teal-500/30 focus-within:ring-4 focus-within:ring-teal-500/10">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about constitutional provisions..."
                  className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-[15px]"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    input.trim() && !isLoading
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 hover:scale-105 active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
            <div className="text-center mt-3">
              <p className="text-[11px] text-gray-400 font-medium">
                AI-generated legal information. Verify with official constitutional text for legal purposes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChat;
