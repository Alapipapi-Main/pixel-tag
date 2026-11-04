import { createFileRoute } from "@tanstack/react-router";

function deviceFromUa(ua: string) {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "Mac";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

export const Route = createFileRoute("/r/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const slug = params.slug;
        if (!/^[A-Za-z0-9]{4,20}$/.test(slug)) return new Response("Link not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("short_links")
          .select("destination")
          .eq("slug", slug)
          .maybeSingle();
        if (!data) return new Response("Link not found", { status: 404 });

        const ua = request.headers.get("user-agent") ?? "";
        if (!/bot|crawler|spider|preview/i.test(ua)) {
          const country = request.headers.get("cf-ipcountry");
          await supabaseAdmin.from("link_scans").insert({
            slug,
            country: country && country !== "XX" ? country.toUpperCase().slice(0, 2) : null,
            device: deviceFromUa(ua),
          });
        }
        return new Response(null, {
          status: 302,
          headers: { Location: data.destination, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
