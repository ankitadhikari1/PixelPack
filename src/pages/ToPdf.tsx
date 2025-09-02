import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { ThemeToggle } from '@/lib/theme'
import Footer from '@/components/Footer'

export default function ToPdf() {
  const [images, setImages] = useState<File[]>([])
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4')
  const [orientation, setOrientation] = useState<'p' | 'l'>('p')
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    setImages(list)
  }

  async function generatePdf() {
    if (images.length === 0) return
    setProcessing(true)
    try {
      const doc = new jsPDF({ orientation: orientation === 'p' ? 'portrait' : 'landscape', unit: 'pt', format: pageSize })
      let first = true
      for (const file of images) {
        const url = URL.createObjectURL(file)
        const img = await new Promise<HTMLImageElement>((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = url })
        const pageW = doc.internal.pageSize.getWidth()
        const pageH = doc.internal.pageSize.getHeight()
        // fit image into page preserving aspect ratio with margins
        const margin = 24
        const maxW = pageW - margin * 2
        const maxH = pageH - margin * 2
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight)
        const drawW = Math.min(maxW, img.naturalWidth * scale)
        const drawH = Math.min(maxH, img.naturalHeight * scale)
        const x = (pageW - drawW) / 2
        const y = (pageH - drawH) / 2
        const format = file.type.includes('png') ? 'PNG' : 'JPEG'
        if (!first) doc.addPage()
        first = false
        doc.addImage(img, format, x, y, drawW, drawH)
        URL.revokeObjectURL(url)
      }
      const blob = doc.output('blob')
      const outUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = outUrl
      a.download = 'images.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(outUrl)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {processing && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">PixelPack • Convert to PDF</Link>
          <ThemeToggle />
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Images</label>
              <input ref={inputRef as any} type="file" accept="image/*" multiple onChange={onFiles} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{images.length} image(s) selected</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mt-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Page Size</label>
                  <select value={pageSize} onChange={(e) => setPageSize(e.target.value as any)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>
                <div>
                  <label className="mt-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Orientation</label>
                  <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <option value="p">Portrait</option>
                    <option value="l">Landscape</option>
                  </select>
                </div>
              </div>

              <button onClick={generatePdf} disabled={images.length === 0 || processing} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50">Create PDF</button>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-slate-700 dark:text-slate-300">Preview (first 4)</div>
              <div className="grid grid-cols-2 gap-3">
                {images.slice(0, 4).map((f, idx) => {
                  const url = URL.createObjectURL(f)
                  return (
                    <div key={idx} className="rounded-md border border-slate-200 p-2 dark:border-slate-800">
                      <img src={url} className="h-40 w-full rounded object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                      <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{f.name}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
