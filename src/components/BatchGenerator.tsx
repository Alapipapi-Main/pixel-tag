import JSZip from "jszip";
import QRCode from "qrcode";
import { FileSpreadsheet, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseBatchCsv, safeFileName, type BatchRow } from "@/lib/batch";
import { cn } from "@/lib/utils";

type Format = "png" | "svg";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function BatchGenerator({ dark, light, size }: { dark: string; light: string; size: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState<Format>("png");
  const [busy, setBusy] = useState(false);
  const [zip, setZip] = useState<Blob | null>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("CSV must be under 2MB"); return; }
    const parsed = parseBatchCsv(await file.text());
    if (!parsed.length) { toast.error("No rows found in that CSV"); return; }
    setRows(parsed);
    setFileName(file.name);
    setZip(null);
  };

  const generate = async () => {
    setBusy(true);
    try {
      const archive = new JSZip();
      const used = new Set<string>();
      const opts = { width: size, margin: 2, errorCorrectionLevel: "M" as const, color: { dark, light } };
      for (const [i, row] of rows.entries()) {
        const name = safeFileName(row.name, i, used);
        if (format === "svg") {
          archive.file(`${name}.svg`, await QRCode.toString(row.content, { ...opts, type: "svg" }));
        } else {
          const url = await QRCode.toDataURL(row.content, opts);
          archive.file(`${name}.png`, url.split(",")[1] ?? "", { base64: true });
        }
      }
      setZip(await archive.generateAsync({ type: "blob", compression: "STORE" }));
      toast.success(`${rows.length} QR codes ready`);
    } catch {
      toast.error("Some rows were too long to fit in a QR code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Batch generator" className="w-full animate-soft-in rounded-3xl border border-border/80 bg-card/90 p-4 shadow-soft backdrop-blur-xl sm:p-6">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-brand">Batch</p>
          <h2 className="font-display text-2xl font-bold">Make many codes from a CSV</h2>
          <p className="text-sm text-muted-foreground">
            One code per row. Use a <b>content</b> column (link or text) and an optional <b>name</b> column for file names, or just put content in the first column. Up to 500 rows. Uses your current QR color, background, and size.
          </p>
        </div>
        <div className="min-w-0 space-y-3">
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
            <Upload /> {fileName ? "Choose another CSV" : "Upload CSV"}
          </Button>
          {rows.length > 0 && (
            <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="size-4 shrink-0" />
              <span className="truncate">{fileName}</span>
              <span className="shrink-0">· {rows.length} rows</span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Batch format">
            {(["png", "svg"] as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={format === f}
                onClick={() => { setFormat(f); setZip(null); }}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  format === f ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          {zip ? (
            <Button className="w-full" onClick={() => downloadBlob(zip, `pixel-tag-batch-${format}.zip`)}>
              <Download /> Download ZIP
            </Button>
          ) : (
            <Button className="w-full" disabled={!rows.length || busy} onClick={() => void generate()}>
              {busy ? "Generating…" : `Generate ${rows.length || ""} codes`}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
