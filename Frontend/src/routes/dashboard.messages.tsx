import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FileText, MessageCircle, Paperclip, Search, Send, Trash2, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ApiError } from "@/lib/api/client";
import { messagesApi, type Message, type MessageThread, type ThreadUser } from "@/lib/api/messages";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/stores/auth";

const messagesSearchSchema = z.object({
  threadId: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/messages")({
  validateSearch: messagesSearchSchema,
  head: () => ({ meta: [{ title: "Messages - Roomzly" }] }),
  component: MessagesPage,
});

function initials(user?: ThreadUser) {
  if (!user) return "R";
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "R";
}

function displayName(user?: ThreadUser) {
  if (!user) return "Roomzly user";
  return `${user.firstName} ${user.lastName}`;
}

function otherParticipant(thread: MessageThread, currentUserId: string) {
  return thread.participants.find((p) => p.userId !== currentUserId)?.user;
}

function MessagesPage() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/dashboard/messages" });
  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [threadFilter, setThreadFilter] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingResetTimeoutRef = useRef<number | null>(null);
  const lastTypingEmitRef = useRef(0);

  const threadsQuery = useQuery({
    queryKey: ["message-threads"],
    queryFn: messagesApi.threads,
  });
  const threads = threadsQuery.data ?? [];
  const activeThreadId = active && threads.some((thread) => thread.id === active) ? active : null;
  const threadQuery = useQuery({
    queryKey: ["message-thread", activeThreadId],
    queryFn: () => messagesApi.thread(activeThreadId!),
    enabled: Boolean(activeThreadId),
  });
  const current = threadQuery.data ?? threads.find((thread) => thread.id === activeThreadId);
  const peer = current && user ? otherParticipant(current, user.id) : undefined;
  const messages = current?.messages ?? [];

  const sendMutation = useMutation({
    mutationFn: ({ threadId, body, files }: { threadId: string; body: string; files: File[] }) =>
      files.length > 0 ? messagesApi.sendWithAttachments(threadId, body, files) : messagesApi.send(threadId, body),
    onSuccess: () => {
      setDraft("");
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
      queryClient.invalidateQueries({ queryKey: ["message-thread", activeThreadId] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Message could not be sent");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: messagesApi.deleteThread,
    onSuccess: ({ threadId }) => {
      toast.success("Conversation deleted");
      setActive(null);
      setDraft("");
      navigate({ search: {} });
      queryClient.removeQueries({ queryKey: ["message-thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Conversation could not be deleted");
    },
  });

  useEffect(() => {
    if (search.threadId && threads.some((thread) => thread.id === search.threadId)) {
      setActive(search.threadId);
      return;
    }
    if (active && threads.length > 0 && !threads.some((thread) => thread.id === active)) {
      setActive(null);
    }
  }, [active, search.threadId, threads]);

  useEffect(() => {
    if (!accessToken || !activeThreadId) return;
    const socket = getSocket(accessToken);
    socket.emit("join_thread", activeThreadId);

    const onMessage = (message: Message) => {
      queryClient.setQueryData<MessageThread | undefined>(["message-thread", message.threadId], (previous) => {
        if (!previous || previous.messages.some((item) => item.id === message.id)) return previous;
        return { ...previous, messages: [...previous.messages, message], updatedAt: message.createdAt };
      });
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
    };
    const onTyping = (payload: { userId: string; threadId: string }) => {
      if (payload.threadId === activeThreadId && payload.userId !== user?.id) {
        setTypingUser(payload.userId);
        if (typingResetTimeoutRef.current !== null) {
          window.clearTimeout(typingResetTimeoutRef.current);
        }
        typingResetTimeoutRef.current = window.setTimeout(() => {
          setTypingUser(null);
          typingResetTimeoutRef.current = null;
        }, 1800);
      }
    };
    const onRead = (payload: { userId: string; threadId: string; readAt: string }) => {
      if (payload.threadId !== activeThreadId) return;
      setReadReceipts((current) => ({ ...current, [payload.userId]: payload.readAt }));
      queryClient.setQueryData<MessageThread | undefined>(["message-thread", payload.threadId], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          participants: previous.participants.map((participant) =>
            participant.userId === payload.userId ? { ...participant, lastReadAt: payload.readAt } : participant,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
    };
    const onThreadDeleted = (payload: { threadId: string }) => {
      queryClient.removeQueries({ queryKey: ["message-thread", payload.threadId] });
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
      if (payload.threadId === activeThreadId) {
        setActive(null);
        setDraft("");
        navigate({ search: {} });
        toast("Conversation deleted");
      }
    };

    socket.on("new_message", onMessage);
    socket.on("typing", onTyping);
    socket.on("messages_read", onRead);
    socket.on("thread_deleted", onThreadDeleted);
    return () => {
      socket.emit("leave_thread", activeThreadId);
      socket.off("new_message", onMessage);
      socket.off("typing", onTyping);
      socket.off("messages_read", onRead);
      socket.off("thread_deleted", onThreadDeleted);
      if (typingResetTimeoutRef.current !== null) {
        window.clearTimeout(typingResetTimeoutRef.current);
        typingResetTimeoutRef.current = null;
      }
    };
  }, [accessToken, activeThreadId, navigate, queryClient, user?.id]);

  useEffect(() => {
    if (!activeThreadId) return;
    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeThreadId, messages.length]);

  const filteredThreads = useMemo(() => {
    const query = threadFilter.trim().toLowerCase();
    if (!query) return threads;

    return threads.filter((thread) => {
      const other = user ? otherParticipant(thread, user.id) : undefined;
      const searchable = [
        displayName(other),
        thread.property?.title ?? "",
        thread.messages[0]?.body ?? "",
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    });
  }, [threadFilter, threads, user]);

  const openThread = (threadId: string) => {
    setActive(threadId);
    setDraft("");
    setAttachments([]);
    navigate({ search: { threadId } });
  };

  const showThreads = () => {
    setActive(null);
    setDraft("");
    setAttachments([]);
    navigate({ search: {} });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeThreadId || (!draft.trim() && attachments.length === 0)) return;
    sendMutation.mutate({ threadId: activeThreadId, body: draft.trim(), files: attachments });
  };

  const selectAttachments = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
        toast.error(`${file.name} is not supported`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        continue;
      }
      accepted.push(file);
    }
    setAttachments((current) => {
      const next = [...current, ...accepted];
      if (next.length > 3) toast.error("Attach up to 3 files per message");
      return next.slice(0, 3);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const emitTyping = () => {
    if (!accessToken || !activeThreadId) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 1200) return;
    lastTypingEmitRef.current = now;
    getSocket(accessToken).emit("typing", { threadId: activeThreadId });
  };

  const latestPeerReadAt = peer ? readReceipts[peer.id] ?? current?.participants.find((p) => p.userId === peer.id)?.lastReadAt : undefined;

  return (
    <div className="grid h-[calc(100dvh-3.5rem)] grid-cols-1 overflow-hidden bg-background md:grid-cols-[320px_1fr]">
      <aside
        className={cn(
          "min-h-0 flex-col border-r border-border bg-background",
          activeThreadId ? "hidden md:flex" : "flex",
        )}
      >
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-mono-eyebrow">Inbox</p>
              <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight">Messages</h1>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {threads.length}
            </span>
          </div>
          <div className="flex h-11 items-center gap-2 border border-border px-3">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={threadFilter}
              onChange={(event) => setThreadFilter(event.target.value)}
              placeholder="Search messages"
              className="w-full bg-transparent text-base focus:outline-none placeholder:text-muted-foreground/60 sm:text-sm"
            />
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {threadsQuery.isLoading && <p className="p-4 text-mono-eyebrow">Loading conversations</p>}
          {threadsQuery.isError && (
            <button type="button" onClick={() => threadsQuery.refetch()} className="m-4 text-mono-eyebrow text-accent">
              Retry conversations
            </button>
          )}
          {filteredThreads.map((thread) => {
            const other = user ? otherParticipant(thread, user.id) : undefined;
            const last = thread.messages[0];
            return (
              <button
                key={thread.id}
                onClick={() => openThread(thread.id)}
                className={cn(
                  "flex min-h-[76px] w-full touch-manipulation gap-3 border-b border-border px-4 py-3 text-left transition-colors",
                  activeThreadId === thread.id ? "bg-surface-hi" : "hover:bg-surface-hi/50",
                )}
              >
                <Avatar className="size-10 shrink-0">
                  <AvatarFallback className="bg-foreground text-background text-xs font-mono font-bold">
                    {initials(other)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-sm font-medium truncate">{displayName(other)}</p>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {new Date(thread.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{last?.body ?? "Conversation started"}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-1 truncate">
                    {thread.property?.title ?? "General"}
                  </p>
                </div>
                {Boolean(thread.unreadCount) && (
                  <span className="mt-1 min-w-5 h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-mono font-bold grid place-items-center">
                    {thread.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
          {!threadsQuery.isLoading && filteredThreads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              {threadFilter.trim() ? "No matching conversations." : "No conversations yet."}
            </p>
          )}
        </ScrollArea>
      </aside>

      <section className={cn("min-h-0 flex-col bg-background", activeThreadId ? "flex" : "hidden md:flex")}>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-5">
          {activeThreadId && (
            <button
              type="button"
              onClick={showThreads}
              className="grid size-9 shrink-0 place-items-center rounded-sm border border-border text-muted-foreground hover:bg-surface-hi hover:text-foreground md:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <Avatar className={cn("size-9 shrink-0", !activeThreadId && "hidden md:flex")}>
            <AvatarFallback className="bg-foreground text-background text-xs font-mono font-bold">
              {initials(peer)}
            </AvatarFallback>
          </Avatar>
          {!activeThreadId && (
            <div className="hidden size-9 shrink-0 place-items-center border border-border text-muted-foreground md:grid">
              <MessageCircle className="size-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName(peer)}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {current?.property?.title ?? "Select a conversation"}
            </p>
          </div>
          {activeThreadId && current && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="size-9 grid place-items-center rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-colors"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="size-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the chat history for both participants. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(activeThreadId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center gap-2"
                  >
                    <Trash2 className="size-3.5" /> Delete chat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:p-6">
          {!activeThreadId && (
            <div className="h-full grid place-items-center text-center">
              <div>
                <p className="text-mono-eyebrow mb-3">No conversation selected</p>
                <p className="text-sm text-muted-foreground">Choose a conversation from the left to view messages.</p>
              </div>
            </div>
          )}
          {threadQuery.isLoading && <p className="text-mono-eyebrow">Loading messages</p>}
          {messages.map((message) => {
            const mine = message.senderId === user?.id;
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[84%] break-words rounded-lg border px-3.5 py-2.5 text-sm sm:max-w-[70%] sm:rounded-sm sm:px-4",
                    mine ? "bg-foreground text-background border-foreground" : "bg-surface-hi border-border",
                  )}
                >
                  <p>{message.body}</p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "block overflow-hidden border text-xs",
                            mine ? "border-background/20 bg-background/10" : "border-border bg-background/60",
                          )}
                        >
                          {attachment.mimeType.startsWith("image/") ? (
                            <img
                              src={attachment.url}
                              alt={attachment.fileName}
                              className="max-h-48 w-full object-contain bg-black/10"
                              loading="lazy"
                            />
                          ) : (
                            <span className="flex items-center gap-2 px-3 py-2">
                              <FileText className="size-4 shrink-0" />
                              <span className="truncate">{attachment.fileName}</span>
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className={cn("font-mono text-[10px] mt-1", mine ? "text-background/60" : "text-muted-foreground")}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {mine && latestPeerReadAt && new Date(latestPeerReadAt) >= new Date(message.createdAt) ? " · read" : ""}
                  </p>
                </div>
              </div>
            );
          })}
          {typingUser && <p className="text-xs text-muted-foreground">Typing...</p>}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={submit}
          className="shrink-0 space-y-3 border-t border-border bg-background px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:p-4"
        >
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:pl-11">
              {attachments.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 border border-border bg-surface-hi px-2.5 py-1.5 text-xs sm:max-w-52"
                >
                  {file.type.startsWith("image/") ? <Paperclip className="size-3.5 shrink-0" /> : <FileText className="size-3.5 shrink-0" />}
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="sr-only"
              onChange={(event) => selectAttachments(event.target.files)}
            />
            <button
              type="button"
              disabled={!activeThreadId || attachments.length >= 3}
              onClick={() => fileInputRef.current?.click()}
              className="grid size-11 shrink-0 place-items-center rounded-sm hover:bg-surface-hi disabled:opacity-50 sm:size-9"
              aria-label="Attach files"
            >
              <Paperclip className="size-4" />
            </button>
            <input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                emitTyping();
              }}
              disabled={!activeThreadId}
              placeholder="Write a message..."
              className="h-11 min-w-0 flex-1 rounded-sm border border-border bg-surface-hi px-3 text-base focus:border-foreground focus:outline-none sm:h-10 sm:text-sm"
            />
            <button
              type="submit"
              disabled={!activeThreadId || sendMutation.isPending || (!draft.trim() && attachments.length === 0)}
              className="grid size-11 shrink-0 place-items-center rounded-sm bg-accent text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 sm:flex sm:size-auto sm:h-10 sm:gap-2 sm:px-4"
              aria-label="Send message"
            >
              <span className="hidden sm:inline">{sendMutation.isPending ? "Sending" : "Send"}</span>
              <Send className="size-4 sm:size-3" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
