import React, { useCallback, useEffect, useRef, useState } from "react";

export type MessageRole = "user" | "assistant" | "system";

export type MessageLike = {
  id: string;
  role: MessageRole;
  // accept both shapes used elsewhere in the project for compatibility
  content?: string;
  text?: string;
  createdAt?: string; // ISO string
  timestamp?: number; // ms since epoch
};

/**
 * MessageBubble
 * Small presentational component that displays a single chat message.
 *
 * This component is intentionally forgiving about the message shape:
 * it accepts either `content`/`createdAt` (newer) or `text`/`timestamp` (older).
 */
export const MessageBubble: React.FC<{ message: MessageLike; className?: string }> = ({
  message,
  className = "",
}) => {
  const text = message.content ?? message.text ?? "";
  const createdAtIso = message.createdAt ?? (message.timestamp ? new Date(message.timestamp).toISOString() : undefined);
  const timeString = createdAtIso ? new Date(createdAtIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} ${className}`}>
      <div
        role={isSystem ? "note" : "article"}
        aria-label={isSystem ? "system message" : `${message.role} message`}
        className={`max-w-[82%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm leading-relaxed break-words
          ${isUser ? "bg-primary text-primary-foreground rounded-br-none" : isSystem ? "bg-yellow-50 text-amber-900" : "bg-muted text-foreground rounded-bl-none"}`}
      >
        <div>{text}</div>
        {timeString ? (
          <div className="mt-1 text-[11px] text-muted-foreground opacity-80 text-right">{timeString}</div>
        ) : null}
      </div>
    </div>
  );
};

export default MessageBubble;

/* ---------------------------
   ChatInput helper component
   ---------------------------
   Small controlled input component used by chat interfaces.

   Props:
   - onSend: (text) => Promise<void> | void  // called when user sends
   - placeholder?: string
   - disabled?: boolean
   - ariaLabel?: string
*/
type ChatInputProps = {
  onSend: (text: string) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  sendButtonLabel?: string;
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  placeholder = "Type a message... (Enter to send, Shift+Enter for newline)",
  disabled = false,
  ariaLabel = "Chat message input",
  sendButtonLabel = "Send",
}) => {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // autosize textarea height
  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isSending || disabled) return;

    try {
      setIsSending(true);
      await Promise.resolve(onSend(trimmed));
      setValue("");
      // keep focus after send
      textareaRef.current?.focus();
    } catch (err) {
      // swallow - parent may render an error message
      // But set a small visible change so user knows
      // In a real app you might show a toast or inline error.
      // For now, re-enable input so user can retry.
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSend();
      }}
      className="flex items-end gap-3"
      aria-label="chat-input-form"
    >
      <label htmlFor="chat-input" className="sr-only">
        {ariaLabel}
      </label>

      <textarea
        id="chat-input"
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        rows={1}
        className="flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/40"
        aria-label={ariaLabel}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setValue((v) => v + "\n");
            textareaRef.current?.focus();
          }}
          title="Insert newline"
          className="inline-flex items-center justify-center rounded-md px-2 py-2 text-sm hover:bg-accent/10"
        >
          ⏎
        </button>

        <button
          type="submit"
          disabled={isSending || disabled || !value.trim()}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition
            ${isSending || !value.trim() ? "bg-primary/30 text-primary-foreground/60 cursor-not-allowed" : "bg-primary text-primary-foreground hover:brightness-105"}`}
          aria-label="Send message"
        >
          {isSending ? (
            <span className="flex items-center gap-2">
              <Spinner /> Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">{sendButtonLabel}</span>
          )}
        </button>
      </div>
    </form>
  );
};

/* Small spinner used by ChatInput */
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
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
