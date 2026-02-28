import { useEffect, useRef } from "react";

export interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

interface Props {
  messages: Message[];
}

const ConversationView: React.FC<Props> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null; // hide until first prompt

  return (
    <div className="w-full max-w-4xl mt-8 flex flex-col gap-6 px-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === "user";
        const isSystem = msg.role === "system";

        if (isSystem) {
          return (
            <div key={index} className="flex justify-center w-full my-2">
              <span className="text-s text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                {msg.content}
              </span>
            </div>
          );
        }

        return (
          <div
            key={index}
            className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative px-6 py-4 max-w-[85%] text-[15px] leading-relaxed shadow-sm animate-fadeIn transition-all duration-300 ${isUser
                ? "bg-blue-300 text-black rounded-2xl rounded-br-sm"
                : "bg-white border border-gray-100 text-gray-100 rounded-2xl rounded-bl-sm shadow-sm"
                }`}
            >
              {msg.content}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
};

export default ConversationView;
