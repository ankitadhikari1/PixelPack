/* Utility compressors for text, images, and PDFs.
   Keep code simple and commented for clarity. */

import pako from 'pako'
import { PDFDocument } from 'pdf-lib'

// -------------------- TEXT COMPRESSION --------------------
// Basic Huffman coding implementation for demonstration.
// For production, a proven library is recommended.

type HuffmanNode = {
  char?: string
  freq: number
  left?: HuffmanNode
  right?: HuffmanNode
}

function buildFrequencyMap(input: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const ch of input) map.set(ch, (map.get(ch) ?? 0) + 1)
  return map
}

function buildHuffmanTree(freqMap: Map<string, number>): HuffmanNode | null {
  const nodes: HuffmanNode[] = Array.from(freqMap.entries()).map(([char, freq]) => ({ char, freq }))
  if (nodes.length === 0) return null
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq)
    const left = nodes.shift()!
    const right = nodes.shift()!
    nodes.push({ freq: left.freq + right.freq, left, right })
  }
  return nodes[0]
}

function buildCodeMap(root: HuffmanNode | null): Map<string, string> {
  const map = new Map<string, string>()
  if (!root) return map
  const dfs = (node: HuffmanNode, path: string) => {
    if (node.char !== undefined) {
      map.set(node.char, path || '0')
      return
    }
    if (node.left) dfs(node.left, path + '0')
    if (node.right) dfs(node.right, path + '1')
  }
  dfs(root, '')
  return map
}

function huffmanEncode(input: string): Uint8Array {
  const freq = buildFrequencyMap(input)
  const tree = buildHuffmanTree(freq)
  const codes = buildCodeMap(tree)
  let bitString = ''
  for (const ch of input) bitString += codes.get(ch)
  // pack bits into bytes
  const byteLength = Math.ceil(bitString.length / 8)
  const out = new Uint8Array(byteLength)
  for (let i = 0; i < bitString.length; i++) {
    const byteIndex = i >> 3
    const bitIndex = 7 - (i & 7)
    if (bitString[i] === '1') out[byteIndex] |= 1 << bitIndex
  }
  return out
}

export async function compressText(input: string, algo: 'huffman' | 'deflate', targetPercent: number): Promise<Blob> {
  // targetPercent can be used to tweak strategy; for demo we apply simple trims
  const normalized = input
  // Deflate generally wins for arbitrary text
  if (algo === 'deflate') {
    // Level heuristic from target: higher target => stronger compression
    const level = Math.max(1, Math.min(9, Math.round((targetPercent / 100) * 9)))
    const deflated = pako.deflate(normalized, { level })
    return new Blob([deflated], { type: 'application/octet-stream' })
  }
  // Huffman demo encoder
  const encoded = huffmanEncode(normalized)
  return new Blob([encoded], { type: 'application/octet-stream' })
}

// -------------------- IMAGE COMPRESSION --------------------
// Re-encode via canvas. Quality maps from targetPercent (higher target => smaller file)
export async function compressImage(file: File, targetPercent: number): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Scale factor based on target (optional mild downscale)
    const scale = 1 - Math.min(0.5, targetPercent / 200) // up to 50% downscale at 100%
    canvas.width = Math.max(1, Math.floor(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.floor(img.naturalHeight * scale))
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const isPng = file.type.includes('png')
    const mime = isPng ? 'image/png' : 'image/jpeg'
    const quality = isPng ? undefined : Math.max(0.1, 1 - targetPercent / 100)

    const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), mime, quality))
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

// -------------------- PDF COMPRESSION --------------------
// Strategy: use pdf-lib to load, downsample embedded images by drawing them to canvas
// and replace them, then re-save. This is a simplified approach.
export async function compressPdf(file: File, targetPercent: number): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)

  // pdf-lib lacks direct image downsampling; we can re-embed images at lower quality
  // by reading page images via page.drawImage is not introspectable, so we re-render
  // pages to images is not trivial client-side. As a pragmatic approach, we resave
  // with object streams which often reduces size, and optionally strip metadata.

  // Set producer/creator minimal
  pdfDoc.setTitle(pdfDoc.getTitle() ?? '')
  pdfDoc.setAuthor(pdfDoc.getAuthor() ?? '')
  pdfDoc.setSubject('')
  pdfDoc.setProducer('Smart Compressor')
  pdfDoc.setCreator('Smart Compressor')

  // For a visible size impact, we can subset fonts and save with object streams.
  const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false })

  // Note: Real image downsampling inside PDFs on web requires heavier pipelines (pdf.js + canvas rerender).
  // To respect targetPercent more, we could fall back to recompress via rasterization for image-heavy PDFs.
  // For demo simplicity, we keep this step lightweight.

  return new Blob([bytes], { type: 'application/pdf' })
}
