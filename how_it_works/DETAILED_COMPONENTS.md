# PixelPack - Detailed Components

Routing (src/main.tsx)
- Routes: '/', '/compress', '/edit', '/to-pdf', '/about'
- ThemeProvider wraps router

Theme (src/lib/theme.tsx)
- Context with theme: 'light' | 'dark'
- Persists to localStorage; toggles documentElement class

Compressor (src/App.tsx)
- Upload: input, drag-drop, paste
- Presets: set target percent
- Share link: encodes settings in URL 's' param
- Batch: compress files and zip with JSZip
- Text: compressText(text, algo)
- Image: compressImage(file, percent)
- PDF: compressPdf(file, percent)
- Preview: shows sizes and % saved; image preview panel

Compressors (src/lib/compressors.ts)
- Text
  - Deflate: pako.deflate with level from target percent
  - Huffman: demo encoder builds tree and bitpack
- Image
  - Canvas draw, optional downscale, toBlob with quality for JPEG
- PDF
  - pdf-lib load + save with object streams; light optimization

Image Editor (src/pages/ImageEditor.tsx)
- Filters: brightness, contrast, saturation, hue, blur (CSS canvas filter)
- Rotate: canvas rotation
- Crop: overlay with corner + edge handles, mapped to canvas pixels
- Text layers: multiple layers, click to insert, drag to move, resize handle to scale size, per-layer font/color/size
- Export: canvas.toBlob('image/png')

Convert to PDF (src/pages/ToPdf.tsx)
- Upload multiple images
- Options: page size (A4/Letter), orientation
- Fit image to page with margins; addImage per page; download PDF

Landing (src/pages/Landing.tsx)
- Hero, action buttons, gallery of domain images

Footer/Logo
- Footer with attribution
- Logo component for brand + mark

Known Limitations
- PDF compression is light; no rasterization/downsample pipeline
- No Web Workers; heavy operations could block on very large inputs
- Huffman is demo-only; no container format or decompressor here

Future Work
- WASM codecs (Brotli/Zstd), worker threads, stronger PDF optimization, undo/redo in editor, presets library
