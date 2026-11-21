import React, { useState, useEffect, useCallback } from 'react'
import { Download, CheckCircle, Wallet, RefreshCw } from 'lucide-react'
import { apiGet, apiPost } from '../../../lib/api'

const money = (n) => `$${Number(n || 0).toFixed(2)}`
const csvCell = (v) => {
  let s = String(v ?? '')
  // Block spreadsheet formula injection from user-supplied names/handles.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Weekly payroll for LifeSaver commissions + level bonuses. Owed = earned (up to the cutoff) - already paid.
export default function AdminPayouts() {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [busy,    setBusy]    = useState(false)
  const [done,    setDone]    = useState(null)
  const [confirm, setConfirm] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setError('')
    apiGet('admin_payout_report')
      .then(d => { setReport(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])
  useEffect(() => { load() }, [load])

  const payable = (report?.rows || []).filter(r => r.due > 0.004)

  function exportCsv() {
    const head = ['LifeSaver ID', 'Name', 'Email', 'Handle', 'Leads Purchased', 'Commissions', 'Level Bonuses', 'Already Paid', 'Amount Due', 'Through']
    const lines = [head.map(csvCell).join(',')]
    payable.forEach(r => lines.push([r.lsId, r.name, r.email, r.handle, r.leads, r.commissions.toFixed(2), r.bonuses.toFixed(2), r.paid.toFixed(2), r.due.toFixed(2), report.through].map(csvCell).join(',')))
    lines.push(['TOTAL', '', '', '', '', '', '', '', report.totalDue.toFixed(2), ''].map(csvCell).join(','))
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `lifesavers-payroll-${report.through.slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function markPaid() {
    setBusy(true); setError('')
    try {
      const batchId = `B${Date.now()}${Math.random().toString(36).slice(2, 7)}`
      const r = await apiPost('admin_mark_paid', { batchId, through: report.through, expectedTotal: report.totalDue })
      setDone(r)
      setConfirm(false)
      load()
    } catch (e) {
      setError(e.status === 409 ? 'The totals changed while you were reviewing. The report has been refreshed; review it and try again.' : e.message)
      setConfirm(false)
      load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-success" />
          <p className="text-sm font-bold">LifeSaver Payroll</p>
        </div>
        <button onClick={load} className="text-gray-500 hover:text-white" title="Refresh"><RefreshCw size={14} /></button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : !report ? (
        <p className="text-red-400 text-sm">{error || 'Could not load the report.'}</p>
      ) : (
        <>
          <div className="bg-bg rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Total due to {payable.length} LifeSaver{payable.length !== 1 ? 's' : ''}</p>
              <p className="text-2xl font-extrabold text-success">{money(report.totalDue)}</p>
            </div>
            <p className="text-xs text-gray-500 text-right">Earned through<br />{new Date(report.through).toLocaleString()}</p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}
          {done && <div className="bg-success/10 border border-success/30 text-success text-sm rounded-lg px-4 py-3">Marked {done.count} payout{done.count !== 1 ? 's' : ''} paid ({money(done.total)}).</div>}

          {payable.length === 0 ? (
            <p className="text-gray-500 text-sm">Nothing is due right now.</p>
          ) : (
            <div className="border border-gray-800 rounded-xl overflow-hidden">
              {payable.map((r, i) => (
                <div key={r.lsId} className={`flex items-center justify-between px-4 py-3 ${i < payable.length - 1 ? 'border-b border-gray-800' : ''}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.name || r.lsId} {r.handle && <span className="text-gray-500 font-normal">{r.handle}</span>}</p>
                    <p className="text-xs text-gray-500">
                      {r.leads} lead{r.leads !== 1 ? 's' : ''} {money(r.commissions)}
                      {r.bonuses > 0 && <> + bonus {money(r.bonuses)}</>}
                      {r.paid > 0 && <> - paid {money(r.paid)}</>}
                    </p>
                  </div>
                  <p className="font-bold text-success flex-shrink-0 ml-3">{money(r.due)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={exportCsv} disabled={payable.length === 0}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-700 text-gray-300 disabled:opacity-40 py-3 rounded-xl text-sm font-semibold hover:border-gray-500 transition-colors">
              <Download size={15} /> Download CSV
            </button>
            <button onClick={() => setConfirm(true)} disabled={payable.length === 0 || busy}
              className="flex-1 flex items-center justify-center gap-2 bg-success/20 border border-success/30 text-success disabled:opacity-40 py-3 rounded-xl text-sm font-semibold hover:bg-success/30 transition-colors">
              <CheckCircle size={15} /> Mark all paid
            </button>
          </div>
          <p className="text-xs text-gray-600">Pay people first (using the CSV), then mark them paid. Marking paid records the payout so it is not counted again next week.</p>
        </>
      )}

      {confirm && report && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <div className="bg-surface border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirm payouts sent</h2>
            <p className="text-gray-400 text-sm mb-5">
              This records {money(report.totalDue)} as paid to {payable.length} LifeSaver{payable.length !== 1 ? 's' : ''}. Only do this after the money has actually gone out.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="flex-1 border border-gray-700 text-gray-400 py-3 rounded-xl text-sm">Cancel</button>
              <button onClick={markPaid} disabled={busy} className="flex-1 bg-success text-black font-bold py-3 rounded-xl text-sm disabled:opacity-60">
                {busy ? 'Saving...' : 'Yes, mark paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
