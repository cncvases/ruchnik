import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useRecords } from '../hooks/useRecords'
import { PageHeader } from '../components/PageHeader'
import { formatMoney, toInputDate } from '../lib/format'

type Period = 'week' | 'month' | 'year'

function getPeriodDates(period: Period) {
  const now = new Date()
  const today = toInputDate(now)
  if (period === 'week') {
    const d = new Date(now); d.setDate(d.getDate() - 6)
    return { from: toInputDate(d), to: today }
  }
  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: toInputDate(d), to: today }
  }
  const d = new Date(now.getFullYear(), 0, 1)
  return { from: toInputDate(d), to: today }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export function StatisticsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const { from, to } = getPeriodDates(period)
  const { records } = useRecords({ dateFrom: from, dateTo: to })

  const totalIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
  const profit = totalIncome - totalExpense

  // Group by category for pie
  const incomeByCategory = Object.values(
    records.filter(r => r.type === 'income').reduce<Record<string, { name: string; value: number }>>((acc, r) => {
      const key = r.category_id ?? 'other'
      const name = r.category?.name ?? 'Інше'
      acc[key] = { name, value: (acc[key]?.value ?? 0) + Number(r.amount) }
      return acc
    }, {})
  )

  const expenseByCategory = Object.values(
    records.filter(r => r.type === 'expense').reduce<Record<string, { name: string; value: number }>>((acc, r) => {
      const key = r.category_id ?? 'other'
      const name = r.category?.name ?? 'Інше'
      acc[key] = { name, value: (acc[key]?.value ?? 0) + Number(r.amount) }
      return acc
    }, {})
  )

  // Group by day/week for bar chart
  const barData = (() => {
    const map: Record<string, { date: string; income: number; expense: number }> = {}
    records.forEach(r => {
      const key = period === 'year' ? r.date.slice(0, 7) : r.date
      if (!map[key]) map[key] = { date: key, income: 0, expense: 0 }
      map[key][r.type as 'income' | 'expense'] += Number(r.amount)
    })
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  })()

  const periods: [Period, string][] = [['week', 'Тиждень'], ['month', 'Місяць'], ['year', 'Рік']]

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28">
      <PageHeader title="Статистика" />

      {/* Period */}
      <div className="px-4 py-2 flex gap-1.5 border-b border-gray-100">
        {periods.map(([p, l]) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-2xl p-3 text-center">
            <div className="text-xs text-green-600 font-medium mb-1">Дохід</div>
            <div className="text-green-700 font-bold text-sm">{formatMoney(totalIncome)}</div>
          </div>
          <div className="bg-red-50 rounded-2xl p-3 text-center">
            <div className="text-xs text-red-500 font-medium mb-1">Витрата</div>
            <div className="text-red-600 font-bold text-sm">{formatMoney(totalExpense)}</div>
          </div>
          <div className={`rounded-2xl p-3 text-center ${profit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className={`text-xs font-medium mb-1 ${profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>Прибуток</div>
            <div className={`font-bold text-sm ${profit >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{formatMoney(profit)}</div>
          </div>
        </div>

        {/* Bar chart */}
        {barData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Доходи та витрати</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={12} barGap={2}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={30} />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Дохід" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Витрата" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Income pie */}
        {incomeByCategory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Доходи по категоріях</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={incomeByCategory} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                    {incomeByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 flex-1">
                {incomeByCategory.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                    <span className="text-xs font-medium text-gray-800">{formatMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expense pie */}
        {expenseByCategory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Витрати по категоріях</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                    {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 flex-1">
                {expenseByCategory.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                    <span className="text-xs font-medium text-gray-800">{formatMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {records.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">
            <p className="text-4xl mb-3">📊</p>
            <p>Немає даних для відображення</p>
          </div>
        )}
      </div>
    </div>
  )
}
