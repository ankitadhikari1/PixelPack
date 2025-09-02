# PixelPack - High Level Design

Goal
- Client-side file compression and lightweight image/PDF utilities with a clean, modern UI.

System Context
- Frontend-only (Vite + React + TS), all processing in the browser
- No backend; privacy-friendly
- UI stack: TailwindCSS + shadcn styles
- Routing: react-router-dom

Key Pages
- Landing: marketing, quick actions
- Compressor (/compress): upload, choose algorithm, target percent, batch, ZIP export
- Image Editor (/edit): filters, crop (handles), text layers (drag/resize), export
- Convert to PDF (/to-pdf): merge images into a single PDF
- About (/about): feature/stack overview

Core Modules
- src/lib/compressors.ts
  - Text: Deflate (pako), demo Huffman
  - Image: Canvas re-encode (quality, optional downscale)
  - PDF: pdf-lib optimize and save
- src/pages/*: screens and UI logic
- src/lib/theme.tsx: ThemeProvider + toggle (persisted)

Data Flow (compress)
1) User adds files (picker / drag-drop / paste)
2) UI selects algorithm + target percent/preset
3) For each file:
   - Text → pako.deflate or demo Huffman → Blob
   - Image → draw to canvas → toBlob (JPEG/PNG) → Blob
   - PDF → pdf-lib save (object streams) → Blob
4) If multiple files → bundle with JSZip → one ZIP Blob
5) Download: anchor with object URL

State & Persistence
- React state per page
- Settings saved to localStorage (algorithm, target, preset)
- Share link encodes settings to URL (base64 JSON)

Performance & Privacy
- All transforms run client-side, no uploads
- Heavy work kept simple; optional future Web Workers/WASM

Extensibility
- Add algorithms (Brotli/LZMA) behind compressors.ts
- Add editor tools as new layer types (brush/shapes)
- Replace PDF pipeline with rasterize + reassemble for stronger compression
