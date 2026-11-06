export type BatchRow = { content: string; name: string };

/** Parse a CSV (quotes supported). Uses a "content"/"url"/"text" column if a header exists, else the first column; optional "name" column. */
export function parseBatchCsv(text: string, limit = 500): BatchRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  row.push(cell); rows.push(row);
  const clean = rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
  if (!clean.length) return [];
  const header = (clean[0] ?? []).map((c) => c.toLowerCase());
  const contentIdx = header.findIndex((h) => ["content", "url", "link", "text", "data"].includes(h));
  const nameIdx = header.findIndex((h) => ["name", "filename", "label", "title"].includes(h));
  const hasHeader = contentIdx >= 0 || nameIdx >= 0;
  const body = hasHeader ? clean.slice(1) : clean;
  // No content column found: use every column (except name) joined with spaces.
  const pick = (r: string[]) =>
    contentIdx >= 0 ? (r[contentIdx] ?? "") : r.filter((c, i) => i !== nameIdx && c).join(" ");
  return body
    .map((r) => ({ content: pick(r), name: nameIdx >= 0 ? (r[nameIdx] ?? "") : "" }))
    .filter((r) => r.content)
    .slice(0, limit);
}

export function safeFileName(name: string, index: number, used: Set<string>) {
  const base = name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || `qr-${String(index + 1).padStart(3, "0")}`;
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${base}-${n++}`;
  used.add(candidate.toLowerCase());
  return candidate;
}
