"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "axon";
  text: string;
};

type Profile = {
  id: string;
  email: string | null;
  is_admin: boolean;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export default function Home() {
  const supabase = createClient();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);

  useEffect(() => {
    loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAccount();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadAccount() {
    setAccountLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfile(null);
        setConversations([]);
        setActiveConversationId(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile error:", error);
        setProfile(null);
        return;
      }

      setProfile(data as Profile);

      await loadConversations();
    } finally {
      setAccountLoading(false);
    }
  }

  async function loadConversations() {
    setChatsLoading(true);

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, created_at, updated_at")
        .order("updated_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Conversation load error:",
          error
        );

        return;
      }

      setConversations(
        (data ?? []) as Conversation[]
      );
    } finally {
      setChatsLoading(false);
    }
  }

  async function openConversation(
    conversationId: string
  ) {
    if (loading) {
      return;
    }

    setActiveConversationId(
      conversationId
    );

    setMessage("");

    const { data, error } =
      await supabase
        .from("messages")
        .select(
          "role, content, created_at"
        )
        .eq(
          "conversation_id",
          conversationId
        )
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Message load error:",
        error
      );

      return;
    }

    const loadedMessages: Message[] =
      (data ?? []).map((item) => ({
        role: item.role as
          | "user"
          | "axon",

        text: item.content,
      }));

    setMessages(loadedMessages);
  }

  function createChatTitle(
    text: string
  ) {
    const cleaned = text
      .replace(/\s+/g, " ")
      .replace(/[?!.,]+$/g, "")
      .trim();

    if (!cleaned) {
      return "New chat";
    }

    const words =
      cleaned.split(" ");

    let title = words
      .slice(0, 7)
      .join(" ");

    if (title.length > 45) {
      title = title
        .slice(0, 45)
        .trim();
    }

    return (
      title.charAt(0).toUpperCase() +
      title.slice(1)
    );
  }

  async function createConversation(
    firstMessage: string
  ): Promise<string | null> {
    if (!profile) {
      return null;
    }

    const title =
      createChatTitle(firstMessage);

    const { data, error } =
      await supabase
        .from("conversations")
        .insert({
          user_id: profile.id,
          title,
        })
        .select(
          "id, title, created_at, updated_at"
        )
        .single();

    if (error) {
      console.error(
        "Create conversation error:",
        error
      );

      return null;
    }

    const newConversation =
      data as Conversation;

    setActiveConversationId(
      newConversation.id
    );

    setConversations((prev) => [
      newConversation,
      ...prev.filter(
        (chat) =>
          chat.id !==
          newConversation.id
      ),
    ]);

    return newConversation.id;
  }

  async function saveMessage(
    conversationId: string,
    role: "user" | "axon",
    content: string
  ) {
    const { error } =
      await supabase
        .from("messages")
        .insert({
          conversation_id:
            conversationId,

          role,
          content,
        });

    if (error) {
      console.error(
        "Save message error:",
        error
      );

      return;
    }

    const now =
      new Date().toISOString();

    const { error: updateError } =
      await supabase
        .from("conversations")
        .update({
          updated_at: now,
        })
        .eq(
          "id",
          conversationId
        );

    if (updateError) {
      console.error(
        "Conversation update error:",
        updateError
      );

      return;
    }

    setConversations((prev) => {
      const conversation =
        prev.find(
          (chat) =>
            chat.id ===
            conversationId
        );

      if (!conversation) {
        return prev;
      }

      const updatedConversation = {
        ...conversation,
        updated_at: now,
      };

      return [
        updatedConversation,
        ...prev.filter(
          (chat) =>
            chat.id !==
            conversationId
        ),
      ];
    });
  }

  async function deleteConversation(
    conversationId: string
  ) {
    if (loading) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this chat?"
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await supabase
        .from("conversations")
        .delete()
        .eq(
          "id",
          conversationId
        );

    if (error) {
      console.error(
        "Delete conversation error:",
        error
      );

      alert(
        "Could not delete chat."
      );

      return;
    }

    setConversations((prev) =>
      prev.filter(
        (chat) =>
          chat.id !==
          conversationId
      )
    );

    if (
      activeConversationId ===
      conversationId
    ) {
      setActiveConversationId(
        null
      );

      setMessages([]);
      setMessage("");
    }
  }

  async function logout() {
    await supabase.auth.signOut();

    setProfile(null);
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    setAccountMenuOpen(false);

    window.location.href = "/";
  }

  async function sendMessage() {
    if (
      !message.trim() ||
      loading
    ) {
      return;
    }

    const userMessage =
      message.trim();

    const updatedMessages: Message[] =
      [
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

    let conversationId =
      activeConversationId;

    try {
      if (
        profile &&
        !conversationId
      ) {
        conversationId =
          await createConversation(
            userMessage
          );
      }

      if (
        profile &&
        conversationId
      ) {
        await saveMessage(
          conversationId,
          "user",
          userMessage
        );
      }

      const response =
        await fetch("/api/chat", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            messages:
              updatedMessages,
          }),
        });

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Something went wrong"
        );
      }

      if (!response.body) {
        throw new Error(
          "No response stream received"
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let axonReply = "";

      while (true) {
        const {
          done,
          value,
        } = await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        axonReply += chunk;

        setMessages((prev) => {
          const newMessages = [
            ...prev,
          ];

          newMessages[
            newMessages.length - 1
          ] = {
            role: "axon",
            text: axonReply,
          };

          return newMessages;
        });
      }

      if (
        profile &&
        conversationId &&
        axonReply.trim()
      ) {
        await saveMessage(
          conversationId,
          "axon",
          axonReply
        );
      }
    } catch (error) {
      console.error(
        "Axon chat error:",
        error
      );

      setMessages((prev) => {
        const newMessages = [
          ...prev,
        ];

        newMessages[
          newMessages.length - 1
        ] = {
          role: "axon",

          text:
            "I couldn't connect to my AI brain. Please try again.",
        };

        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    if (loading) {
      return;
    }

    setMessages([]);
    setMessage("");

    setActiveConversationId(
      null
    );
  }

  function goToLogin() {
    window.location.href =
      "/login";
  }

  function getInitial() {
    if (!profile?.email) {
      return "U";
    }

    return profile.email
      .charAt(0)
      .toUpperCase();
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white flex">
      {/* SIDEBAR */}

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

            <p className="text-xs text-white/40">
              AI Assistant
            </p>
          </div>
        </div>

        <button
          onClick={newChat}
          disabled={loading}
          className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-left font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50"
        >
          + New chat
        </button>

        <div className="mt-6 text-xs uppercase tracking-wider text-white/30">
          {profile
            ? "Recent chats"
            : "Chats"}
        </div>

        {/* RECENT CHATS */}

        <div className="mt-3 flex-1 overflow-y-auto">
          {profile ? (
            <>
              {chatsLoading ? (
                <p className="px-3 py-3 text-sm text-white/30">
                  Loading chats...
                </p>
              ) : conversations.length ===
                0 ? (
                <p className="px-3 py-3 text-sm text-white/30">
                  No chats yet
                </p>
              ) : (
                <div className="space-y-1">
                  {conversations.map(
                    (chat) => (
                      <div
                        key={
                          chat.id
                        }
                        className={`group flex items-center gap-1 rounded-xl transition ${
                          activeConversationId ===
                          chat.id
                            ? "bg-cyan-400/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <button
                          onClick={() =>
                            openConversation(
                              chat.id
                            )
                          }
                          className={`min-w-0 flex-1 truncate px-3 py-3 text-left text-sm ${
                            activeConversationId ===
                            chat.id
                              ? "text-cyan-200"
                              : "text-white/60 group-hover:text-white"
                          }`}
                          title={
                            chat.title
                          }
                        >
                          {
                            chat.title
                          }
                        </button>

                        <button
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            deleteConversation(
                              chat.id
                            );
                          }}
                          className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs text-white/30 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                          title="Delete chat"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/50">
              Log in to save your
              chats
            </div>
          )}
        </div>

        {/* ACCOUNT */}

        <div className="mt-4 border-t border-white/10 pt-4">
          {profile ? (
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400 text-sm font-bold text-black">
                {getInitial()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {profile.email}
                </p>

                <p className="text-xs font-semibold text-cyan-300">
                  {profile.is_admin
                    ? "ADMIN"
                    : "AXON USER"}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={goToLogin}
              className="w-full rounded-xl px-2 py-2 text-left text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}

      <section className="flex min-h-screen flex-1 flex-col">
        {/* HEADER */}

        <header className="flex items-center justify-between border-b border-white/10 bg-black/20 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img
              src="/axon-logo.png"
              alt="Axon"
              className="h-8 w-8 object-contain md:hidden"
            />

            <div>
              <h2 className="font-semibold">
                Axon
              </h2>

              <p className="text-xs text-cyan-300/70">
                {loading
                  ? "Thinking..."
                  : "Online"}
              </p>
            </div>
          </div>

          {/* TOP RIGHT */}

          <div className="relative flex items-center gap-2 md:gap-3">
            {!accountLoading &&
              (profile ? (
                <>
                  <button
                    onClick={() =>
                      setAccountMenuOpen(
                        !accountMenuOpen
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-black">
                      {getInitial()}
                    </div>

                    <div className="hidden text-left sm:block">
                      <p className="max-w-36 truncate text-xs text-white/80">
                        {
                          profile.email
                        }
                      </p>

                      <p className="text-[10px] font-semibold text-cyan-300">
                        {profile.is_admin
                          ? "ADMIN"
                          : "AXON USER"}
                      </p>
                    </div>
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-white/10 bg-[#0b0e12] p-4 shadow-2xl">
                      <p className="truncate text-sm font-medium">
                        {
                          profile.email
                        }
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                          AXON USER
                        </span>

                        {profile.is_admin && (
                          <span className="rounded-full bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-300">
                            ADMIN
                          </span>
                        )}
                      </div>

                      <button
                        onClick={
                          logout
                        }
                        className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={
                    goToLogin
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white md:px-4 md:text-sm"
                >
                  Login / Sign Up
                </button>
              ))}
          </div>
        </header>

        {/* CHAT */}

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
                What can Axon help
                with?
              </h2>

              <p className="mt-3 max-w-lg text-white/45">
                Ask questions, create
                ideas, write code, solve
                problems, and explore
                anything.
              </p>

              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                <button
                  onClick={() =>
                    setMessage(
                      "Help me build an app"
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                >
                  <p className="font-medium">
                    Build something
                  </p>

                  <p className="mt-1 text-sm text-white/40">
                    Help me build an app
                  </p>
                </button>

                <button
                  onClick={() =>
                    setMessage(
                      "Explain something interesting"
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                >
                  <p className="font-medium">
                    Learn something
                  </p>

                  <p className="mt-1 text-sm text-white/40">
                    Explain something
                    interesting
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={index}
                    className={
                      item.role ===
                      "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    {item.role ===
                      "axon" && (
                      <img
                        src="/axon-logo.png"
                        alt="Axon"
                        className="mr-3 mt-1 h-8 w-8 object-contain"
                      />
                    )}

                    <div
                      className={
                        item.role ===
                        "user"
                          ? "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-cyan-400 px-4 py-3 text-black"
                          : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-white/90"
                      }
                    >
                      {item.text ||
                        (loading &&
                        index ===
                          messages.length -
                            1 &&
                        item.role ===
                          "axon"
                          ? "..."
                          : "")}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* INPUT */}

        <div className="border-t border-white/5 bg-black/20 px-4 py-5">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-xl focus-within:border-cyan-400/30">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                +
              </button>

              <textarea
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                      "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();

                    sendMessage();
                  }
                }}
                placeholder="Message Axon..."
                rows={1}
                disabled={
                  loading
                }
                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2.5 text-white outline-none placeholder:text-white/30 disabled:opacity-50"
              />

              <button
                onClick={
                  sendMessage
                }
                disabled={
                  !message.trim() ||
                  loading
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
              >
                ↑
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-white/25">
              Axon can make mistakes.
              Check important
              information.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}