import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const deviceSchema = z.string().uuid();

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const createShortLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        deviceId: deviceSchema,
        destination: z
          .string()
          .url()
          .max(2048)
          .refine((v) => /^https?:\/\//i.test(v), "Only web links can be tracked"),
        label: z.string().max(80).optional(),
        slug: z.string().regex(/^[A-Za-z0-9]{6,20}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { count } = await db
      .from("short_links")
      .select("slug", { count: "exact", head: true })
      .eq("device_id", data.deviceId);
    if ((count ?? 0) >= 200) throw new Error("This device has reached 200 tracked links");

    const { data: existing } = await db
      .from("short_links")
      .select("device_id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (existing) {
      if (existing.device_id === data.deviceId) return { slug: data.slug };
      throw new Error("Could not create tracked link");
    }
    const { error } = await db.from("short_links").insert({
      slug: data.slug,
      device_id: data.deviceId,
      destination: data.destination,
      label: data.label ?? "",
    });
    if (error) {
      console.error("createShortLink", error);
      throw new Error("Could not create tracked link");
    }
    return { slug: data.slug };
  });

export const listDeviceLinks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ deviceId: deviceSchema }).parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: links, error } = await db
      .from("short_links")
      .select("slug, destination, label, created_at")
      .eq("device_id", data.deviceId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load links");
    const slugs = (links ?? []).map((l) => l.slug);
    const scans = slugs.length
      ? ((
          await db
            .from("link_scans")
            .select("slug, scanned_at, country, device")
            .in("slug", slugs)
            .order("scanned_at", { ascending: false })
            .limit(5000)
        ).data ?? [])
      : [];
    return (links ?? []).map((link) => {
      const own = scans.filter((s) => s.slug === link.slug);
      const tally = (key: "country" | "device") => {
        const map: Record<string, number> = {};
        for (const s of own) {
          const k = s[key] || "Unknown";
          map[k] = (map[k] ?? 0) + 1;
        }
        return Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
      };
      return {
        ...link,
        total: own.length,
        lastScan: own[0]?.scanned_at ?? null,
        countries: tally("country"),
        devices: tally("device"),
        recent: own.slice(0, 5).map((s) => ({ at: s.scanned_at, country: s.country, device: s.device })),
      };
    });
  });

export const deleteDeviceLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ deviceId: deviceSchema, slug: z.string().min(1).max(20) }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db
      .from("short_links")
      .delete()
      .eq("slug", data.slug)
      .eq("device_id", data.deviceId);
    if (error) throw new Error("Could not delete link");
    return { ok: true };
  });
