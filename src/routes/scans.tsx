import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Copy, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getDeviceId } from "@/lib/device-id";
import { deleteDeviceLink, listDeviceLinks } from "@/lib/links.functions";

export const Route = createFileRoute("/scans")({
  head: () => ({
    meta: [
      { title: "Scan Dashboard — Pixel Tag" },
      { name: "description", content: "See how many times your tracked Pixel Tag QR codes were scanned, by country and device. No account needed." },
      { property: "og:title", content: "Scan Dashboard — Pixel Tag" },
      { property: "og:description", content: "Track QR code scans by country and device, with no sign-up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScansPage,
});

function ScansPage() {
  const [deviceId, setDeviceId] = useState("");
  useEffect(() => setDeviceId(getDeviceId()), []);
  const list = useServerFn(listDeviceLinks);
  const remove = useServerFn(deleteDeviceLink);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["device-links", deviceId],
    queryFn: () => list({ data: { deviceId } }),
    enabled: !!deviceId,
  });
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const onDelete = async (slug: string) => {
    if (!window.confirm("Delete this tracked link? Printed codes using it will stop working.")) return;
    try {
      await remove({ data: { deviceId, slug } });
      toast.success("Tracked link deleted");
      qc.invalidateQueries({ queryKey: ["device-links", deviceId] });
    } catch {
      toast.error("Could not delete link");
    }
  };

  const links = query.data ?? [];
  const totalScans = links.reduce((sum, l) => sum + l.total, 0);

  return (
    <main className="mx-auto w-full max-w-5xl overflow-x-clip px-4 py-8 sm:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Link to="/" className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4 shrink-0" /> Back to generator
        </Link>
        <Button variant="soft" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <h1 className="mt-6 font-display text-3xl font-bold text-foreground sm:text-4xl">Scan dashboard</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Tracked codes made on this device. No account — your links are tied to this browser, so clearing site data hides them.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Stat label="Tracked links" value={links.length} />
        <Stat label="Total scans" value={totalScans} />
      </div>

      <div className="mt-8 grid gap-4">
        {query.isLoading || !deviceId ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : query.isError ? (
          <p className="text-destructive">Could not load your links. Try Refresh.</p>
        ) : links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <BarChart3 className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No tracked codes yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Pick Website URL, turn on “Track scans”, and your code will show up here.</p>
            <Button asChild className="mt-4"><Link to="/">Create a tracked code</Link></Button>
          </div>
        ) : (
          links.map((link) => {
            const short = `${origin}/r/${link.slug}`;
            return (
              <article key={link.slug} className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-primary">{short.replace(/^https?:\/\//, "")}</p>
                    <a href={link.destination} target="_blank" rel="noreferrer" className="mt-1 flex min-w-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                      <span className="truncate">{link.destination}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {new Date(link.created_at).toLocaleDateString()}
                      {link.lastScan ? ` · Last scan ${new Date(link.lastScan).toLocaleString()}` : " · Not scanned yet"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold text-foreground">{link.total}</p>
                    <p className="text-xs text-muted-foreground">scans</p>
                  </div>
                </div>
                {link.total > 0 && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Breakdown title="Countries" rows={link.countries} total={link.total} />
                    <Breakdown title="Devices" rows={link.devices} total={link.total} />
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="soft" onClick={async () => { await navigator.clipboard.writeText(short); toast.success("Short link copied"); }}>
                    <Copy className="size-4" /> Copy link
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(link.slug)}>
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Breakdown({ title, rows, total }: { title: string; rows: { name: string; count: number }[]; total: number }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-2 grid gap-2">
        {rows.map((r) => (
          <li key={r.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm">
            <div className="min-w-0">
              <span className="truncate text-foreground">{r.name}</span>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(r.count / total) * 100}%` }} />
              </div>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
