'use client'

import { useState } from 'react'
import { calculateLoanInterest, formatCurrency } from '@/lib/calculations'
import { Calculator } from 'lucide-react'

export default function LoanCalculatorView() {
  const [form, setForm] = useState({
    principal: '',
    monthly_rate: '2',
    borrow_date: '',
    settlement_date: new Date().toISOString().split('T')[0],
  })
  const [result, setResult] = useState<ReturnType<typeof calculateLoanInterest> | null>(null)

  const handleCalculate = () => {
    if (!form.principal || !form.borrow_date) return
    const calc = calculateLoanInterest(
      parseFloat(form.principal),
      parseFloat(form.monthly_rate),
      new Date(form.borrow_date),
      new Date(form.settlement_date)
    )
    setResult(calc)
  }

  return (
    <div className="card border border-brand-200">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-brand-600" />
        <h2 className="font-display text-lg font-semibold text-earth-800">Interest Calculator</h2>
        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Calendar Year Compounding</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="label">Principal (₹)</label>
          <input type="number" className="input-field" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} placeholder="10000" />
        </div>
        <div>
          <label className="label">Monthly Rate (%)</label>
          <input type="number" className="input-field" value={form.monthly_rate} onChange={e => setForm({ ...form, monthly_rate: e.target.value })} step="0.1" />
        </div>
        <div>
          <label className="label">Borrow Date</label>
          <input type="date" className="input-field" value={form.borrow_date} onChange={e => setForm({ ...form, borrow_date: e.target.value })} />
        </div>
        <div>
          <label className="label">Settlement Date</label>
          <input type="date" className="input-field" value={form.settlement_date} onChange={e => setForm({ ...form, settlement_date: e.target.value })} />
        </div>
      </div>

      <button onClick={handleCalculate} className="btn-primary">Calculate Interest</button>

      {result && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-xl p-4 text-center border border-brand-100">
              <p className="text-xs text-earth-500 font-medium">Principal</p>
              <p className="font-display text-xl font-bold text-earth-900 mt-1">{formatCurrency(result.principal)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
              <p className="text-xs text-earth-500 font-medium">Total Interest</p>
              <p className="font-display text-xl font-bold text-orange-700 mt-1">{formatCurrency(result.totalInterest)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <p className="text-xs text-earth-500 font-medium">Total Due</p>
              <p className="font-display text-xl font-bold text-green-800 mt-1">{formatCurrency(result.totalDue)}</p>
            </div>
          </div>

          {/* Yearly breakdown */}
          <div className="overflow-hidden rounded-xl border border-brand-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 border-b border-brand-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Year</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Opening</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Months</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Interest</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Closing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {result.breakdown.map(row => (
                  <tr key={row.year}>
                    <td className="px-4 py-2.5 font-semibold text-earth-700">{row.year}</td>
                    <td className="px-4 py-2.5 text-right text-earth-600">{formatCurrency(row.openingBalance)}</td>
                    <td className="px-4 py-2.5 text-right text-earth-500">{row.months.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-orange-600">{formatCurrency(row.interest)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-earth-900">{formatCurrency(row.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
