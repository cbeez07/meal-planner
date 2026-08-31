"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client/api";

type Staple = { id: string; name: string };

export default function StaplesPage() {
  const [staples, setStaples] = useState<Staple[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const data = await api<{ staples: Staple[] }>("/api/staples");
    setStaples(data.staples);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await api("/api/staples", { method: "POST", body: JSON.stringify({ name }) });
    setName("");
    await load();
  }

  async function remove(id: string) {
    await api(`/api/staples/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <h1 className="text-3xl">Staples</h1>
      <p className="mt-1 text-muted">These never appear on the shopping list.</p>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-line bg-paper-2 px-3 py-3"
          placeholder="We always have…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded-full bg-sage px-4 py-2 text-white" type="submit">
          Add
        </button>
      </form>
      <ul className="mt-5 space-y-2">
        {staples.map((staple) => (
          <li
            key={staple.id}
            className="flex items-center justify-between rounded-2xl border border-line bg-paper-2 px-4 py-3"
          >
            <span>{staple.name}</span>
            <button type="button" className="text-sm text-terracotta" onClick={() => remove(staple.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
