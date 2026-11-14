import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, User, Lock, Eye, EyeOff, ShieldCheck, Gavel, CalendarClock, Receipt, MapPin, Users, Briefcase, IndianRupee } from 'lucide-react'
import { useAuth, DEMO_USER } from '../context/AuthContext.jsx'
import { OFFICE } from '../data/menu.js'
import './login.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Please enter username and password')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const res = login(form.username, form.password)
      setLoading(false)
      if (res.ok) navigate('/dashboard', { replace: true })
      else setError(res.message)
    }, 600)
  }

  const fillDemo = () => setForm({ username: DEMO_USER.username, password: DEMO_USER.password })

  return (
    <div className="login-page">
      {/* ===== Left: brand panel (full height) ===== */}
      <section className="login-brand">
        <span className="lb-circle c1" />
        <span className="lb-circle c2" />
        <span className="lb-circle c3" />

        <div className="brand-logo">
          <span className="brand-logo-icon"><Scale size={26} /></span>
          <div>
            <h1>LegalCase</h1>
            <p>Advocate Office Management</p>
          </div>
        </div>

        <div className="brand-hero">
          <h2>Manage every case, client &amp; rupee — <span>in one place.</span></h2>
          <div className="brand-office">
            <strong>{OFFICE.name}</strong>
            <small><MapPin size={13} /> {OFFICE.address}</small>
          </div>
        </div>

        <div className="brand-stats">
          <div className="bs-card bs-rose"><Users size={18} /><b>3,157</b><small>Clients</small></div>
          <div className="bs-card bs-teal"><Briefcase size={18} /><b>3,188</b><small>Cases</small></div>
          <div className="bs-card bs-amber"><IndianRupee size={18} /><b>2.27 Cr</b><small>Billing</small></div>
        </div>

        <ul className="brand-features">
          <li><span><Gavel size={16} /></span>Case master &amp; next hearing tracking</li>
          <li><span><Receipt size={16} /></span>Client billing, payments &amp; ledger</li>
          <li><span><CalendarClock size={16} /></span>Date-wise case lists &amp; reports</li>
        </ul>

        <p className="brand-foot">Powered by <strong>Netprogen.</strong></p>
      </section>

      {/* ===== Right: form panel ===== */}
      <section className="login-panel">
        <div className="mobile-logo">
          <span className="brand-logo-icon"><Scale size={22} /></span>
          <div><h1>LegalCase</h1><p>{OFFICE.name}</p></div>
        </div>

        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-card-head">
            <span className="shield"><ShieldCheck size={22} /></span>
            <h3>Welcome back</h3>
            <p>Sign in to continue to your dashboard</p>
          </div>

          <label className="field">
            <span className="field-label">Username</span>
            <span className="field-box">
              <User size={18} />
              <input name="username" value={form.username} onChange={onChange} placeholder="Enter username" autoComplete="username" autoFocus />
            </span>
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <span className="field-box">
              <Lock size={18} />
              <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={onChange} placeholder="Enter password" autoComplete="current-password" />
              <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Toggle password">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          <div className="login-row">
            <label className="remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember me</span>
            </label>
            <button type="button" className="link-btn" onClick={() => alert('Forgot password — coming soon')}>Forgot password?</button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>

          <button type="button" className="demo-hint" onClick={fillDemo}>
            Demo login: <b>admin</b> / <b>admin123</b> <span>(click to fill)</span>
          </button>
        </form>
        <p className="login-copy">© {new Date().getFullYear()} LegalCase · All rights reserved</p>
      </section>
    </div>
  )
}
