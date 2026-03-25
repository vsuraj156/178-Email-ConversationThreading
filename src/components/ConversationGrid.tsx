"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Message = {
  id: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  body?: string;
  threadId: string;
  labelIds: string[];
};

// ─── Card ────────────────────────────────────────────────────────────────────

function EmailCard({
  message,
  color,
  onClick,
}: {
  message: Message;
  color: string;
  onClick: (m: Message) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: message.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderLeftColor: color,
        borderLeftWidth: "4px",
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? "grabbing" : "pointer",
      }}
      {...attributes}
      {...listeners}
      onClick={() => onClick(message)}
      className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow select-none flex flex-col gap-1"
    >
      <div className="text-xs text-gray-500 truncate">{message.from}</div>
      <div className="font-medium text-gray-900 text-sm truncate">
        {message.subject}
      </div>
      <div className="text-xs text-gray-400">
        {new Date(message.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-3">
        {message.snippet}
      </p>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function EmailModal({
  message,
  color,
  onClose,
}: {
  message: Message;
  color: string;
  onClose: () => void;
}) {
  const [fullBody, setFullBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/messages/${message.id}`)
      .then((r) => r.json())
      .then((data) => setFullBody(data.message?.body ?? message.snippet))
      .catch(() => setFullBody(message.snippet))
      .finally(() => setLoading(false));
  }, [message.id, message.snippet]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col"
        style={{
          borderTopColor: color,
          borderTopWidth: "4px",
          maxHeight: "85vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="p-5 pb-3 flex-shrink-0">
          <div className="flex justify-between items-start gap-4 mb-3">
            <h2 className="font-semibold text-gray-900 text-base leading-snug">
              {message.subject}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{message.from}</span>
            <span>
              {new Date(message.date).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          {message.labelIds?.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {message.labelIds.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
          <div className="border-t mt-3" />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {loading ? (
            <div className="text-sm text-gray-400 py-4">Loading...</div>
          ) : fullBody?.trimStart().startsWith("<") ? (
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: fullBody }}
            />
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {fullBody}
            </div>
          )}
          <a
            href={`https://mail.google.com/mail/u/0/#inbox/${message.threadId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-xs text-blue-600 hover:underline inline-block"
          >
            Open in Gmail →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────

export function ConversationGrid({
  initialMessages,
  threadColor,
  conversationId,
}: {
  initialMessages: Message[];
  threadColor: Record<string, string>;
  conversationId: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [modalMessage, setModalMessage] = useState<Message | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitSelected, setSplitSelected] = useState<Set<string>>(new Set());
  const [isSplitting, startSplitTransition] = useTransition();

  function toggleSplitSelect(id: string) {
    setSplitSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exitSplitMode() {
    setSplitMode(false);
    setSplitSelected(new Set());
  }

  async function handleSplit() {
    if (splitSelected.size === 0) return;
    const res = await fetch(`/api/conversations/${conversationId}/split`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds: Array.from(splitSelected) }),
    });
    const data = await res.json();
    exitSplitMode();
    startSplitTransition(() => {
      if (data.newConvId) {
        router.push(`/conversations/${data.newConvId}`);
      } else {
        router.refresh();
      }
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // click without drag opens modal
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMessages((prev) => {
        const oldIndex = prev.findIndex((m) => m.id === active.id);
        const newIndex = prev.findIndex((m) => m.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  return (
    <>
      {/* Split mode toolbar */}
      <div className="flex items-center gap-3 mb-3">
        {!splitMode ? (
          <button
            onClick={() => setSplitMode(true)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
          >
            Split conversation
          </button>
        ) : (
          <>
            <span className="text-sm text-orange-700 font-medium">
              Select emails to split out
            </span>
            <button
              onClick={handleSplit}
              disabled={splitSelected.size === 0 || isSplitting}
              className="text-sm px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-40"
            >
              {isSplitting
                ? "Splitting…"
                : `Split ${splitSelected.size} email${splitSelected.size === 1 ? "" : "s"} into new conversation`}
            </button>
            <button
              onClick={exitSplitMode}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={messages.map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {messages.map((m) => (
              <div key={m.id} className="relative">
                {splitMode && (
                  <input
                    type="checkbox"
                    checked={splitSelected.has(m.id)}
                    onChange={() => toggleSplitSelect(m.id)}
                    className="absolute top-2 right-2 z-10 w-4 h-4 rounded border-gray-300 text-orange-600 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <EmailCard
                  key={m.id}
                  message={m}
                  color={threadColor[m.threadId] ?? "#e5e7eb"}
                  onClick={splitMode ? (msg) => toggleSplitSelect(msg.id) : setModalMessage}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modalMessage && (
        <EmailModal
          message={modalMessage}
          color={threadColor[modalMessage.threadId] ?? "#e5e7eb"}
          onClose={() => setModalMessage(null)}
        />
      )}
    </>
  );
}
