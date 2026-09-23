import { createFileRoute } from "@tanstack/react-router";
import {
  AtSign,
  Check,
  Clipboard,
  Copy,
  Download,
  Globe2,
  Mail,
  Moon,
  Palette,
  Phone,
  QrCode,
  RotateCcw,
  Sparkles,
  Sun,
  Type,
  Wifi,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
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
  url: "https://pixeltag.app",
  text: "Create QR Codes in Seconds.",
  wifiSsid: "PixelTag Guest",
  wifiPassword: "",
  wifiSecurity: "WPA",
  wifiHidden: false,
  email: "hello@pixeltag.app",
  emailSubject: "Hello from PixelTag",
  emailBody: "I created this QR code with PixelTag.",
  phone: "+12025550188",
};

const qrTypes: Array<{ value: QrType; label: string; icon: typeof Globe2 }> = [
  { value: "url", label: "Website URL", icon: Globe2 },
  { value: "text", label: "Text", icon: Type },
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
];

const qrSizeOptions = [192, 256, 320, 384, 512];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PixelTag — Create QR Codes in Seconds" },
      {
        name: "description",
        content:
          "Create custom QR codes instantly for websites, text, Wi-Fi, email, and phone numbers with PixelTag.",
      },
      { property: "og:title", content: "PixelTag — Create QR Codes in Seconds" },
      {
        property: "og:description",
        content:
          "A fast, beautiful QR code generator with live preview, color controls, copy, clear, and PNG download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "application-name", content: "PixelTag" },
      { name: "apple-mobile-web-app-title", content: "PixelTag" },
    ],
  }),
  component: PixelTagHome,
});

function PixelTagHome() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [qrColor, setQrColor] = useState("#0f172a");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(320);
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
      errorCorrectionLevel: "M",
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
  }, [backgroundColor, qrColor, qrPayload, qrSize, validation.valid]);

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
    link.download = `pixeltag-${qrType}-${qrSize}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("PNG downloaded");
  };

  const clearFields = () => {
    setForm({ ...defaultForm, [activeContentKey(qrType)]: "" });
    setQrColor("#0f172a");
    setBackgroundColor("#ffffff");
    setCopied(false);
    toast("Fields cleared");
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen overflow-hidden bg-page-gradient text-foreground">
        <SiteHeader theme={theme} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />

        <main className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-10 pt-5 sm:px-6 lg:px-8">
          <section className="grid min-h-[calc(100vh-8rem)] w-full items-center gap-8 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-10">
            <BrandPanel />

            <div className="animate-soft-in rounded-3xl border border-border/80 bg-card/90 p-3 shadow-soft backdrop-blur-xl sm:p-4 lg:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
                <section className="rounded-2xl border border-border/80 bg-surface-strong/80 p-4 sm:p-5">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-brand">Generator</p>
                      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                        Create QR Codes in Seconds.
                      </h1>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <span className="size-2 rounded-full bg-success" /> Live preview
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {qrTypes.map((type) => {
                      const Icon = type.icon;
                      const isActive = qrType === type.value;
                      return (
                        <Button
                          key={type.value}
                          type="button"
                          variant={isActive ? "brand" : "soft"}
                          className="h-auto min-h-16 flex-col gap-1 px-2 py-3 text-center text-xs sm:text-[0.8rem]"
                          onClick={() => setQrType(type.value)}
                          aria-pressed={isActive}
                        >
                          <Icon className="size-4" />
                          <span>{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-5">
                    <QrFields qrType={qrType} form={form} updateForm={updateForm} />

                    <div className="grid gap-4 md:grid-cols-2">
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

                    <div className="rounded-2xl border border-border bg-surface p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label className="text-sm font-semibold">QR code size</Label>
                        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-soft-foreground">
                          {qrSize}px
                        </span>
                      </div>
                      <div className="mt-4">
                        <Slider
                          value={[qrSize]}
                          min={192}
                          max={512}
                          step={64}
                          onValueChange={(value) => setQrSize(value[0] ?? 320)}
                          aria-label="QR code size"
                        />
                      </div>
                      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                        {qrSizeOptions.map((size) => (
                          <span key={size}>{size}</span>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button type="button" size="xl" variant="brand" onClick={downloadQr} disabled={!qrDataUrl}>
                        <Download className="size-4" /> Download PNG
                      </Button>
                      <Button type="button" size="xl" variant="soft" onClick={copyPayload} disabled={!qrPayload}>
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {copied ? "Copied" : "Copy content"}
                      </Button>
                      <Button type="button" size="xl" variant="outline" onClick={clearFields}>
                        <RotateCcw className="size-4" /> Clear
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
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <a href="/" className="flex items-center gap-3" aria-label="PixelTag home">
        <img src={pixeltagLogo} alt="PixelTag logo" width={1024} height={1024} className="size-11 rounded-xl shadow-brand" />
        <div>
          <p className="font-display text-lg font-bold leading-none text-foreground">PixelTag</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Create QR Codes in Seconds.</p>
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
    <section className="animate-soft-in space-y-6 text-center lg:text-left">
      <div className="mx-auto flex size-28 items-center justify-center rounded-3xl bg-brand-gradient p-2 shadow-brand lg:mx-0">
        <img src={pixeltagLogo} alt="PixelTag logo" width={1024} height={1024} className="size-full rounded-2xl" />
      </div>
      <div className="space-y-4">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-brand-soft-foreground backdrop-blur lg:mx-0">
          <QrCode className="size-4" /> Instant QR studio
        </div>
        <h2 className="mx-auto max-w-2xl font-display text-5xl font-bold leading-[1.02] text-foreground sm:text-6xl lg:mx-0 lg:text-7xl">
          Pixel-perfect codes, ready before the moment passes.
        </h2>
        <p className="mx-auto max-w-xl text-base leading-8 text-muted-foreground sm:text-lg lg:mx-0">
          Generate polished QR codes for links, notes, Wi-Fi access, emails, and phone numbers with precise color and export controls.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:max-w-xl">
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
      <FieldShell label="Website URL" icon={<Globe2 className="size-4" />}>
        <Input
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
      <FieldShell label="Text" icon={<Type className="size-4" />}>
        <Textarea
          value={form.text}
          onChange={(event) => updateForm("text", event.target.value)}
          placeholder="Write anything to encode"
          className="min-h-32 resize-none"
        />
      </FieldShell>
    );
  }

  if (qrType === "wifi") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
          <FieldShell label="Network name" icon={<Wifi className="size-4" />}>
            <Input
              value={form.wifiSsid}
              onChange={(event) => updateForm("wifiSsid", event.target.value)}
              placeholder="Guest Wi-Fi"
              maxLength={32}
            />
          </FieldShell>
          <FieldShell label="Security" icon={<QrCode className="size-4" />}>
            <Select value={form.wifiSecurity} onValueChange={(value: WifiSecurity) => updateForm("wifiSecurity", value)}>
              <SelectTrigger>
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
          <FieldShell label="Password" icon={<Clipboard className="size-4" />}>
            <Input
              value={form.wifiPassword}
              onChange={(event) => updateForm("wifiPassword", event.target.value)}
              placeholder={form.wifiSecurity === "nopass" ? "Not required" : "Network password"}
              disabled={form.wifiSecurity === "nopass"}
            />
          </FieldShell>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold">Hidden network</Label>
                <p className="mt-1 text-xs text-muted-foreground">SSID is not broadcast</p>
              </div>
              <Switch checked={form.wifiHidden} onCheckedChange={(checked) => updateForm("wifiHidden", checked)} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (qrType === "email") {
    return (
      <div className="grid gap-4">
        <FieldShell label="Email address" icon={<AtSign className="size-4" />}>
          <Input
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
            placeholder="name@example.com"
            inputMode="email"
            autoComplete="email"
          />
        </FieldShell>
        <FieldShell label="Subject" icon={<Mail className="size-4" />}>
          <Input
            value={form.emailSubject}
            onChange={(event) => updateForm("emailSubject", event.target.value)}
            placeholder="Optional subject"
          />
        </FieldShell>
        <FieldShell label="Message" icon={<Type className="size-4" />}>
          <Textarea
            value={form.emailBody}
            onChange={(event) => updateForm("emailBody", event.target.value)}
            placeholder="Optional message"
            className="min-h-24 resize-none"
          />
        </FieldShell>
      </div>
    );
  }

  return (
    <FieldShell label="Phone number" icon={<Phone className="size-4" />}>
      <Input
        value={form.phone}
        onChange={(event) => updateForm("phone", event.target.value)}
        placeholder="+12025550188"
        inputMode="tel"
        autoComplete="tel"
      />
    </FieldShell>
  );
}

function FieldShell({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">{icon}</span>
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
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">{icon}</span>
        {label}
      </Label>
      <div className="grid grid-cols-[3.25rem_1fr] gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} aria-label={`${label} hex value`} />
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
    <aside className="rounded-2xl border border-border/80 bg-surface-strong/90 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
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

      <div className="mt-6 flex min-h-[20rem] items-center justify-center rounded-3xl border border-border bg-background/70 p-6 shadow-inner">
        {qrDataUrl ? (
          <img
            key={`${qrPayload}-${qrSize}`}
            src={qrDataUrl}
            alt={`${qrType} QR code preview`}
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

      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-bold uppercase text-muted-foreground">Encoded content</p>
        <p className="mt-2 max-h-24 overflow-auto break-all font-mono text-xs leading-5 text-foreground">
          {qrPayload || "Your QR payload will appear here."}
        </p>
      </div>
    </aside>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <img src={pixeltagLogo} alt="PixelTag logo" width={1024} height={1024} loading="lazy" className="size-7 rounded-lg" />
        <span className="font-semibold text-foreground">PixelTag</span>
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

function activeContentKey(qrType: QrType): keyof FormState {
  if (qrType === "url") {
    return "url";
  }
  if (qrType === "text") {
    return "text";
  }
  if (qrType === "wifi") {
    return "wifiSsid";
  }
  if (qrType === "email") {
    return "email";
  }
  return "phone";
}
