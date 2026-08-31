"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client/api";

type Item = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  aisle: string;
  checked: number;
  source: string;
};
type Group = { aisle: string; items: Item[] };

export default function ShopPage() {
  const [weekId, setWeekId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const week = await api<{ id: string }>("/api/weeks");
    setWeekId(week.id);
    const list = await api<{ groups: Group[] }>(`/api/weeks/${week.id}/shopping-list`);
    setGroups(list.groups);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function toggle(item: Item) {
    if (!weekId) return;
    const list = await api<{ groups: Group[] }>(`/api/weeks/${weekId}/shopping-list/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ checked: item.checked !== 1 }),
    });
    setGroups(list.groups);
  }

  async function addManual(event: FormEvent) {
    event.preventDefault();
    if (!weekId || !name.trim()) return;
    const list = await api<{ groups: Group[] }>(`/api/weeks/${weekId}/shopping-list`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setGroups(list.groups);
    setName("");
  }

  return (
    <div>
      <h1 className="text-3xl">Shop</h1>
      <p className="mt-1 text-muted">Scaled to five. Staples stay home.</p>
      <form onSubmit={addManual} className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-line bg-paper-2 px-3 py-3"
          placeholder="Add an extra item"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded-full bg-sage px-4 py-2 text-white" type="submit">
          Add
        </button>
      </form>
      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <section key={group.aisle}>
            <h2 className="text-xl capitalize">{group.aisle.replace("_", " ")}</h2>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                      item.checked ? "border-line bg-chip text-muted line-through" : "border-line bg-paper-2"
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line">
                      {item.checked ? "✓" : ""}
                    </span>
                    <span className="text-lg">
                      {item.amount != null ? `${pretty(item.amount)} ` : ""}
                      {item.unit ? `${item.unit} ` : ""}
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 ? <p className="text-muted">Plan a dinner to build this list.</p> : null}
      </div>
    </div>
  );
}

function pretty(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
