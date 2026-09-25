import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Bot, User, Send, X, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import API_BASE_URL from "../api";

export default function AIChatBot({ token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! 👋 I'm your Apex AI Assistant. How can I help you today with questions about employees or projects?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const newMessages = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      const payloadMessages = newMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const authToken = token || localStorage.getItem("app_token");

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message || "Sorry, I ran into an issue processing your request.",
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to connect to the AI server. Please check your network connection.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat reset! How can I assist you now?",
      },
    ]);
  };

  const suggestions = [
    "What is the Apex Portal?",
    "How do I create a project?",
    "How do I manage employees?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Panel */}
      {isOpen && (
        <Card className="w-96 max-w-[92vw] h-[520px] shadow-2xl border border-border/80 bg-card text-card-foreground flex flex-col overflow-hidden mb-4 rounded-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <CardHeader className="py-3.5 px-4 bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary-foreground/15 backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  Apex AI Assistant
                </CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] opacity-80 font-normal">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                onClick={handleClearChat}
                title="Reset Conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white font-medium ${
                    msg.role === "user" ? "bg-indigo-600" : "bg-primary"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground border border-border/50 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted text-foreground px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-border/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"></span>
                  <span
                    className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Suggestions */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-1 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap transition-colors border border-border/40"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input Form */}
          <CardFooter className="p-3 border-t border-border/60 bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 w-full"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 text-xs h-9 rounded-xl focus-visible:ring-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="w-13 h-13 rounded-full shadow-xl bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-primary-foreground/20 flex items-center justify-center"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </div>
        )}
      </Button>
    </div>
  );
}
