# Pixel Tag

Create QR codes in seconds.

Pixel Tag is a fast, no-signup QR studio. Pick a type, customize the code, and download a scan-ready PNG. The live preview updates as you type.

**Live app:** [https://pixel-tag.lovable.app/](https://pixel-tag.lovable.app/)  
**Repository:** [https://github.com/Alapipapi-Main/pixel-tag](https://github.com/Alapipapi-Main/pixel-tag)

## Features

- Five QR types: website URL, text, Wi-Fi, email, and phone
- Live preview
- Custom QR color and background color, including hex values
- Size options: Small (192px), default (320×320), and Large (512px)
- Error-correction / quality picker: Low (~7%), Medium (~15%), High (~25%), Max (~30%)
- Download as PNG
- Copy the entered content
- Clear all fields
- Input validation (URL, Wi-Fi, email, and phone)
- Dark and light mode
- Responsive layout
- SEO metadata, sitemap, and Open Graph image
- No account required

## QR types

| Type | What it encodes |
| --- | --- |
| Website URL | A valid web address |
| Text | Any note or message |
| Wi-Fi | Network name, password, and security type |
| Email | Address, subject, and body |
| Phone | A phone number |

Higher error correction helps if the code is printed small or partly covered. It also makes the pattern denser, so keep strong contrast between the QR color and the background.

## Tech stack

Built with [Lovable](https://lovable.dev) on the TanStack Start template.

- [TanStack Start](https://tanstack.com/start) and [TanStack Router](https://tanstack.com/router) for file-based routing
- React 19 and TypeScript
- Vite
- Tailwind CSS 4 and Radix UI
- [`qrcode`](https://github.com/soldair/node-qrcode) for code generation
- Zod for validation

Routes live in `src/routes`. The app shell is `src/routes/__root.tsx`, and the generator page is `src/routes/index.tsx`.

## Getting started

You need Node.js and npm. [nvm](https://github.com/nvm-sh/nvm) is a simple way to install them.

```bash
git clone https://github.com/Alapipapi-Main/pixel-tag.git
cd pixel-tag
npm install
npm run dev
```

Then open the local URL printed in the terminal.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

A `bun.lock` file is also in the repo, so Bun can be used if you prefer it.

## Project layout

```text
public/          static assets and sitemap
src/assets/      images, including the logo
src/components/  UI components
src/routes/      file-based routes
src/styles.css   global styles
roadmap.md       planned updates
```

## Roadmap

Already shipped: the base generator, validation, dark/light mode, responsive layout, SEO, and the QR quality picker.

Planned next:

- Logo in the center of the QR code
- History of recently generated codes, stored on the device only
- More types: vCard, SMS, and WhatsApp link
- SVG and JPG download, plus copy image
- Frame styles with a caption
- Scan tracking with short links
- Batch generation from CSV

See [roadmap.md](roadmap.md) for the full sequence.

## Contributing

Issues and small pull requests are welcome, especially around scan reliability, contrast, and the Wi-Fi and email forms.

1. Fork the repository.
2. Create a branch for your change.
3. Open a pull request describing what changed and how to test it.

Changes pushed to `main` sync back into Lovable.

## License

No license file is published yet. All rights reserved until one is added.
