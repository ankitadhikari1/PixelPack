import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/lib/theme'
import Footer from '@/components/Footer'

type Filters = {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  blur: number
}

export default function ImageEditor() {
  const [file, setFile] = useState<File | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [filters, setFilters] = useState<Filters>({ brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0 })
  type TextLayer = { id: string; text: string; x: number; y: number; size: number; color: string; fontFamily: string }
  const [textLayers, setTextLayers] = useState<TextLayer[]>([])
  const [draftText, setDraftText] = useState<string>('')
  const [draftColor, setDraftColor] = useState<string>('#ffffff')
  const [draftSize, setDraftSize] = useState<number>(32)
  const [draftFont, setDraftFont] = useState<string>('ui-sans-serif, system-ui')
  const [isPlacingText, setIsPlacingText] = useState<boolean>(false)
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [activeTextHandle, setActiveTextHandle] = useState<null | 'move' | 'resize'>(null)
  const textDragOffsetRef = useRef<{ dx: number; dy: number } | null>(null)
  const [rotation, setRotation] = useState<number>(0)

  // Crop state
  const [isCropping, setIsCropping] = useState<boolean>(false)
  // crop coordinates are stored in CANVAS pixel space to avoid scaling issues
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [activeHandle, setActiveHandle] = useState<null | 'move' | 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'bm' | 'lm' | 'rm'>(null)
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!file) return setImage(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage(img)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [file])

  useEffect(() => {
    render()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, filters, rotation, cropRect, textLayers])

  function getFilterString() {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px)`
  }

  function render() {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')!

    // Set canvas to image or crop size
    const baseW = image.naturalWidth
    const baseH = image.naturalHeight
    const cropW = cropRect ? cropRect.w : baseW
    const cropH = cropRect ? cropRect.h : baseH
    canvas.width = cropW
    canvas.height = cropH

    ctx.save()
    ctx.filter = getFilterString()
    ctx.translate(cropW / 2, cropH / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    const drawW = cropRect ? cropRect.w : baseW
    const drawH = cropRect ? cropRect.h : baseH
    const sx = cropRect ? cropRect.x : 0
    const sy = cropRect ? cropRect.y : 0
    ctx.drawImage(image, sx, sy, drawW, drawH, -cropW / 2, -cropH / 2, cropW, cropH)
    ctx.restore()

    // draw text layers
    for (const layer of textLayers) {
      ctx.font = `${layer.size}px ${layer.fontFamily}`
      ctx.fillStyle = layer.color
      ctx.textBaseline = 'top'
      ctx.fillText(layer.text || '', layer.x, layer.y)
    }
  }

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'edited.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  function getCanvasPointFromEvent(e: React.MouseEvent) {
    const overlay = overlayRef.current
    const canvas = canvasRef.current
    if (!overlay || !canvas) return null
    const rect = overlay.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY
    return { px, py }
  }
  function hitTestText(px: number, py: number): { layer: TextLayer; bounds: { w: number; h: number } } | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')!
    // topmost first: iterate reversed
    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i]
      ctx.font = `${layer.size}px ${layer.fontFamily}`
      const metrics = ctx.measureText(layer.text || ' ')
      const w = Math.max(10, metrics.width)
      const h = layer.size
      if (px >= layer.x && py >= layer.y && px <= layer.x + w && py <= layer.y + h) {
        return { layer, bounds: { w, h } }
      }
    }
    return null
  }

  function onOverlayMouseDown(e: React.MouseEvent) {
    const pt = getCanvasPointFromEvent(e)
    const canvas = canvasRef.current
    if (!pt || !canvas) return
    const { px, py } = pt

    // Text placement / select / drag / resize
    if (!isCropping) {
      if (isPlacingText) {
        const id = crypto.randomUUID()
        const layer: TextLayer = { id, text: draftText || 'Text', x: Math.round(px), y: Math.round(py), size: draftSize, color: draftColor, fontFamily: draftFont }
        setTextLayers((prev) => [...prev, layer])
        setSelectedTextId(id)
        setIsPlacingText(false)
        return
      }
      const hit = hitTestText(px, py)
      if (hit) {
        setSelectedTextId(hit.layer.id)
        // check resize handle (bottom-right 12x12)
        const handle = 12
        const hx1 = hit.layer.x + hit.bounds.w - handle
        const hy1 = hit.layer.y + hit.bounds.h - handle
        if (px >= hx1 && py >= hy1) {
          setActiveTextHandle('resize')
          textDragOffsetRef.current = { dx: px - hit.layer.x, dy: py - hit.layer.y }
        } else {
          setActiveTextHandle('move')
          textDragOffsetRef.current = { dx: px - hit.layer.x, dy: py - hit.layer.y }
        }
        return
      } else {
        setSelectedTextId(null)
      }
    }

    if (!isCropping) return

    // If clicking inside existing crop rect, start move
    if (cropRect && px >= cropRect.x && py >= cropRect.y && px <= cropRect.x + cropRect.w && py <= cropRect.y + cropRect.h) {
      setActiveHandle('move')
      dragOffsetRef.current = { dx: px - cropRect.x, dy: py - cropRect.y }
      return
    }

    // Otherwise start a new rect
    setActiveHandle(null)
    setCropStart({ x: Math.max(0, Math.min(canvas.width, px)), y: Math.max(0, Math.min(canvas.height, py)) })
    setCropRect(null)
  }

  function onOverlayMouseMove(e: React.MouseEvent) {
    const pt = getCanvasPointFromEvent(e)
    const canvas = canvasRef.current
    if (!pt || !canvas) return
    const { px, py } = pt

    if (selectedTextId && activeTextHandle && textDragOffsetRef.current) {
      setTextLayers((prev) => prev.map((l) => {
        if (l.id !== selectedTextId) return l
        if (activeTextHandle === 'move') {
          const nx = Math.max(0, Math.min(canvas.width - 5, px - textDragOffsetRef.current!.dx))
          const ny = Math.max(0, Math.min(canvas.height - 5, py - textDragOffsetRef.current!.dy))
          return { ...l, x: Math.round(nx), y: Math.round(ny) }
        }
        if (activeTextHandle === 'resize') {
          // compute new size based on diagonal drag distance
          const dx = Math.max(10, px - l.x)
          const newSize = Math.max(8, Math.min(300, dx / (l.text.length > 0 ? l.text.length * 0.5 : 1)))
          return { ...l, size: Math.round(newSize) }
        }
        return l
      }))
      return
    }

    if (!isCropping) return

    if (activeHandle && cropRect) {
      const minSize = 10
      let { x, y, w, h } = cropRect
      const right = x + w
      const bottom = y + h
      if (activeHandle === 'move' && dragOffsetRef.current) {
        const nx = Math.max(0, Math.min(canvas.width - w, px - dragOffsetRef.current.dx))
        const ny = Math.max(0, Math.min(canvas.height - h, py - dragOffsetRef.current.dy))
        setCropRect({ x: Math.round(nx), y: Math.round(ny), w, h })
        return
      }
      if (activeHandle === 'tl') {
        x = Math.max(0, Math.min(right - minSize, px))
        y = Math.max(0, Math.min(bottom - minSize, py))
        w = right - x
        h = bottom - y
      } else if (activeHandle === 'tr') {
        y = Math.max(0, Math.min(bottom - minSize, py))
        w = Math.max(minSize, Math.min(canvas.width - x, px - x))
        h = bottom - y
      } else if (activeHandle === 'bl') {
        x = Math.max(0, Math.min(right - minSize, px))
        w = right - x
        h = Math.max(minSize, Math.min(canvas.height - y, py - y))
      } else if (activeHandle === 'br') {
        w = Math.max(minSize, Math.min(canvas.width - x, px - x))
        h = Math.max(minSize, Math.min(canvas.height - y, py - y))
      } else if (activeHandle === 'tm') { // top edge
        y = Math.max(0, Math.min(bottom - minSize, py))
        h = bottom - y
      } else if (activeHandle === 'bm') { // bottom edge
        h = Math.max(minSize, Math.min(canvas.height - y, py - y))
      } else if (activeHandle === 'lm') { // left edge
        x = Math.max(0, Math.min(right - minSize, px))
        w = right - x
      } else if (activeHandle === 'rm') { // right edge
        w = Math.max(minSize, Math.min(canvas.width - x, px - x))
      }
      setCropRect({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) })
      return
    }

    if (!cropStart) return
    const x1 = Math.max(0, Math.min(canvas.width, cropStart.x))
    const y1 = Math.max(0, Math.min(canvas.height, cropStart.y))
    const x2 = Math.max(0, Math.min(canvas.width, px))
    const y2 = Math.max(0, Math.min(canvas.height, py))
    const left = Math.min(x1, x2)
    const top = Math.min(y1, y2)
    const w = Math.max(1, Math.abs(x2 - x1))
    const h = Math.max(1, Math.abs(y2 - y1))
    setCropRect({ x: Math.round(left), y: Math.round(top), w: Math.round(w), h: Math.round(h) })
  }
  function onOverlayMouseUp() {
    if (activeTextHandle) {
      setActiveTextHandle(null)
      textDragOffsetRef.current = null
      return
    }
    if (!isCropping) return
    setActiveHandle(null)
    setCropStart(null)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">PixelPack • Image Editor</Link>
          <div className="flex items-center gap-3">
            <Link to="/compress" className="text-sm text-slate-700 hover:underline dark:text-slate-300">Compressor</Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-white/60 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Image</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Brightness {filters.brightness}%</label>
                  <input type="range" min={0} max={200} value={filters.brightness} onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs">Contrast {filters.contrast}%</label>
                  <input type="range" min={0} max={200} value={filters.contrast} onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs">Saturation {filters.saturation}%</label>
                  <input type="range" min={0} max={300} value={filters.saturation} onChange={(e) => setFilters({ ...filters, saturation: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs">Hue {filters.hue}°</label>
                  <input type="range" min={-180} max={180} value={filters.hue} onChange={(e) => setFilters({ ...filters, hue: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs">Blur {filters.blur}px</label>
                  <input type="range" min={0} max={10} value={filters.blur} onChange={(e) => setFilters({ ...filters, blur: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs">Rotate {rotation}°</label>
                  <input type="range" min={-180} max={180} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Text</label>
                  <input type="text" value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Type text" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="text-xs">Size</label>
                  <input type="number" min={8} max={300} value={draftSize} onChange={(e) => setDraftSize(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="text-xs">Color</label>
                  <input type="color" value={draftColor} onChange={(e) => setDraftColor(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="text-xs">Font</label>
                  <select value={draftFont} onChange={(e) => setDraftFont(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <option value="ui-sans-serif, system-ui">Sans (system)</option>
                    <option value="Georgia, serif">Serif</option>
                    <option value="ui-monospace, SFMono-Regular, Menlo, monospace">Monospace</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-2">
                  <button onClick={() => setIsPlacingText(true)} disabled={!draftText} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/50">Insert Text</button>
                  <button onClick={() => setSelectedTextId(null)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/50">Deselect</button>
                  {selectedTextId && (
                    <button onClick={() => setTextLayers((prev) => prev.filter((l) => l.id !== selectedTextId))} className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">Delete Selected</button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => { setCropRect(null); setIsCropping(true) }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/50">Crop</button>
                <button onClick={() => { setFilters({ brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0 }); setRotation(0); setTextLayers([]); setCropRect(null) }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/50">Reset</button>
                <button onClick={download} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">Export</button>
              </div>
            </div>
          </aside>

          <section className="relative rounded-xl border border-slate-200 bg-white/60 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="relative overflow-auto">
              <canvas ref={canvasRef} className="max-h-[70vh] w-full rounded-md bg-slate-50 dark:bg-slate-800" />
              <div
                ref={overlayRef}
                className="absolute inset-0"
                onMouseDown={onOverlayMouseDown}
                onMouseMove={onOverlayMouseMove}
                onMouseUp={onOverlayMouseUp}
              >
                {isCropping && cropRect && canvasRef.current && (() => {
                  const canvas = canvasRef.current
                  const rect = overlayRef.current?.getBoundingClientRect()
                  const scaleX = rect && canvas ? rect.width / canvas.width : 1
                  const scaleY = rect && canvas ? rect.height / canvas.height : 1
                  const left = cropRect.x * scaleX
                  const top = cropRect.y * scaleY
                  const width = cropRect.w * scaleX
                  const height = cropRect.h * scaleY
                  const handle = 12
                  return (
                    <div
                      className="absolute border-2 border-emerald-400 bg-emerald-200/10"
                      style={{ left, top, width, height }}
                      onMouseDown={(e) => {
                        // start move
                        const overlay = overlayRef.current
                        const canvas = canvasRef.current
                        if (!overlay || !canvas) return
                        const r = overlay.getBoundingClientRect()
                        const sx = (e.clientX - r.left) * (canvas.width / r.width)
                        const sy = (e.clientY - r.top) * (canvas.height / r.height)
                        setActiveHandle('move')
                        dragOffsetRef.current = { dx: sx - cropRect.x, dy: sy - cropRect.y }
                      }}
                    >
                      {/* Corner handles */}
                      <div
                        className="absolute -left-1.5 -top-1.5 h-3 w-3 cursor-nwse-resize rounded-sm bg-emerald-400"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('tl') }}
                        style={{ width: handle, height: handle }}
                      />
                      <div
                        className="absolute -right-1.5 -top-1.5 h-3 w-3 cursor-nesw-resize rounded-sm bg-emerald-400"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('tr') }}
                        style={{ width: handle, height: handle }}
                      />
                      <div
                        className="absolute -left-1.5 -bottom-1.5 h-3 w-3 cursor-nesw-resize rounded-sm bg-emerald-400"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('bl') }}
                        style={{ width: handle, height: handle }}
                      />
                      <div
                        className="absolute -right-1.5 -bottom-1.5 h-3 w-3 cursor-nwse-resize rounded-sm bg-emerald-400"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('br') }}
                        style={{ width: handle, height: handle }}
                      />
                      {/* Middle edge handles */}
                      <div
                        className="absolute cursor-ns-resize rounded-sm bg-emerald-400"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('tm') }}
                        style={{ width: handle, height: handle, left: '50%', top: -handle / 2, transform: 'translateX(-50%)' }}
                      />
                      <div
                        className="absolute cursor-ns-resize rounded-sm bg-emerald-400"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('bm') }}
                        style={{ width: handle, height: handle, left: '50%', top: height - handle / 2, transform: 'translateX(-50%)' }}
                      />
                      <div
                        className="absolute cursor-ew-resize rounded-sm bg-emerald-400"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('lm') }}
                        style={{ width: handle, height: handle, left: -handle / 2, top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <div
                        className="absolute cursor-ew-resize rounded-sm bg-emerald-400"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('rm') }}
                        style={{ width: handle, height: handle, left: width - handle / 2, top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  )
                })()}
              </div>
              {selectedTextId && canvasRef.current && (() => {
                const canvas = canvasRef.current
                const ctx = canvas.getContext('2d')!
                const layer = textLayers.find((l) => l.id === selectedTextId)
                if (!layer) return null
                ctx.font = `${layer.size}px ${layer.fontFamily}`
                const w = Math.max(10, ctx.measureText(layer.text || ' ').width)
                const h = layer.size
                const overlayRect = overlayRef.current?.getBoundingClientRect()
                if (!overlayRect) return null
                const scaleX = overlayRect.width / canvas.width
                const scaleY = overlayRect.height / canvas.height
                const left = layer.x * scaleX
                const top = layer.y * scaleY
                const width = w * scaleX
                const height = h * scaleY
                const handle = 12
                return (
                  <div className="pointer-events-none absolute" style={{ left, top, width, height, outline: '2px solid rgba(16,185,129,0.9)' }}>
                    <div className="absolute" style={{ right: -handle / 2, bottom: -handle / 2, width: handle, height: handle, background: 'rgb(16,185,129)', borderRadius: 2 }} />
                  </div>
                )
              })()}
            </div>
            {!image && <div className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">Upload an image to start editing</div>}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}


