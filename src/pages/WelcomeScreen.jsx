import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Scale, Clock, Calendar, ArrowLeft, Users, Briefcase,
  ShieldCheck, MapPin, Phone, CheckCircle2
} from 'lucide-react'
import { OFFICE } from '../data/menu.js'
import { getCases, getWaitingList, onStorageUpdate } from '../services/storageService.js'
import './management.css'

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [waitingList, setWaitingList] = useState(() => getWaitingList())
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
      setWaitingList(getWaitingList())
    })
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayCases = cases.filter((c) => c.nextDate === todayStr)
  const waitingClients = waitingList.filter((w) => w.status === 'Waiting')

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#ffffff', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f59e0b', display: 'grid', placeItems: 'center', color: '#0f172a' }}>
              <Scale size={28} strokeWidth={2.4} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '0.5px' }}>
                {OFFICE.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px', marginTop: '3px' }}>
                <MapPin size={13} color="#f59e0b" />
                <span>{OFFICE.address}</span>
                <span>·</span>
                <Phone size={13} color="#f59e0b" />
                <span>{OFFICE.phone}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'monospace', color: '#fbbf24' }}>
              {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <div style={{ margin: '28px 0', textAlign: 'center' }}>
          <span style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Advocate Chambers Client Reception
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '12px 0 6px', color: '#ffffff' }}>
            Welcome to Chambers
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Please wait comfortably while your consultation slot is prepared. Your legal representation is handled with the utmost professional diligence.
          </p>
        </div>

        {/* Two Live Monitoring Boards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '20px' }}>
          {/* Board 1: Today's Listed Hearings */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Today's Court Hearings</h3>
              </div>
              <span style={{ background: '#2563eb', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                {todayCases.length} Listed
              </span>
            </div>

            {todayCases.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No court hearings listed on today's cause list.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {todayCases.map((c) => (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #60a5fa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{c.caseNumber}</strong>
                      <span style={{ fontSize: '11px', color: '#93c5fd' }}>{c.id}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '2px' }}>{c.clientName}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{c.courtName} · {c.purpose}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Board 2: Waiting Queue */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#34d399" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Consultation Waiting Queue</h3>
              </div>
              <span style={{ background: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                {waitingClients.length} In Chamber
              </span>
            </div>

            {waitingClients.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No clients waiting in chamber queue.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {waitingClients.map((w, i) => (
                  <div key={w.id} style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #34d399', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{i + 1}. {w.clientName}</strong>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{w.purpose}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700', background: 'rgba(52, 211, 153, 0.15)', padding: '3px 8px', borderRadius: '4px' }}>
                      {w.timeSlot}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <ArrowLeft size={14} /> Back to Advocate Console
        </button>
        <span style={{ fontSize: '12px', color: '#64748b' }}>LegalCase Suite · Digital Reception Mode</span>
      </div>
    </div>
  )
}
