/**
 * Barrel exports for the chat interface components
 *
 * This file provides convenient named exports for the chat UI so you can import:
 *   import { ChatInterface, MessageBubble, ChatInput } from "@/components/chatinterface";
 */

export { default as ChatInterface } from "./ChatInterface";
export type { ChatMessage } from "./ChatInterface";

export { default as MessageBubble } from "./MessageBubble";
export type { MessageLike, MessageRole } from "./MessageBubble";
export { ChatInput } from "./MessageBubble";
