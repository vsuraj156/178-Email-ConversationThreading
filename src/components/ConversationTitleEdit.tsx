"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConversationTitleEdit({
  conversationId,
  initialTitle,
}: {
  conversationId: string;
  initialTitle: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-lg font-semibold text-gray-900 min-w-[200px]"
          autoFocus
        />
        <button
          type="submit"
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setTitle(initialTitle);
            setEditing(false);
          }}
          className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <h1 className="text-xl font-semibold text-gray-900">{initialTitle}</h1>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        Edit title
      </button>
    </div>
  );
}
