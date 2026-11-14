import { useEffect, useState } from 'react'
import { ArrowUpRight, IndianRupee } from 'lucide-react'
import { formatIN } from '../data/menu.js'

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

export default function StatCard({ label, value, icon: Icon, theme, money, trend, onClick, delay = 0 }) {
  const n = useCountUp(value)
  const isPositive = trend && (trend.startsWith('+') || trend.includes('%'))

  return (
    <button
      type="button"
      className={`stat-card t-${theme}`}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      title={`View details for ${label}`}
    >
      <div className="stat-card-top">
        <span className="stat-icon-box">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span className="stat-arrow-wrap">
          <ArrowUpRight size={13} className="stat-arrow" />
        </span>
      </div>

      <div className="stat-card-mid">
        <span className="stat-label">{label}</span>
        <div className="stat-value">
          {money && <IndianRupee size={16} className="stat-rupee" strokeWidth={2.4} />}
          <span>{formatIN(n)}</span>
        </div>
      </div>

      {trend && (
        <div className="stat-card-foot">
          <span className={`stat-trend-tag ${isPositive ? 'trend-up' : 'trend-subtle'}`}>
            {trend}
          </span>
        </div>
      )}
    </button>
  )
}
