import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, Download, FileText } from 'lucide-react'
import { apiGet } from '../../../lib/api'

const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(Number(n || 0)).toFixed(2)}`
const PERIODS = [['thisWeek', 'This week'], ['lastWeek', 'Last week'], ['thisMonth', 'This month'], ['lastMonth', 'Last month'], ['ytd', 'Year to date']]
const csvCell = (v) => {
  let s = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Company finance: gross -> corrected gross -> LSE net income, by period, plus refunds to issue and 1099 tracking.
export default function AdminFinance() {
  const thisYear = new Date().getFullYear()
  const [year,    setYear]    = useState(thisYear)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [period,  setPeriod]  = useState('thisWeek')
  const [trend,   setTrend]   = useState('weekly')

  const load = useCallback(() => {
    setLoading(true); setError('')
    apiGet('admin_finance', { year: String(year) })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [year])
  useEffect(() => { load() }, [load])

  const p = data?.periods?.[period]
  const rows = trend === 'weekly' ? (data?.weekly || []).slice().reverse() : (data?.monthly || []).slice().reverse()

  function export1099() {
    const head = ['LifeSaver ID', 'Name', 'Email', 'Handle', `Paid in ${data.tax1099.year}`, '1099-NEC needed']
    const lines = [head.map(csvCell).join(',')]
    data.tax1099.rows.forEach(r => lines.push([r.lsId, r.name, r.email, r.handle, r.paid.toFixed(2), r.needs1099 ? 'Yes' : 'No'].map(csvCell).join(',')))
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `lifesavers-1099-${data.tax1099.year}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  if (loading && !data) return <div className="bg-surface border border-gray-800 rounded-xl p-5 text-gray-500 text-sm">Loading finance...</div>
  if (!data) return <div className="bg-surface border border-gray-800 rounded-xl p-5 text-red-400 text-sm">{error || 'Could not load finance data.'}</div>

  const line = (label, value, { minus, strong, tone } = {}) => (
    <div className={`flex items-center justify-between py-2 ${strong ? 'border-t border-gray-700 mt-1 pt-3' : ''}`}>
      <span className={`text-sm ${strong ? 'font-bold' : 'text-gray-400'}`}>{label}</span>
      <span className={`tabular-nums ${strong ? 'font-extrabold text-base' : 'font-semibold text-sm'} ${tone || ''}`}>{minus && value > 0 ? `-${money(value)}` : money(value)}</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Period picker */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PERIODS.map(([k, label]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${period === k ? 'bg-primary text-white' : 'bg-surface border border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={load} className="text-gray-500 hover:text-white flex-shrink-0" title="Refresh"><RefreshCw size={14} /></button>
      </div>

      {/* Waterfall: gross -> corrected gross -> LSE net */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 mb-1">{p.label}: {new Date(p.start).toLocaleDateString()} to {new Date(new Date(p.end).getTime() - 1).toLocaleDateString()}</p>
        <p className="text-gray-400 text-xs">Corrected gross income</p>
        <p className="text-3xl font-extrabold tabular-nums mb-3">{money(p.correctedGross)}</p>
        {line('Gross income (agents paid)', p.gross)}
        {line('Refunds', p.refunds, { minus: true })}
        {line('Stripe processing fees', p.stripeFees, { minus: true })}
        {line('Corrected gross income', p.correctedGross, { strong: true })}
        {line('LifeSaver commissions', p.commissions, { minus: true })}
        {line('Level bonuses', p.bonuses, { minus: true })}
        {line('LSE net income', p.lseNet, { strong: true, tone: p.lseNet < 0 ? 'text-red-400' : 'text-success' })}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            ['LSE service fees', money(p.lseFees)],
            ['Payouts sent', money(p.payoutsPaid)],
            ['Paid leads', p.paidLeads],
            ['Free (1-star) unlocks', p.freeUnlocks],
            ['Referrals submitted', p.leadsSubmitted],
          ].map(([k, v]) => (
            <div key={k} className="bg-bg rounded-lg px-3 py-2.5">
              <p className="text-gray-500 text-xs">{k}</p>
              <p className="font-bold tabular-nums mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Things that need action */}
      {(data.refundsPending.length > 0 || data.payroll.totalDue > 0) && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-warning"><AlertTriangle size={15} /><p className="text-sm font-bold">Needs action</p></div>
          {data.payroll.totalDue > 0 && <p className="text-sm text-gray-300">Payroll: {money(data.payroll.totalDue)} owed to {data.payroll.people} LifeSaver{data.payroll.people !== 1 ? 's' : ''} (see LifeSaver Payroll below).</p>}
          {data.refundsPending.map(r => (
            <p key={r.leadId + r.date} className="text-sm text-gray-300">Refund {money(r.amount)} to {r.agentEmail} for lead {r.leadId} ({r.reason === 'ALREADY_PURCHASED' ? 'lead was already sold' : 'wrong amount paid'}). Issue it in Stripe; it records here automatically.</p>
          ))}
        </div>
      )}

      {/* Trend */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">Trend</p>
          <div className="flex gap-1 bg-bg rounded-lg p-1">
            {[['weekly', 'Weekly'], ['monthly', 'Monthly']].map(([k, l]) => (
              <button key={k} onClick={() => setTrend(k)} className={`px-3 py-1 rounded-md text-xs font-semibold ${trend === k ? 'bg-primary text-white' : 'text-gray-400'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead><tr className="text-gray-500 text-xs text-right">
              <th className="text-left font-medium pb-2">{trend === 'weekly' ? 'Week (Sun-Sat)' : 'Month'}</th>
              <th className="font-medium pb-2">Gross</th><th className="font-medium pb-2">Corrected</th><th className="font-medium pb-2">LSE net</th><th className="font-medium pb-2">Leads</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.start} className="border-t border-gray-800 text-right">
                  <td className="text-left py-2">{r.label}</td>
                  <td>{money(r.gross)}</td><td>{money(r.correctedGross)}</td>
                  <td className={r.lseNet < 0 ? 'text-red-400' : ''}>{money(r.lseNet)}</td><td>{r.paidLeads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1099 tracking */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /><p className="text-sm font-bold">1099-NEC tracking</p></div>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-bg border border-gray-700 text-white rounded-lg px-2 py-1 text-xs">
            {[thisYear, thisYear - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-500">What each LifeSaver was actually paid in {data.tax1099.year}. Anyone paid ${data.tax1099.threshold} or more needs a 1099-NEC. Confirm details with your accountant.</p>
        {data.tax1099.rows.length === 0 ? (
          <p className="text-gray-500 text-sm">No payouts recorded for {data.tax1099.year}.</p>
        ) : (
          <div className="border border-gray-800 rounded-xl overflow-hidden">
            {data.tax1099.rows.map((r, i) => (
              <div key={r.lsId} className={`flex items-center justify-between px-4 py-3 ${i < data.tax1099.rows.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{r.name || r.lsId} <span className="text-gray-500 font-normal">{r.handle}</span></p>
                  {r.needs1099 && <span className="text-xs font-bold text-primary">1099 required</span>}
                  {r.approaching && <span className="text-xs font-bold text-warning">Approaching ${data.tax1099.threshold}</span>}
                </div>
                <p className="font-bold tabular-nums ml-3">{money(r.paid)}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={export1099} disabled={!data.tax1099.rows.length}
          className="flex items-center justify-center gap-2 border border-gray-700 text-gray-300 disabled:opacity-40 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-500">
          <Download size={14} /> Download {data.tax1099.year} 1099 list (CSV)
        </button>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">
        Gross income = what agents paid. Corrected gross = gross minus refunds and Stripe fees. LSE net income = corrected gross minus LifeSaver commissions and level bonuses.
        A charge waiting to be refunded counts in gross until the refund is issued. Weeks run Sunday to Saturday.
      </p>
    </div>
  )
}
