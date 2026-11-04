CREATE TABLE public.short_links (
  slug text PRIMARY KEY,
  device_id uuid NOT NULL,
  destination text NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.short_links TO service_role;
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
CREATE INDEX short_links_device_idx ON public.short_links(device_id);

CREATE TABLE public.link_scans (
  id bigserial PRIMARY KEY,
  slug text NOT NULL REFERENCES public.short_links(slug) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  country text,
  device text
);
GRANT ALL ON public.link_scans TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.link_scans_id_seq TO service_role;
ALTER TABLE public.link_scans ENABLE ROW LEVEL SECURITY;
CREATE INDEX link_scans_slug_idx ON public.link_scans(slug, scanned_at DESC);