import { Link } from 'react-router-dom'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

export default function About() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-8 flex items-center justify-between">
          <Logo size={40} />
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/compress" className="text-slate-700 hover:underline dark:text-slate-300">Compressor</Link>
            <Link to="/" className="text-slate-700 hover:underline dark:text-slate-300">Home</Link>
          </nav>
        </header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">About</h1>
        <p className="mt-4 text-slate-700 dark:text-slate-300">This app demonstrates modern, privacy-first file compression in the browser using JavaScript and Web APIs.</p>
        <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white/60 p-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Algorithms</div>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
              <li>Deflate (LZ77 + Huffman) via pako</li>
              <li>Huffman demo encoder for educational purposes</li>
              <li>Image recompression via Canvas (quality + optional downscale)</li>
              <li>PDF re-save with pdf-lib (object streams, metadata strip)</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Features</div>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
              <li>Upload, compress, and download with a target compression percent</li>
              <li>Image preview of original vs compressed with sizes</li>
              <li>Beautiful UI with Tailwind and shadcn styles</li>
              <li>Light/Dark theme with persistence</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tech Stack</div>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
              <li>Vite + React + TypeScript</li>
              <li>TailwindCSS + shadcn/ui style primitives</li>
              <li>pako, pdf-lib, Canvas APIs</li>
            </ul>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">All processing happens locally in your browser. No files are uploaded to a server.</div>
        </div>
        <div className="mt-6 flex gap-3">
          <Link to="/compress" className="rounded-md bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800">Open Compressor</Link>
          <Link to="/" className="rounded-md border border-slate-300 px-5 py-2.5 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/50">Back Home</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
