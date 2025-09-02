import { useNavigate, Link } from 'react-router-dom'
import { useRef } from 'react'
import { ThemeToggle } from '@/lib/theme'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

export default function Landing() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handlePick() {
    inputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    navigate('/compress', { state: { fileTransfer: file } })
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/20" />
      <div className="pointer-events-none absolute -right-32 top-40 h-80 w-80 rounded-full bg-purple-300/40 blur-3xl dark:bg-purple-500/20" />

      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="flex items-center justify-between">
          <Logo size={44} />
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/compress" className="text-slate-700 hover:underline dark:text-slate-300">Compressor</Link>
            <Link to="/edit" className="text-slate-700 hover:underline dark:text-slate-300">Image Editor</Link>
            <Link to="/to-pdf" className="text-slate-700 hover:underline dark:text-slate-300">Convert to PDF</Link>
            <Link to="/about" className="text-slate-700 hover:underline dark:text-slate-300">About</Link>
            <ThemeToggle />
          </nav>
        </header>

        <main className="relative mt-14 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Glass hero card */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-500 rounded-2xl border border-white/20 bg-white/40 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 drop-shadow-sm dark:text-slate-100">Compress files in your browser</h1>
            <p className="mt-4 max-w-prose text-slate-700 dark:text-slate-300">Upload text, images, or PDFs. Choose algorithms like Deflate and Huffman. Preview images and download compressed results securely—no server upload.</p>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 items-stretch justify-items-stretch">
              <button onClick={handlePick} className="inline-flex min-h-[4rem] w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:from-sky-400 hover:to-violet-500 duration-150 text-center whitespace-normal leading-snug" title="Upload & Compress">
                Upload & Compress
              </button>
              <Link to="/compress" className="inline-flex min-h-[4rem] w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:from-emerald-400 hover:to-teal-500 duration-150 text-center whitespace-normal leading-snug" title="Go to Compressor">Go to Compressor</Link>
              <Link to="/edit" className="inline-flex min-h-[4rem] w-full items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:from-fuchsia-400 hover:to-pink-500 duration-150 text-center whitespace-normal leading-snug" title="Open Image Editor">Open Image Editor</Link>
              <Link to="/to-pdf" className="inline-flex min-h-[4rem] w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:from-rose-400 hover:to-orange-400 duration-150 text-center whitespace-normal leading-snug" title="Convert to PDF">Convert to PDF</Link>
            </div>
            <input ref={inputRef as any} type="file" className="hidden" accept=".txt,.md,.json,image/*,.pdf" onChange={onFileChange} />
            <div className="mt-8 grid gap-3 text-sm text-slate-700/90 dark:text-slate-300/90">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Client-side only
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-500" /> Multiple algorithms
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-purple-500" /> Image preview support
              </div>
            </div>
          </div>

          {/* Preview/Images side */}
          <div className="relative animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-xl bg-white/30 blur-xl dark:bg-white/10" />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">ZIP Compression</div>
                <img src="/assets/zip.svg" alt="ZIP" className="mt-3 h-32 w-full rounded-md object-contain md:h-36" />
              </div>
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">PNG/JPEG Optimization</div>
                <img src="/assets/png.svg" alt="PNG" className="mt-3 h-32 w-full rounded-md object-contain md:h-36" />
              </div>
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">PDF Size Reduction</div>
                <img src="/assets/pdf.svg" alt="PDF" className="mt-3 h-32 w-full rounded-md object-contain md:h-36" />
              </div>
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Image Editing</div>
                <img src="/assets/edit.svg" alt="Edit" className="mt-3 h-32 w-full rounded-md object-contain md:h-36" />
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
