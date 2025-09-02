# Smart Compressor (React + Vite + TypeScript)

A simple, beautiful web app to compress text files, images, and PDFs.

- Text: Huffman (demo) and Deflate (LZ77+Huffman via pako)
- Images: Canvas-based recompression with quality control
- PDF: Lightweight re-save using pdf-lib with object streams (demo)

## Features
- Upload `.txt`, images, or `.pdf`
- Choose algorithm: Deflate, Huffman, Image, PDF
- Pick target compression percent (10–90%)
- One-click Compress and Download
- Built with TailwindCSS and shadcn/ui style

## Getting Started

```bash
# 1) Install deps
npm install

# 2) Start dev server
npm run dev

# 3) Open the app
# Vite will print a local URL (e.g., http://localhost:5173)
```

## How It Works

- Deflate: Uses `pako` to compress text. Compression level is derived from the selected target percent.
- Huffman: Minimal educational encoder for text; produces a binary blob with the Huffman-coded payload.
- Images: Loads the image in a canvas and re-encodes (JPEG/PNG). For JPEG, the quality parameter is derived from target percent; optionally applies mild downscaling.
- PDF: Uses `pdf-lib` to re-save with object streams and stripped metadata. For heavier compression (rasterization/downsampling embedded images), a more advanced pipeline is required (e.g., render with `pdfjs-dist` to canvas, then reassemble), which is outside the scope of this simple demo.

## Notes & Limitations
- Huffman here is encoder-only for demonstration; it does not produce a self-describing container. Use Deflate for practical results.
- Image compression depends on the source format and content; PNG is lossless and controlled via re-encoding.
- PDF compression varies widely. This demo step keeps things client-only and fast but may not always achieve a large reduction.

## Project Structure
- `src/App.tsx`: Main UI (upload, algorithm selection, percent slider, compress/download)
- `src/lib/compressors.ts`: Compression helpers for text, images, and PDF

## License
MIT
# PixelPack
