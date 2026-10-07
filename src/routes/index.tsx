import { createFileRoute } from "@tanstack/react-router";
import {
  History,
  X,
  AtSign,
  Check,
  Clipboard,
  Contact,
  Copy,
  Download,
  Globe2,
  ImagePlus,
  Mail,
  MessageCircle,
  MessageSquare,
  Moon,
  Palette,
  Phone,
  QrCode,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  Type,
  Wifi,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import pixeltagLogo from "@/assets/pixeltag-logo.png";
import { cn } from "@/lib/utils";

type QrType = "url" | "text" | "wifi" | "email" | "phone" | "vcard" | "sms" | "whatsapp";
type WifiSecurity = "WPA" | "SAE" | "WEP" | "nopass";
type ThemeMode = "light" | "dark";

const HISTORY_KEY = "pixeltag-history";
const HISTORY_LIMIT = 8;

type HistoryEntry = {
  id: string;
  createdAt: number;
  qrType: QrType;
  form: FormState;
  qrColor: string;
  backgroundColor: string;
  qrSize: number;
  quality: "L" | "M" | "Q" | "H";
  summary: string;
  thumb: string;
  logoDataUrl?: string;
  logoName?: string;
};

type FormState = {
  url: string;
  text: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiSecurity: WifiSecurity;
  wifiHidden: boolean;
  email: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
  vcardFirstName: string;
  vcardLastName: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardOrg: string;
  vcardUrl: string;
  smsPhone: string;
  smsMessage: string;
  whatsappPhone: string;
  whatsappMessage: string;
};

const defaultForm: FormState = {
  url: "",
  text: "",
  wifiSsid: "",
  wifiPassword: "",
  wifiSecurity: "WPA",
  wifiHidden: false,
  email: "",
  emailSubject: "",
  emailBody: "",
  phone: "",
  vcardFirstName: "",
  vcardLastName: "",
  vcardPhone: "",
  vcardEmail: "",
  vcardOrg: "",
  vcardUrl: "",
  smsPhone: "",
  smsMessage: "",
  whatsappPhone: "",
  whatsappMessage: "",
};

const qrTypes: Array<{ value: QrType; label: string; icon: typeof Globe2 }> = [
  { value: "url", label: "Website URL", icon: Globe2 },
  { value: "text", label: "Text", icon: Type },
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "vcard", label: "Contact", icon: Contact },
  { value: "sms", label: "SMS", icon: MessageSquare },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixel Tag" },
      {
        name: "description",
        content:
          "Create custom QR codes instantly for websites, text, Wi-Fi, email, phone numbers, contact cards, SMS, and WhatsApp with Pixel Tag.",
      },
      { property: "og:title", content: "Pixel Tag" },
      {
        property: "og:description",
        content:
          "A fast, beautiful QR code generator with live preview, color controls, copy, clear, and PNG download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://pixel-tag.lovable.app/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Pixel Tag QR code generator" },
      { name: "twitter:image", content: "https://pixel-tag.lovable.app/og-image.jpg" },
      { name: "twitter:image:alt", content: "Pixel Tag QR code generator" },
      { name: "application-name", content: "Pixel Tag" },
      { name: "apple-mobile-web-app-title", content: "Pixel Tag" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Pixel Tag",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          url: "https://pixel-tag.lovable.app/",
          description:
            "Create and customize QR codes for websites, text, Wi-Fi, email, phone numbers, contact cards, SMS, and WhatsApp.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: PixelTagHome,
});

type QualityLevel = "L" | "M" | "Q" | "H";
const qualityLevels: { value: QualityLevel; label: string; recovery: string }[] = [
  { value: "L", label: "Low", recovery: "7%" },
  { value: "M", label: "Medium", recovery: "15%" },
  { value: "Q", label: "High", recovery: "25%" },
  { value: "H", label: "Max", recovery: "30%" },
];

let toastSequence = 0;

function showToast(message: string, variant: "default" | "error" | "success" = "default") {
  const options = { id: `pixel-tag-${++toastSequence}` };
  if (variant === "error") {
    toast.error(message, options);
  } else if (variant === "success") {
    toast.success(message, options);
  } else {
    toast(message, options);
  }
}

function PixelTagHome() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [qrColor, setQrColor] = useState("#0f172a");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(320);
  const [quality, setQuality] = useState<QualityLevel>("M");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [logoName, setLogoName] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [copied, setCopied] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const generatorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setHistory(parsed.slice(0, HISTORY_LIMIT));
    } catch {
      // ignore broken history
    }
  }, []);


  useEffect(() => {
    const storedTheme = window.localStorage.getItem("pixeltag-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: ThemeMode = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
    window.localStorage.setItem("pixeltag-theme", theme);
  }, [theme]);

  const qrPayload = useMemo(() => buildPayload(qrType, form), [qrType, form]);
  const validation = useMemo(() => validateForm(qrType, form), [qrType, form]);

  useEffect(() => {
    let cancelled = false;

    if (!validation.valid || !qrPayload) {
      setQrDataUrl("");
      return;
    }

    QRCode.toDataURL(qrPayload, {
      width: qrSize,
      margin: logoDataUrl ? 4 : 2,
      errorCorrectionLevel: logoDataUrl ? "H" : quality,
      color: {
        dark: qrColor,
        light: backgroundColor,
      },
    })
      .then(async (url) => {
        if (cancelled) return;
        if (logoDataUrl) {
          try {
            const composed = await composeQrWithLogo(url, logoDataUrl, qrSize);
            if (!cancelled) setQrDataUrl(composed);
            return;
          } catch {
            // fall through to the plain code
          }
        }
        setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [backgroundColor, qrColor, qrPayload, qrSize, quality, logoDataUrl, validation.valid]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const copyPayload = async () => {
    if (!qrPayload || !validation.valid) {
      showToast(validation.message, "error");
      return;
    }

    await navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    showToast("Content copied", "success");
    window.setTimeout(() => setCopied(false), 1400);
  };

  const saveHistory = (next: HistoryEntry[]) => {
    setHistory(next);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // storage full or blocked; keep in memory only
    }
  };

  const addToHistory = () => {
    try {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        qrType,
        form,
        qrColor,
        backgroundColor,
        qrSize,
        quality,
        summary: qrPayload.slice(0, 80),
        thumb: qrDataUrl,
        ...(logoDataUrl ? { logoDataUrl, logoName } : {}),
      };
      const rest = history.filter(
        (item) =>
          !(
            item.qrType === qrType &&
            JSON.stringify(item.form) === JSON.stringify(form) &&
            item.qrColor === qrColor &&
            item.backgroundColor === backgroundColor &&
            item.qrSize === qrSize &&
            item.quality === quality &&
            (item.logoDataUrl ?? "") === logoDataUrl
          ),
      );
      saveHistory([entry, ...rest].slice(0, HISTORY_LIMIT));
    } catch {
      // history is optional
    }
  };

  const restoreHistory = (entry: HistoryEntry) => {
    setQrType(entry.qrType);
    setForm({ ...defaultForm, ...entry.form });
    setQrColor(entry.qrColor);
    setBackgroundColor(entry.backgroundColor);
    setQrSize(entry.qrSize);
    setQuality(entry.quality);
    setLogoDataUrl(entry.logoDataUrl ?? "");
    setLogoName(entry.logoName ?? "");
    if (logoInputRef.current) logoInputRef.current.value = "";
    setCopied(false);
    generatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Code restored from history", "success");
  };

  const downloadQr = () => {
    if (!qrDataUrl) {
      showToast(validation.message, "error");
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `pixel-tag-${qrType}-${qrSize}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("PNG downloaded", "success");
    addToHistory();
  };

  const handleLogoFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2 MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const preparedLogo = await prepareLogoDataUrl(String(reader.result));
        setLogoDataUrl(preparedLogo);
        setLogoName(file.name);
        setQuality("H");
        showToast("Quality locked to Max so the code still scans with a logo");
      } catch {
        showToast("Could not prepare that image", "error");
      }
    };
    reader.onerror = () => showToast("Could not read that image", "error");
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoDataUrl("");
    setLogoName("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const resetAll = () => {
    setForm(defaultForm);
    setQrColor("#0f172a");
    setBackgroundColor("#ffffff");
    setQrSize(320);
    setQuality("M");
    removeLogo();
    setCopied(false);
  };

  const clearFields = () => {
    resetAll();
    showToast("Fields cleared");
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen overflow-x-clip bg-page-gradient text-foreground">
        <SiteHeader theme={theme} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />

        <main className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-10 pt-5 sm:px-6 lg:px-8">
          <section className="grid min-h-[calc(100vh-8rem)] w-full items-center gap-8 py-6 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] xl:py-10">
            <div className="min-w-0 space-y-6">
              <BrandPanel />
              <HistoryPanel
                history={history}
                onRestore={restoreHistory}
                onRemove={(id) => saveHistory(history.filter((item) => item.id !== id))}
                onClearAll={() => {
                  saveHistory([]);
                  showToast("History cleared");
                }}
              />
            </div>

            <div ref={generatorRef} className="min-w-0 scroll-mt-4 animate-soft-in rounded-3xl border border-border/80 bg-card/90 p-3 shadow-soft backdrop-blur-xl sm:p-4 lg:p-5">
              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
                <section className="min-w-0 rounded-2xl border border-border/80 bg-surface-strong/80 p-4 sm:p-5">
                  <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand">Generator</p>
                      <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                        Create QR Codes in Seconds.
                      </h2>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-2 text-xs font-semibold text-muted-foreground sm:px-3">
                      <span className="size-2 shrink-0 rounded-full bg-success" />
                      <span className="hidden sm:inline">Live preview</span>
                      <span className="sm:hidden">Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {qrTypes.map((type) => {
                      const Icon = type.icon;
                      const isActive = qrType === type.value;
                      return (
                        <Button
                          key={type.value}
                          type="button"
                          variant={isActive ? "brand" : "soft"}
                          className="h-auto min-h-16 min-w-0 flex-col gap-1 px-2 py-3 text-center text-xs sm:text-[0.8rem]"
                          onClick={() => {
                            if (type.value !== qrType) {
                              setQrType(type.value);
                              resetAll();
                            }
                          }}
                          aria-pressed={isActive}
                        >
                          <Icon className="size-4" />
                           <span className="max-w-full whitespace-normal leading-tight">{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-5">
                    <QrFields qrType={qrType} form={form} updateForm={updateForm} />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <ColorControl
                        label="QR color"
                        value={qrColor}
                        onChange={setQrColor}
                        icon={<Palette className="size-4" />}
                      />
                      <ColorControl
                        label="Background"
                        value={backgroundColor}
                        onChange={setBackgroundColor}
                        icon={<Sparkles className="size-4" />}
                      />
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <Label htmlFor="qr-code-size" className="text-base font-semibold">
                          QR Code Size
                        </Label>
                        <span className="shrink-0 rounded-xl bg-muted px-3 py-2 font-mono text-xs text-muted-foreground sm:px-4 sm:text-sm">
                          {qrSize} x {qrSize} px
                        </span>
                      </div>
                      <div className="mt-6">
                        <Slider
                          id="qr-code-size"
                          value={[qrSize]}
                          min={192}
                          max={512}
                          step={64}
                          onValueChange={(value) => setQrSize(value[0] ?? 320)}
                          aria-label="QR code size"
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:text-sm">
                        <span>Small (192px)</span>
                        <span className="text-right">Large (512px)</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <span className="text-base font-semibold">QR Quality</span>
                        <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                          Recovers ~{qualityLevels.find((q) => q.value === quality)?.recovery} if damaged
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="QR quality">
                        {qualityLevels.map((level) => (
                          <Button
                            key={level.value}
                            type="button"
                            role="radio"
                            aria-checked={quality === level.value}
                            disabled={!!logoDataUrl}
                            title={logoDataUrl ? "Locked to Max while a logo is added" : undefined}
                            variant={quality === level.value ? "brand" : "soft"}
                            className="h-auto min-w-0 flex-col gap-0.5 px-2 py-2.5 text-xs"
                            onClick={() => setQuality(level.value)}
                          >
                            <span className="font-semibold">{level.label}</span>
                            <span className="opacity-80">{level.recovery}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <span className="text-base font-semibold">Center logo</span>
                        {logoDataUrl ? (
                          <Button type="button" variant="soft" size="sm" className="shrink-0" onClick={removeLogo}>
                            <Trash2 className="size-4" /> Remove
                          </Button>
                        ) : null}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleLogoFile(event.target.files?.[0])}
                      />
                      {logoDataUrl ? (
                        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-card p-3">
                          <img src={logoDataUrl} alt="Uploaded logo" className="size-12 shrink-0 rounded-lg object-contain" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{logoName}</p>
                            <p className="text-xs text-muted-foreground">Shown in the middle of your code</p>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4 w-full border-dashed"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <ImagePlus className="size-4" /> Upload a logo or image
                        </Button>
                      )}
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        A logo covers part of the code, so Pixel Tag uses Max quality automatically to keep it scannable.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                      <Button type="button" size="xl" variant="brand" className="min-w-0 sm:col-span-2 2xl:col-span-1" onClick={downloadQr} disabled={!qrDataUrl}>
                        <Download className="size-4 shrink-0" /> <span className="truncate">Download PNG</span>
                      </Button>
                      <Button type="button" size="xl" variant="soft" className="min-w-0" onClick={copyPayload} disabled={!qrPayload}>
                        {copied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
                        <span className="truncate">{copied ? "Copied" : "Copy content"}</span>
                      </Button>
                      <Button type="button" size="xl" variant="outline" className="min-w-0" onClick={clearFields}>
                        <RotateCcw className="size-4 shrink-0" /> <span className="truncate">Clear</span>
                      </Button>
                    </div>
                  </div>
                </section>

                <PreviewPanel
                  qrDataUrl={qrDataUrl}
                  qrSize={qrSize}
                  validation={validation}
                  qrPayload={qrPayload}
                  qrType={qrType}
                />
              </div>
            </div>
          </section>

        </main>

        <SiteFooter />
      </div>
    </TooltipProvider>
  );
}

function SiteHeader({ theme, onThemeToggle }: { theme: ThemeMode; onThemeToggle: () => void }) {
  return (
    <header className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:flex sm:justify-between sm:px-6 lg:px-8">
      <a href="/" className="flex min-w-0 items-center gap-3" aria-label="Pixel Tag home">
        <img
          src={pixeltagLogo}
          alt=""
          width={1024}
          height={1024}
          className="size-11 shrink-0 rounded-xl shadow-brand"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold leading-none text-foreground">Pixel Tag</p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
            Create QR Codes in Seconds.
          </p>
        </div>
      </a>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="soft" size="icon" onClick={onThemeToggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{theme === "dark" ? "Use light mode" : "Use dark mode"}</TooltipContent>
      </Tooltip>
    </header>
  );
}

function BrandPanel() {
  return (
    <section className="animate-soft-in space-y-6 text-center xl:text-left">
      <div className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-brand-gradient p-2 shadow-brand sm:size-28 xl:mx-0">
        <img
          src={pixeltagLogo}
          alt="Pixel Tag QR code generator mark"
          width={1024}
          height={1024}
          className="size-full rounded-2xl"
        />
      </div>
      <div className="space-y-4">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-brand-soft-foreground backdrop-blur xl:mx-0">
          <QrCode className="size-4" /> Instant QR studio
        </div>
        <h1 className="mx-auto max-w-2xl font-display text-4xl font-bold leading-[1.08] text-foreground sm:text-6xl xl:mx-0 xl:text-7xl">
          Pixel-perfect codes, ready before the moment passes.
        </h1>
        <p className="mx-auto max-w-xl text-base leading-8 text-muted-foreground sm:text-lg xl:mx-0">
          Generate polished QR codes for links, notes, Wi-Fi access, emails, phone numbers, contact cards, SMS, and WhatsApp with precise color and export controls.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 xl:max-w-xl">
        {[
          ["8", "QR types"],
          ["PNG", "instant export"],
          ["0", "accounts needed"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-4 backdrop-blur">
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QrFields({
  qrType,
  form,
  updateForm,
}: {
  qrType: QrType;
  form: FormState;
  updateForm: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  if (qrType === "url") {
    return (
      <FieldShell id="website-url" label="Website URL" icon={<Globe2 className="size-4" />}>
        <Input
          id="website-url"
          value={form.url}
          onChange={(event) => updateForm("url", event.target.value)}
          placeholder="https://example.com"
          inputMode="url"
          autoComplete="url"
        />
      </FieldShell>
    );
  }

  if (qrType === "text") {
    return (
      <FieldShell id="text-content" label="Text" icon={<Type className="size-4" />}>
        <Textarea
          id="text-content"
          value={form.text}
          onChange={(event) => updateForm("text", event.target.value)}
          placeholder="Type anything to encode…"
          className="min-h-32 resize-none"
        />
      </FieldShell>
    );
  }

  if (qrType === "wifi") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
          <FieldShell
            id="wifi-network-name"
            label="Network name"
            icon={<Wifi className="size-4" />}
          >
            <Input
              id="wifi-network-name"
              value={form.wifiSsid}
              onChange={(event) => updateForm("wifiSsid", event.target.value)}
              placeholder="My Wi-Fi network"
              maxLength={32}
            />
          </FieldShell>
          <FieldShell id="wifi-security" label="Security" icon={<QrCode className="size-4" />}>
            <Select
              value={form.wifiSecurity}
              onValueChange={(value: WifiSecurity) => updateForm("wifiSecurity", value)}
            >
              <SelectTrigger id="wifi-security">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA/WPA2</SelectItem>
                <SelectItem value="SAE">WPA3</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">No password</SelectItem>
              </SelectContent>
            </Select>
          </FieldShell>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
          <FieldShell id="wifi-password" label="Password" icon={<Clipboard className="size-4" />}>
            <Input
              id="wifi-password"
              value={form.wifiPassword}
              onChange={(event) => updateForm("wifiPassword", event.target.value)}
              placeholder="Wi-Fi password"
              disabled={form.wifiSecurity === "nopass"}
            />
          </FieldShell>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="wifi-hidden" className="text-sm font-semibold">
                  Hidden network
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">SSID is not broadcast</p>
              </div>
              <Switch
                id="wifi-hidden"
                checked={form.wifiHidden}
                onCheckedChange={(checked) => updateForm("wifiHidden", checked)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (qrType === "email") {
    return (
      <div className="grid gap-4">
        <FieldShell id="email-address" label="Email address" icon={<AtSign className="size-4" />}>
          <Input
            id="email-address"
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
            placeholder="name@example.com"
            inputMode="email"
            autoComplete="email"
          />
        </FieldShell>
        <FieldShell id="email-subject" label="Subject" icon={<Mail className="size-4" />}>
          <Input
            id="email-subject"
            value={form.emailSubject}
            onChange={(event) => updateForm("emailSubject", event.target.value)}
            placeholder="Email subject"
          />
        </FieldShell>
        <FieldShell id="email-message" label="Message" icon={<Type className="size-4" />}>
          <Textarea
            id="email-message"
            value={form.emailBody}
            onChange={(event) => updateForm("emailBody", event.target.value)}
            placeholder="Write your message…"
            className="min-h-24 resize-none"
          />
        </FieldShell>
      </div>
    );
  }

  if (qrType === "phone") {
    return (
      <FieldShell id="phone-number" label="Phone number" icon={<Phone className="size-4" />}>
        <Input
          id="phone-number"
          value={form.phone}
          onChange={(event) => updateForm("phone", event.target.value)}
          placeholder="+1 555 123 4567"
          inputMode="tel"
          autoComplete="tel"
        />
      </FieldShell>
    );
  }

  if (qrType === "vcard") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="vcard-first-name" label="First name" icon={<Contact className="size-4" />}>
            <Input
              id="vcard-first-name"
              value={form.vcardFirstName}
              onChange={(event) => updateForm("vcardFirstName", event.target.value)}
              placeholder="Ada"
              autoComplete="given-name"
            />
          </FieldShell>
          <FieldShell id="vcard-last-name" label="Last name" icon={<Contact className="size-4" />}>
            <Input
              id="vcard-last-name"
              value={form.vcardLastName}
              onChange={(event) => updateForm("vcardLastName", event.target.value)}
              placeholder="Lovelace"
              autoComplete="family-name"
            />
          </FieldShell>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="vcard-phone" label="Phone" icon={<Phone className="size-4" />}>
            <Input
              id="vcard-phone"
              value={form.vcardPhone}
              onChange={(event) => updateForm("vcardPhone", event.target.value)}
              placeholder="+1 555 123 4567"
              inputMode="tel"
              autoComplete="tel"
            />
          </FieldShell>
          <FieldShell id="vcard-email" label="Email" icon={<AtSign className="size-4" />}>
            <Input
              id="vcard-email"
              value={form.vcardEmail}
              onChange={(event) => updateForm("vcardEmail", event.target.value)}
              placeholder="name@example.com"
              inputMode="email"
              autoComplete="email"
            />
          </FieldShell>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="vcard-org" label="Company" icon={<Clipboard className="size-4" />}>
            <Input
              id="vcard-org"
              value={form.vcardOrg}
              onChange={(event) => updateForm("vcardOrg", event.target.value)}
              placeholder="Company or team"
              autoComplete="organization"
            />
          </FieldShell>
          <FieldShell id="vcard-url" label="Website" icon={<Globe2 className="size-4" />}>
            <Input
              id="vcard-url"
              value={form.vcardUrl}
              onChange={(event) => updateForm("vcardUrl", event.target.value)}
              placeholder="https://example.com"
              inputMode="url"
            />
          </FieldShell>
        </div>
      </div>
    );
  }

  if (qrType === "sms") {
    return (
      <div className="grid gap-4">
        <FieldShell id="sms-phone" label="Phone number" icon={<Phone className="size-4" />}>
          <Input
            id="sms-phone"
            value={form.smsPhone}
            onChange={(event) => updateForm("smsPhone", event.target.value)}
            placeholder="+1 555 123 4567"
            inputMode="tel"
            autoComplete="tel"
          />
        </FieldShell>
        <FieldShell id="sms-message" label="Message" icon={<MessageSquare className="size-4" />}>
          <Textarea
            id="sms-message"
            value={form.smsMessage}
            onChange={(event) => updateForm("smsMessage", event.target.value)}
            placeholder="Write the text message…"
            className="min-h-24 resize-none"
          />
        </FieldShell>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <FieldShell id="whatsapp-phone" label="WhatsApp number" icon={<MessageCircle className="size-4" />}>
        <Input
          id="whatsapp-phone"
          value={form.whatsappPhone}
          onChange={(event) => updateForm("whatsappPhone", event.target.value)}
          placeholder="+1 555 123 4567"
          inputMode="tel"
          autoComplete="tel"
        />
      </FieldShell>
      <FieldShell id="whatsapp-message" label="Message" icon={<Type className="size-4" />}>
        <Textarea
          id="whatsapp-message"
          value={form.whatsappMessage}
          onChange={(event) => updateForm("whatsappMessage", event.target.value)}
          placeholder="Hi! I scanned your code…"
          className="min-h-24 resize-none"
        />
      </FieldShell>
    </div>
  );
}

function FieldShell({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <Label
        htmlFor={id}
        className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
          {icon}
        </span>
        {label}
      </Label>
      {children}
    </div>
  );
}

function ColorControl({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}) {
  const inputId = label.toLowerCase().replaceAll(" ", "-");
  const hexInputId = `${inputId}-hex`;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <Label
        htmlFor={inputId}
        className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
          {icon}
        </span>
        {label}
      </Label>
      <div className="grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)] gap-3">
        <input
          id={inputId}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background p-1"
          aria-label={label}
        />
        <Label htmlFor={hexInputId} className="sr-only">
          {label} hex value
        </Label>
        <Input
          id={hexInputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 px-2 font-mono sm:px-3"
        />
      </div>
    </div>
  );
}

function PreviewPanel({
  qrDataUrl,
  qrSize,
  validation,
  qrPayload,
  qrType,
}: {
  qrDataUrl: string;
  qrSize: number;
  validation: { valid: boolean; message: string };
  qrPayload: string;
  qrType: QrType;
}) {
  return (
    <aside className="min-w-0 rounded-2xl border border-border/80 bg-surface-strong/90 p-4 sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand">Preview</p>
          <h3 className="font-display text-xl font-bold text-foreground">Scan-ready PNG</h3>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            validation.valid ? "bg-brand-soft text-brand-soft-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {validation.valid ? "Ready" : "Needs input"}
        </span>
      </div>

      <div className="mt-6 flex min-h-64 items-center justify-center rounded-3xl border border-border bg-background/70 p-4 shadow-inner sm:min-h-80 sm:p-6">
        {qrDataUrl ? (
          <img
            key={`${qrPayload}-${qrSize}`}
            src={qrDataUrl}
            alt={`Generated QR code for ${qrType}`}
            width={qrSize}
            height={qrSize}
            className="animate-soft-in h-auto max-h-[20rem] w-full max-w-[20rem] rounded-xl shadow-soft"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
            <div className="flex size-20 items-center justify-center rounded-2xl border border-dashed border-border bg-surface">
              <QrCode className="size-8" />
            </div>
            <p className="max-w-xs text-sm font-medium">{validation.message}</p>
          </div>
        )}
      </div>

    </aside>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <img
          src={pixeltagLogo}
          alt=""
          width={1024}
          height={1024}
          loading="lazy"
          className="size-7 rounded-lg"
        />
        <span className="font-semibold text-foreground">Pixel Tag</span>
      </div>
      <p>No sign-up. No waiting. Just clean QR codes.</p>
    </footer>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

async function prepareLogoDataUrl(source: string): Promise<string> {
  const image = await loadImage(source);
  const maxSide = 256;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

async function composeQrWithLogo(qrUrl: string, logoUrl: string, size: number): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrUrl;

  const qrImg = await loadImage(qrUrl);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrImg, 0, 0, size, size);
  ctx.imageSmoothingEnabled = true;

  const logoImg = await loadImage(logoUrl);
  const box = Math.round(size * 0.18);
  const pad = Math.round(box * 0.1);
  const radius = Math.round(box * 0.24);
  const x = (size - box) / 2;
  const y = (size - box) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, box + pad * 2, box + pad * 2, radius);
  ctx.fill();

  const scale = Math.min(box / logoImg.width, box / logoImg.height);
  const w = logoImg.width * scale;
  const h = logoImg.height * scale;
  ctx.drawImage(logoImg, x + (box - w) / 2, y + (box - h) / 2, w, h);

  return canvas.toDataURL("image/png");
}

function buildPayload(qrType: QrType, form: FormState) {
  if (qrType === "url") {
    const normalized = normalizeUrl(form.url);
    return normalized ?? "";
  }

  if (qrType === "text") {
    return form.text.trim();
  }

  if (qrType === "wifi") {
    const ssid = form.wifiSsid.trim();
    if (!ssid) {
      return "";
    }
    const password = form.wifiSecurity === "nopass" ? "" : form.wifiPassword;
    const passwordSegment = form.wifiSecurity === "nopass" ? "" : `P:${escapeWifiValue(password)};`;
    return `WIFI:T:${form.wifiSecurity};S:${escapeWifiValue(ssid)};${passwordSegment}H:${form.wifiHidden ? "true" : "false"};;`;
  }

  if (qrType === "email") {
    const email = form.email.trim();
    const params = new URLSearchParams();
    if (form.emailSubject.trim()) {
      params.set("subject", form.emailSubject.trim());
    }
    if (form.emailBody.trim()) {
      params.set("body", form.emailBody.trim());
    }
    const query = params.toString();
    return query ? `mailto:${email}?${query}` : `mailto:${email}`;
  }

  if (qrType === "phone") {
    const phone = normalizePhone(form.phone);
    return phone ? `tel:${phone}` : "";
  }

  if (qrType === "vcard") {
    const first = form.vcardFirstName.trim();
    const last = form.vcardLastName.trim();
    if (!first && !last) return "";
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escapeVcardValue(last)};${escapeVcardValue(first)};;;`,
      `FN:${escapeVcardValue([first, last].filter(Boolean).join(" "))}`,
    ];
    if (form.vcardOrg.trim()) lines.push(`ORG:${escapeVcardValue(form.vcardOrg.trim())}`);
    const phone = normalizePhone(form.vcardPhone);
    if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
    if (isValidEmail(form.vcardEmail.trim())) lines.push(`EMAIL:${form.vcardEmail.trim()}`);
    const site = normalizeUrl(form.vcardUrl);
    if (site) lines.push(`URL:${site}`);
    lines.push("END:VCARD");
    return lines.join("\n");
  }

  if (qrType === "sms") {
    const phone = normalizePhone(form.smsPhone);
    if (!phone) return "";
    const message = form.smsMessage.trim();
    return message ? `SMSTO:${phone}:${message}` : `SMSTO:${phone}`;
  }

  const phone = normalizePhone(form.whatsappPhone);
  if (!phone) return "";
  const digits = phone.replace(/^\+/, "");
  const message = form.whatsappMessage.trim();
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;
}

function validateForm(qrType: QrType, form: FormState) {
  if (qrType === "url") {
    const normalized = normalizeUrl(form.url);
    if (!normalized) {
      return { valid: false, message: "Enter a valid website URL." };
    }
    return { valid: true, message: "Website QR code ready." };
  }

  if (qrType === "text") {
    if (!form.text.trim()) {
      return { valid: false, message: "Enter text to create a QR code." };
    }
    return { valid: true, message: "Text QR code ready." };
  }

  if (qrType === "wifi") {
    const ssidBytes = new TextEncoder().encode(form.wifiSsid.trim()).length;
    if (!form.wifiSsid.trim()) {
      return { valid: false, message: "Enter a Wi-Fi network name." };
    }
    if (ssidBytes > 32) {
      return { valid: false, message: "Wi-Fi network names must be 32 bytes or fewer." };
    }
    if (form.wifiSecurity !== "nopass" && !form.wifiPassword) {
      return { valid: false, message: "Enter the Wi-Fi password or choose no password." };
    }
    return { valid: true, message: "Wi-Fi QR code ready." };
  }

  if (qrType === "email") {
    if (!isValidEmail(form.email.trim())) {
      return { valid: false, message: "Enter a valid email address." };
    }
    return { valid: true, message: "Email QR code ready." };
  }

  if (qrType === "phone") {
    if (!normalizePhone(form.phone)) {
      return { valid: false, message: "Enter a valid phone number with country code." };
    }
    return { valid: true, message: "Phone QR code ready." };
  }

  if (qrType === "vcard") {
    if (!form.vcardFirstName.trim() && !form.vcardLastName.trim()) {
      return { valid: false, message: "Enter at least a first or last name." };
    }
    if (form.vcardEmail.trim() && !isValidEmail(form.vcardEmail.trim())) {
      return { valid: false, message: "Enter a valid email address or leave it empty." };
    }
    if (form.vcardPhone.trim() && !normalizePhone(form.vcardPhone)) {
      return { valid: false, message: "Enter a valid phone number with country code or leave it empty." };
    }
    if (form.vcardUrl.trim() && !normalizeUrl(form.vcardUrl)) {
      return { valid: false, message: "Enter a valid website URL or leave it empty." };
    }
    return { valid: true, message: "Contact QR code ready." };
  }

  if (qrType === "sms") {
    if (!normalizePhone(form.smsPhone)) {
      return { valid: false, message: "Enter a valid phone number with country code." };
    }
    return { valid: true, message: "SMS QR code ready." };
  }

  if (!normalizePhone(form.whatsappPhone)) {
    return { valid: false, message: "Enter a valid WhatsApp number with country code." };
  }
  return { valid: true, message: "WhatsApp QR code ready." };
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const allowedProtocol = url.protocol === "http:" || url.protocol === "https:";
    const hasHost = url.hostname.includes(".") || url.hostname === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname);
    return allowedProtocol && hasHost ? url.toString() : null;
  } catch {
    return null;
  }
}

function escapeWifiValue(value: string) {
  return value.replace(/([\\;:,\"])/g, "\\$1");
}

function escapeVcardValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function isValidEmail(value: string) {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(value);
}

function normalizePhone(value: string) {
  const cleaned = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+?[1-9]\d{1,14}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function HistoryPanel({
  history,
  onRestore,
  onRemove,
  onClearAll,
}: {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  return (
    <section className="w-full animate-soft-in rounded-3xl border border-border/80 bg-card/90 p-4 shadow-soft backdrop-blur-xl sm:p-5" aria-label="Recent codes">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <History className="size-5 shrink-0 text-brand" /> <span className="truncate">Recent codes</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Saved on this device only when you download.</p>
        </div>
        {history.length > 0 && (
          <Button type="button" variant="soft" size="sm" className="shrink-0" onClick={onClearAll}>
            <Trash2 className="size-4" /> Clear all
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No codes yet. Download a code and it will show up here.
        </p>
      ) : (
        <ul className="mt-4 grid max-h-80 gap-3 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2 xl:grid-cols-1">
          {history.map((entry) => (
            <li key={entry.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-surface p-2.5">
              <button type="button" onClick={() => onRestore(entry)} className="shrink-0 rounded-lg" aria-label="Restore this code">
                <img src={entry.thumb} alt="" width={56} height={56} className="size-14 rounded-lg" />
              </button>
              <button type="button" onClick={() => onRestore(entry)} className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-foreground">
                  {qrTypes.find((t) => t.value === entry.qrType)?.label ?? entry.qrType}
                </p>
                <p className="truncate text-xs text-muted-foreground">{entry.summary}</p>
                <p className="text-[0.7rem] text-muted-foreground">
                  Size: {entry.qrSize} x {entry.qrSize} px{" | "}
                  Quality: {qualityLevels.find((level) => level.value === entry.quality)?.label ?? entry.quality}
                </p>
                <p className="text-[0.7rem] text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</p>
              </button>
              <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => onRemove(entry.id)} aria-label="Remove from history">
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
