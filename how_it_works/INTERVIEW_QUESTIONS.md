# PixelPack - Interview Questions

General
1) What problem does PixelPack solve?
- Client-side compression and basic editing without uploading files.

2) Why client-side only?
- Privacy, speed, zero infra. Modern browsers provide enough APIs.

Architecture
3) Why Vite + React + TS?
- Fast dev, typed safety, ecosystem.

4) How is state managed?
- Local component state; simple enough not to need global stores.

Compression
5) Which algorithms are used?
- Deflate (pako) for text; demo Huffman; canvas re-encode for images; pdf-lib re-save.

6) Why not Brotli/LZMA/Zstd?
- Could be added via WASM/JS libs. Kept simple for demo performance and size.

7) How do you handle binary outputs for text?
- Binary blobs (octet-stream) and keep original file extension on download.

Images & PDF
8) How does image compression work?
- Draw to canvas → adjust quality/scale → toBlob.

9) How accurate is PDF compression?
- Lightweight. Re-saving with object streams helps; heavier gains need rasterization.

Security & Privacy
10) Are files uploaded?
- No. All work happens in-browser.

11) Any sandboxing or worker threads?
- Not yet; can offload heavy steps to Web Workers later.

Performance
12) How do you avoid blocking the UI?
- Async APIs, chunking per file loop; can move to Web Workers if needed.

UX
13) How are settings shared/persisted?
- localStorage and a base64-encoded URL param.

Image Editor
14) How does crop with handles work?
- Overlay maps pointer coords to canvas pixels; handles adjust rect; render crops source region.

15) How are multiple text layers supported?
- Each layer stores text, position, size, color, font; hit-testing and handle for resize.

Testing & Future
16) What would you add next?
- WASM codecs (Brotli, Zstd), workerization, stronger PDF pipeline, undo/redo, AI tools.
