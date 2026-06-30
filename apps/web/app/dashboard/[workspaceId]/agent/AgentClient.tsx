"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GREETING =
  "Hi! I'm your AI Copilot. I can list features, generate PRDs, update feature statuses on your Kanban board, explain tasks, and trigger AI reviews. How can I help?";

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: "greeting",
    role: "assistant",
    parts: [{ type: "text", text: GREETING }],
  },
];

export function AgentClient({ workspaceId }: { workspaceId: string }) {
  // AI SDK v5+: useChat no longer manages the input — we own it.
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { workspaceId },
    }),
    messages: INITIAL_MESSAGES,
  });

  const busy = status === "submitted" || status === "streaming";

  // "Open in Copilot" deep-link: prefill the composer with a seeded prompt
  // (e.g. from a task's "Explain" panel). Fires once.
  const searchParams = useSearchParams();
  const seededRef = useRef(false);
  useEffect(() => {
    const seed = searchParams.get("seed");
    if (seed && !seededRef.current) {
      seededRef.current = true;
      setInput(seed);
    }
  }, [searchParams]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full max-w-4xl mx-auto overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m) => {
          const textParts = m.parts.filter(
            (p): p is { type: "text"; text: string } => p.type === "text",
          );
          const toolParts = m.parts.filter((p) => p.type.startsWith("tool-"));

          return (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-end space-x-2">
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-1">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}

                <div className="max-w-[80%] flex flex-col gap-2">
                  {textParts.length > 0 && (
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {textParts.map((p) => p.text).join("")}
                      </p>
                    </div>
                  )}

                  {/* Render tool calls inline */}
                  {toolParts.map((part: any, i: number) => {
                    const done = part.state === "output-available";
                    const toolName = part.type.replace(/^tool-/, "");
                    return (
                      <div
                        key={part.toolCallId ?? i}
                        className="bg-card border border-border shadow-sm rounded-xl p-3 flex flex-col gap-2 text-sm max-w-md w-full animate-in fade-in"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          {done ? (
                            <Sparkles className="w-4 h-4 text-green-500" />
                          ) : (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          )}
                          <span>Tool: {toolName}</span>
                        </div>
                        {done ? (
                          <div className="bg-muted rounded-md p-2 text-xs overflow-x-auto text-muted-foreground font-mono">
                            {JSON.stringify(part.output, null, 2)}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-xs">
                            Executing…
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mb-1">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t">
        <form onSubmit={submit} className="flex w-full items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot to generate a PRD for an open feature..."
            className="flex-1 rounded-full px-6 bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:bg-background transition-all"
            disabled={busy}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0"
            disabled={busy || !input.trim()}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-2">
          AI Copilot can read your workspace data and autonomously trigger
          actions.
        </p>
      </div>
    </div>
  );
}
