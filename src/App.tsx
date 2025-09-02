import { useEffect, useMemo, useRef, useState, forwardRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, Gauge, Scissors } from 'lucide-react'
import { ThemeToggle } from '@/lib/theme'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import JSZip from 'jszip'

import '@/index.css'

import { compressText, compressImage, compressPdf } from '@/lib/compressors'

function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        'inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ' +
        (props.className ?? '')
      }
    >
      {children}
    </button>
  )
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
    >
      {children}
    </select>
  )
}

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input
    ref={ref}
    {...props}
    className={
      'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 ' +
      (props.className ?? '')
    }
  />
))

function formatBytes(size: number) {
  if (size === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

const SETTINGS_KEY = 'pixelpack-settings'

type Preset = 'balanced' | 'max-quality' | 'max-reduction'

export default function App() {
  const location = useLocation() as any
  const [file, setFile] = useState<File | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [algorithm, setAlgorithm] = useState<'huffman' | 'deflate' | 'image' | 'pdf'>('deflate')
  const [targetPercent, setTargetPercent] = useState<number>(30)
  const [preset, setPreset] = useState<Preset>('balanced')
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [outputName, setOutputName] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)

  // Load settings/share from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const share = params.get('s')
    if (share) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(share)))
        if (decoded.algorithm) setAlgorithm(decoded.algorithm)
        if (decoded.targetPercent) setTargetPercent(decoded.targetPercent)
        if (decoded.preset) setPreset(decoded.preset)
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem(SETTINGS_KEY)
        if (saved) {
          const obj = JSON.parse(saved)
          if (obj.algorithm) setAlgorithm(obj.algorithm)
          if (obj.targetPercent) setTargetPercent(obj.targetPercent)
          if (obj.preset) setPreset(obj.preset)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    const toSave = JSON.stringify({ algorithm, targetPercent, preset })
    try { localStorage.setItem(SETTINGS_KEY, toSave) } catch {}
  }, [algorithm, targetPercent, preset])

  // Preload file if navigated from Landing with state
  useEffect(() => {
    const maybeFile: File | undefined = location?.state?.fileTransfer
    if (maybeFile) { setFile(maybeFile); setFiles([maybeFile]) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drag and drop + paste
  useEffect(() => {
    const drop = dropRef.current
    if (!drop) return
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation() }
    const onDrop = (e: DragEvent) => {
      prevent(e)
      const list = Array.from(e.dataTransfer?.files || [])
      if (list.length) { setFiles(list); setFile(list[0]) }
    }
    drop.addEventListener('dragenter', prevent)
    drop.addEventListener('dragover', prevent)
    drop.addEventListener('drop', onDrop)
    const onPaste = (e: ClipboardEvent) => {
      const list = Array.from(e.clipboardData?.files || [])
      if (list.length) { setFiles(list); setFile(list[0]) }
    }
    window.addEventListener('paste', onPaste)
    return () => {
      drop.removeEventListener('dragenter', prevent)
      drop.removeEventListener('dragover', prevent)
      drop.removeEventListener('drop', onDrop)
      window.removeEventListener('paste', onPaste)
    }
  }, [])

  // Presets
  useEffect(() => {
    if (preset === 'max-quality') setTargetPercent(10)
    else if (preset === 'balanced') setTargetPercent(30)
    else if (preset === 'max-reduction') setTargetPercent(70)
  }, [preset])

  const inputDesc = useMemo(() => {
    if (files.length) return `${files.length} file(s) selected${file ? ` • ${file.name}` : ''}`
    if (!file) return 'No file selected'
    return `${file.name} • ${formatBytes(file.size)}`
  }, [file, files])

  const outputDesc = useMemo(() => {
    if (!outputBlob) return '—'
    return `${formatBytes(outputBlob.size)}`
  }, [outputBlob])

  const compressionSummary = useMemo(() => {
    if (!file || !outputBlob) return '—'
    const saved = file.size - outputBlob.size
    const pct = saved <= 0 ? 0 : Math.max(0, Math.min(100, (saved / file.size) * 100))
    return `${pct.toFixed(1)}% smaller (${formatBytes(saved)} saved)`
  }, [file, outputBlob])

  function buildShareLink() {
    const obj = { algorithm, targetPercent, preset }
    const s = btoa(encodeURIComponent(JSON.stringify(obj)))
    const url = new URL(window.location.href)
    url.searchParams.set('s', s)
    return url.toString()
  }

  async function compressSingle(f: File): Promise<{ name: string; blob: Blob }> {
    if (f.type.startsWith('image/')) {
      const b = await compressImage(f, targetPercent)
      // keep original extension (png stays png, jpeg stays jpeg)
      return { name: f.name, blob: b }
    }
    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      const b = await compressPdf(f, targetPercent)
      return { name: f.name, blob: b }
    }
    const text = await f.text()
    const algo = algorithm === 'huffman' || algorithm === 'deflate' ? algorithm : 'deflate'
    const b = await compressText(text, algo, targetPercent)
    // keep original filename and extension (e.g., .txt)
    return { name: f.name , blob: b }
  }

  async function handleCompress() {
    if (!file && files.length === 0) return
    setProcessing(true)
    setOutputBlob(null)
    try {
      if (files.length <= 1 && file) {
        const res = await compressSingle(file)
        setOutputBlob(res.blob)
        setOutputName(res.name)
      } else {
        const zip = new JSZip()
        for (const f of files) {
          const res = await compressSingle(f)
          zip.file(res.name, res.blob)
        }
        const zipped = await zip.generateAsync({ type: 'blob' })
        setOutputBlob(zipped)
        setOutputName('pixelpack-compressed.zip')
      }
    } catch (err) {
      console.error(err)
      alert('Compression failed. See console for details.')
    } finally {
      setProcessing(false)
    }
  }

  function handleDownload() {
    if (!outputBlob) return
    const url = URL.createObjectURL(outputBlob)
    const a = document.createElement('a')
    const defaultName = outputName || (files.length > 1 ? 'pixelpack-compressed.zip' : (file ? file.name : 'output'))
    a.href = url
    a.download = defaultName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function resetAll() {
    setFile(null)
    setFiles([])
    setOutputBlob(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {processing && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}
      <div className="w-full px-4 py-10 md:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size={40} withLink={true} />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">PixelPack</h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">Compress text, images, and PDFs with Huffman, Deflate, and more.</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Files</label>
              <div ref={dropRef} className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                Drag & drop files here, paste from clipboard, or use the picker below.
              </div>
              <Input
                ref={inputRef as any}
                type="file"
                multiple
                accept=".txt,.md,.json,image/*,.pdf"
                onChange={(e) => { const list = Array.from(e.target.files || []); setFiles(list); setFile(list[0] || null) }}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">{inputDesc}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">Algorithm</label>
                  <Select value={algorithm} onChange={(v) => setAlgorithm(v as any)}>
                    <option value="deflate">Deflate (LZ77 + Huffman)</option>
                    <option value="huffman">Huffman (text)</option>
                    <option value="image">Image (quality-based)</option>
                    <option value="pdf">PDF (downsample + recompress)</option>
                  </Select>
                </div>
      <div>
                  <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">Preset</label>
                  <Select value={preset} onChange={(v) => setPreset(v as Preset)}>
                    <option value="max-quality">Max quality</option>
                    <option value="balanced">Balanced</option>
                    <option value="max-reduction">Max reduction</option>
                  </Select>
                </div>
              </div>

              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">Target compression percent</label>
              <input
                type="range"
                min={10}
                max={90}
                value={targetPercent}
                onChange={(e) => setTargetPercent(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3" /> Target: {targetPercent}%</span>
                <span>Higher means smaller file</span>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleCompress} disabled={(files.length === 0 && !file) || processing}>
                  <Scissors className="h-4 w-4" /> {processing ? 'Compressing…' : 'Compress'}
                </Button>
                <Button onClick={handleDownload} disabled={!outputBlob}>
                  <Download className="h-4 w-4" /> Download
                </Button>
                <Button onClick={resetAll} className="bg-slate-700 hover:bg-slate-600">Reset</Button>
                <Button onClick={() => { navigator.clipboard.writeText(buildShareLink()) }} className="bg-slate-700 hover:bg-slate-600">Copy share link</Button>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-sm text-slate-700 dark:text-slate-300">Output</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Size: {outputDesc}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Effect: {compressionSummary}</div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                <p className="mb-1 font-medium">Tips</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Drag & drop or paste files to add quickly.</li>
                  <li>Use presets to snap to quality or reduction.</li>
                  <li>Copy a share link to persist your compression settings.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Preview</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">Image files only</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Original</div>
                  {file && file.type.startsWith('image/') && (
                    <img src={URL.createObjectURL(file)} className="h-64 w-full rounded-md object-contain bg-slate-50 dark:bg-slate-800" alt="original preview" />
                  )}
                  {file && file.type.startsWith('image/') && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</div>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Compressed</div>
                  {outputBlob && outputBlob.type && outputBlob.type.startsWith('image/') && (
                    <img src={URL.createObjectURL(outputBlob)} className="h-64 w-full rounded-md object-contain bg-slate-50 dark:bg-slate-800" alt="compressed preview" />
                  )}
                  {outputBlob && outputBlob.type && outputBlob.type.startsWith('image/') && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatBytes(outputBlob.size)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
      </div>
  )
}
