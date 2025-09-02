import { Link } from 'react-router-dom'

export default function Logo({ size = 36, withLink = true }: { size?: number; withLink?: boolean }) {
  const symbol = (
    <div className="flex items-center gap-3">
      <div
        className="grid place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 shadow-sm"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" className="fill-white/90" />
          <rect x="13" y="3" width="8" height="8" rx="2" className="fill-white/70" />
          <rect x="3" y="13" width="8" height="8" rx="2" className="fill-white/70" />
          <rect x="13" y="13" width="8" height="8" rx="2" className="fill-white/90" />
        </svg>
      </div>
      <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">PixelPack</span>
    </div>
  )
  if (withLink) return <Link to="/" className="select-none">{symbol}</Link>
  return symbol
}


