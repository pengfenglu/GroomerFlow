import { parseISO } from "date-fns";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type StaleClientRow = {
  clientId: string;
  clientName: string;
  petNames: string[];
  daysSinceVisit: number;
  lastVisitAt: string | null;
};

/** Clients with no completed visit in the last `inactiveDays` (rule-based, not AI). */
export function findStaleClients(params: {
  clients: { id: string; full_name: string; created_at: string }[];
  petsByClient: Map<string, { name: string }[]>;
  lastVisitByClient: Map<string, string | null>;
  inactiveDays?: number;
  limit?: number;
}): StaleClientRow[] {
  const { clients, petsByClient, lastVisitByClient, inactiveDays = 90, limit = 8 } =
    params;
  const now = Date.now();
  const cutoffMs = inactiveDays * MS_PER_DAY;

  const rows: StaleClientRow[] = [];

  for (const client of clients) {
    const lastVisit = lastVisitByClient.get(client.id) ?? null;
    const referenceIso = lastVisit ?? client.created_at;
    const referenceMs = parseISO(referenceIso).getTime();
    const idleMs = now - referenceMs;

    if (idleMs < cutoffMs) continue;

    const daysSinceVisit = Math.floor(idleMs / MS_PER_DAY);
    rows.push({
      clientId: client.id,
      clientName: client.full_name,
      petNames: (petsByClient.get(client.id) ?? []).map((p) => p.name),
      daysSinceVisit,
      lastVisitAt: lastVisit,
    });
  }

  rows.sort((a, b) => b.daysSinceVisit - a.daysSinceVisit);
  return rows.slice(0, limit);
}
