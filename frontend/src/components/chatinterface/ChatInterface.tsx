import React, { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: string; // ISO
};

type ChatInterfaceProps = {
  /**
   * Called when the user sends a message.
   * Return a ChatMessage representing the assistant reply (if your API is synchronous),
   * or return nothing and handle update yourself (e.g. streaming).
   */
  onSend?: (message: ChatMessage) => Promise<ChatMessage | void> | void;
  /**
   * Optional initial messages to seed the conversation.
   */
  initialMessages?: ChatMessage[];
  /**
   * Optional placeholder for the input box.
   */
  placeholder?: string;
  /**
   * Limit max height of the chat list (Tailwind CSS classes or plain CSS height).
   * Defaults to 'h-[60vh]'.
   */
  messagesHeightClassName?: string;
};

/**
 * A simple, accessible chat interface component intended to be used with an AI backend.
 *
 * Features:
 * - Message list with basic styling for user and assistant messages.
 * - Input box with send button.
 * - Enter sends, Shift+Enter inserts newline.
 * - onSend callback used to integrate with backend. If not provided, a local echo assistant replies.
 * - Scrolls to bottom on new messages.
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSend,
  initialMessages = [],
  placeholder = "Ask the AI developer agent...",
  messagesHeightClassName = "h-[94vh]",
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessages.length) return initialMessages;
    // default system prompt (optional)
    return [
      {
        id: `sys-${Date.now()}`,
        role: "system",
        content:
          "You are an AI backend developer agent. Help the user build and debug code.",
        createdAt: new Date().toISOString(),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // assistant typing indicator

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  function scrollToBottom() {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }

  function makeMessage(role: Role, content: string): ChatMessage {
    return {
      id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      createdAt: new Date().toISOString(),
    };
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMsg = makeMessage("user", trimmed);
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      if (onSend) {
        // Let parent handle sending. If it returns a reply message, append it.
        const maybeReply = await onSend(userMsg);
        if (maybeReply) {
          setMessages((m) => [...m, maybeReply]);
        }
      } else {
        // Default local behavior: simulate an assistant typing and reply with a helpful echo.
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, 700)); // typing delay

        // simple heuristic "assistant" response
        const assistantReply = makeMessage(
          "assistant",
          generateAssistantReply(userMsg.content),
        );
        setMessages((m) => [...m, assistantReply]);
      }
    } catch (err) {
      // Append an error assistant message for visibility.
      const errMsg = makeMessage(
        "assistant",
        "I couldn't process that message. Please try again.",
      );
      setMessages((m) => [...m, errMsg]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
      // focus back to input for quick follow-up
      textareaRef.current?.focus();
    }
  }

  // Basic assistant reply generator for when no backend is provided.
  function generateAssistantReply(userContent: string) {
    // Keep this deterministic and safe. It's a simple echo with suggestions.
    const snippet =
      userContent.length > 120
        ? userContent.slice(0, 117) + "..."
        : userContent;
    return `I received your message: "${snippet}".
If you'd like, I can:
- Outline a plan to implement it.
- Generate code snippets.
- Find bugs and suggest fixes.

Tell me which you'd prefer.`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div
        className={`border rounded-lg overflow-hidden bg-card shadow-sm flex flex-col ${messagesHeightClassName}`}
        role="region"
        aria-label="Chat conversation"
      >
        <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-white/30 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold">
              AI
            </div>
            <div>
              <div className="text-sm font-medium">AI Backend Dev Agent</div>
              <div className="text-xs text-muted-foreground">
                Helpful · Code-aware · Contextual
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Online</div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                }`}
                aria-live={msg.role === "assistant" ? "polite" : undefined}
              >
                {msg.content}
                <div className="mt-1 text-[10px] text-muted-foreground opacity-80 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted px-3 py-2 rounded-lg text-sm">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t bg-surface">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-end gap-3"
          >
            <label htmlFor="chat-input" className="sr-only">
              Chat message
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/40"
              disabled={isSending}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInput((v) => v + "\n");
                  textareaRef.current?.focus();
                }}
                title="Insert newline"
                className="inline-flex items-center justify-center rounded-md px-2 py-2 text-sm hover:bg-accent/10"
              >
                ⏎
              </button>

              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                  isSending || !input.trim()
                    ? "bg-primary/30 text-primary-foreground/60 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:brightness-105"
                }`}
                aria-label="Send message"
              >
                {isSending ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <SendIcon />
                    Send
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Tip: Press Enter to send, Shift+Enter for a newline.
      </div>
    </div>
  );
};

export default ChatInterface;

/* ----------------------------
   Helper subcomponents
   ---------------------------- */

function SendIcon() {
  // lightweight inline SVG arrow
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="currentColor"
        strokeWidth="0"
        opacity="0.6"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TypingIndicator() {
  // Three bouncing dots
  return (
    <div className="flex items-center gap-1">
      <span
        className="w-2 h-2 bg-foreground rounded-full opacity-80 animate-bounce"
        style={{ animationDelay: "0s" }}
      />
      <span
        className="w-2 h-2 bg-foreground rounded-full opacity-80 animate-bounce"
        style={{ animationDelay: "0.12s" }}
      />
      <span
        className="w-2 h-2 bg-foreground rounded-full opacity-80 animate-bounce"
        style={{ animationDelay: "0.24s" }}
      />
    </div>
  );
}
