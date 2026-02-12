![Label Designer](.github/assets/banner.png)

# Label Designer

A client-side web app for designing and printing labels from spreadsheet data. Import a `.csv` or `.xlsx` file, lay out your labels with text and QR codes, and print — all without your data ever leaving the browser.

## Features

- **Spreadsheet import** — Drag and drop `.csv`, `.xlsx`, or `.xls` files with automatic column detection and multi-sheet support
- **Visual label editor** — Position and resize text and QR code fields on a live-preview canvas with zoom controls
- **Flexible layout** — Choose from paper size presets (A3, A4, A5, Letter, Legal) or enter custom dimensions, then configure label rows, columns, margins, and gaps
- **Dynamic fields** — Map spreadsheet columns to text or QR code fields, or add static text
- **Print-ready output** — Generates paginated label sheets with print-optimized styles, ready for your browser's print dialog
- **Privacy first** — Everything runs client-side. No server, no uploads, no tracking

## Getting Started

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Usage

1. **Import** — Upload a spreadsheet file on the home page
2. **Design** — Configure paper and label sizes, then add and arrange fields on the canvas
3. **Print** — Preview the generated label sheets and print

## Building

```bash
bun run build
```

Produces a static site in `build/` that can be deployed to any static host

## Licence
MIT License. See [LICENCE](LICENCE.md) for details.