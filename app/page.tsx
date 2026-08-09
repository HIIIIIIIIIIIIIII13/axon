"use client";

import { useState } from "react";

type Message = {
  role: "user" | "axon";
  text: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message;

    const updatedMessages: Message[] = [
      ...messages,
      {
        role: "user",
        text: userMessage,
      },
    ];

    setMessages([
      ...updatedMessages,
      {
        role: "axon",
        text: "",
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Something went wrong");
      }

      if (!response.body) {
        throw new Error("No response stream received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let axonReply = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, {
          stream: true,
        });

        axonReply += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];

          newMessages[newMessages.length - 1] = {
            role: "axon",
            text: axonReply,
          };

          return newMessages;
        });
      }
    } catch (error) {
      console.error("Axon chat error:", error);

      setMessages((prev) => {
        const newMessages = [...prev];

        newMessages[newMessages.length - 1] = {
          role: "axon",
          text: "I couldn't connect to my AI brain. Please try again.",
        };

        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    setMessages([]);
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-black/30 p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <img
            src="/axon-logo.png"
            alt="Axon logo"
            className="h-10 w-10 object-contain"
          />

          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-cyan-300">
              AXON
            </h1>
            <p className="text-xs text-white/40">AI Assistant</p>
          </div>
        </div>

        <button
          onClick={newChat}
          className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-left font-medium text-cyan-100 transition hover:bg-cyan-400/20"
        >
          + New chat
        </button>

        <div className="mt-6 text-xs uppercase tracking-wider text-white/30">
          Chats
        </div>

        <div className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">
          New conversation
        </div>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400 text-sm font-bold text-black">
              U
            </div>

            <div>
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-white/40">Axon account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <section className="flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 bg-black/20 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img
              src="/axon-logo.png"
              alt="Axon"
              className="h-8 w-8 object-contain md:hidden"
            />

            <div>
              <h2 className="font-semibold">Axon</h2>
              <p className="text-xs text-cyan-300/70">
                {loading ? "Thinking..." : "Online"}
              </p>
            </div>
          </div>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-200">
            AXON AI
          </div>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-5 py-8">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-3xl" />

                <img
                  src="/axon-logo.png"
                  alt="Axon logo"
                  className="relative h-44 w-44 object-contain drop-shadow-[0_0_35px_rgba(34,211,238,0.35)]"
                />
              </div>

              <h2 className="mt-7 text-3xl font-bold md:text-4xl">
                What can Axon help with?
              </h2>

              <p className="mt-3 max-w-lg text-white/45">
                Ask questions, create ideas, write code, solve problems, and
                explore anything.
              </p>

              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setMessage("Help me build an app")}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                >
                  <p className="font-medium">Build something</p>
                  <p className="mt-1 text-sm text-white/40">
                    Help me build an app
                  </p>
                </button>

                <button
                  onClick={() =>
                    setMessage("Explain something interesting")
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                >
                  <p className="font-medium">Learn something</p>
                  <p className="mt-1 text-sm text-white/40">
                    Explain something interesting
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((item, index) => (
                <div
                  key={index}
                  className={
                    item.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  {item.role === "axon" && (
                    <img
                      src="/axon-logo.png"
                      alt="Axon"
                      className="mr-3 mt-1 h-8 w-8 object-contain"
                    />
                  )}

                  <div
                    className={
                      item.role === "user"
                        ? "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-cyan-400 px-4 py-3 text-black"
                        : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-white/90"
                    }
                  >
                    {item.text ||
                      (loading &&
                      index === messages.length - 1 &&
                      item.role === "axon"
                        ? "..."
                        : "")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/5 bg-black/20 px-4 py-5">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-xl focus-within:border-cyan-400/30">
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-white/50 transition hover:bg-white/10 hover:text-white">
                +
              </button>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Message Axon..."
                rows={1}
                disabled={loading}
                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2.5 text-white outline-none placeholder:text-white/30 disabled:opacity-50"
              />

              <button
                onClick={sendMessage}
                disabled={!message.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
              >
                ↑
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-white/25">
              Axon can make mistakes. Check important information.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}