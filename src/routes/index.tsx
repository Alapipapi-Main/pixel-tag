import { createFileRoute } from "@tanstack/react-router";
import {
  AtSign,
  Check,
  Clipboard,
  Copy,
  Download,
  Globe2,
  ImagePlus,
  Mail,
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

type QrType = "url" | "text" | "wifi" | "email" | "phone";
type WifiSecurity = "WPA" | "SAE" | "WEP" | "nopass";
type ThemeMode = "light" | "dark";

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
};

const qrTypes: Array<{ value: QrType; label: string; icon: typeof Globe2 }> = [
  { value: "url", label: "Website URL", icon: Globe2 },
  { value: "text", label: "Text", icon: Type },
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixel Tag" },
      {
        name: "description",
        content:
          "Create custom QR codes instantly for websites, text, Wi-Fi, email, and phone numbers with Pixel Tag.",
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
            "Create and customize QR codes for websites, text, Wi-Fi, email, and phone numbers.",
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

function PixelTagHome() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [qrColor, setQrColor] = useState("#0f172a");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(320);
  const [quality, setQuality] = useState<QualityLevel>("M");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [copied, setCopied] = useState(false);

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
      margin: 2,
      errorCorrectionLevel: quality,
      color: {
        dark: qrColor,
        light: backgroundColor,
      },
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [backgroundColor, qrColor, qrPayload, qrSize, quality, validation.valid]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const copyPayload = async () => {
    if (!qrPayload || !validation.valid) {
      toast.error(validation.message);
      return;
    }

    await navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    toast.success("Content copied");
    window.setTimeout(() => setCopied(false), 1400);
  };

  const downloadQr = () => {
    if (!qrDataUrl) {
      toast.error(validation.message);
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `pixel-tag-${qrType}-${qrSize}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("PNG downloaded");
  };

  const resetAll = () => {
    setForm(defaultForm);
    setQrColor("#0f172a");
    setBackgroundColor("#ffffff");
    setQrSize(320);
    setQuality("M");
    setCopied(false);
  };

  const clearFields = () => {
    resetAll();
    toast("Fields cleared");
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen overflow-x-clip bg-page-gradient text-foreground">
        <SiteHeader theme={theme} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />

        <main className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-10 pt-5 sm:px-6 lg:px-8">
          <section className="grid min-h-[calc(100vh-8rem)] w-full items-center gap-8 py-6 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] xl:py-10">
            <BrandPanel />

            <div className="min-w-0 animate-soft-in rounded-3xl border border-border/80 bg-card/90 p-3 shadow-soft backdrop-blur-xl sm:p-4 lg:p-5">
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

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
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
          Generate polished QR codes for links, notes, Wi-Fi access, emails, and phone numbers with precise color and export controls.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 xl:max-w-xl">
        {[
          ["5", "QR types"],
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

  const phone = normalizePhone(form.phone);
  return phone ? `tel:${phone}` : "";
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

  if (!normalizePhone(form.phone)) {
    return { valid: false, message: "Enter a valid phone number with country code." };
  }
  return { valid: true, message: "Phone QR code ready." };
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
