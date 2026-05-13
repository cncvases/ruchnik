import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Pencil, Copy, Trash2, X, ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { formatMoney, formatDateShort } from '../lib/format'
import type { Record } from '../types'

interface Props {
  record: Record
  expanded: boolean
  onToggle: () => void
  onDelete: (id: string) => void
  onCopy: (record: Record) => void
  onStatusChange: (id: string, status: 'paid' | 'pending') => void
}

function PhotoGallery({ photos, startIndex, onClose }: { photos: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50 && current < photos.length - 1) setCurrent(c => c + 1)
    if (diff < -50 && current > 0) setCurrent(c => c - 1)
    touchStartX.current = null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white text-sm">{current + 1} / {photos.length}</span>
        <button onClick={onClose} className="text-white p-1"><X size={24} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <img src={photos[current]} alt="" className="max-w-full max-h-full object-contain" />
        {current > 0 && (
          <button onClick={() => setCurrent(c => c - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2">
            <ChevronLeft size={24} />
          </button>
        )}
        {current < photos.length - 1 && (
          <button onClick={() => setCurrent(c => c + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2">
            <ChevronRight size={24} />
          </button>
        )}
      </div>
      <div className="flex justify-center gap-1.5 py-3 flex-shrink-0">
        {photos.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  )
}

export function RecordCard({ record, expanded, onToggle, onDelete, onCopy, onStatusChange }: Props) {
  const navigate = useNavigate()
  const [gallery, setGallery] = useState<number | null>(null)
  const photos: string[] = record.photos ?? []

  const displayTitle = record.title || record.category?.name || (record.type === 'income' ? 'Дохід' : 'Витрата')

  return (
    <>
      {gallery !== null && (
        <PhotoGallery photos={photos} startIndex={gallery} onClose={() => setGallery(null)} />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Collapsed row */}
        <button className="w-full px-4 py-3 flex items-center gap-3 text-left" onClick={onToggle}>
          {photos.length > 0
            ? <img src={photos[0]} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            : <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${record.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
                {record.type === 'income' ? '↑' : '↓'}
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{displayTitle}</div>
            <div className="text-xs text-gray-400 truncate">{record.client?.name ?? record.description ?? ''}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <div className={`font-semibold text-sm ${record.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                {record.type === 'income' ? '+' : '−'}{formatMoney(Number(record.amount))}
              </div>
              {record.type === 'income' && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onStatusChange(record.id, record.status === 'paid' ? 'pending' : 'paid')
                  }}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    record.status === 'paid'
                      ? 'text-green-600 border-green-200 bg-green-50'
                      : 'text-orange-500 border-orange-200 bg-orange-50'
                  }`}
                >
                  {record.status === 'paid' ? 'Оплачено' : 'Очікує'}
                </button>
              )}
            </div>
            <ChevronDown size={16} className={`text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expanded */}
        {expanded && (
          <div className="border-t border-gray-50">
            <div className="flex">
              {/* Photo — left column, full height */}
              {photos.length > 0 && (
                <div className="relative flex-shrink-0 w-28">
                  <img
                    src={photos[0]}
                    alt=""
                    className="w-full h-full object-cover cursor-pointer"
                    style={{ minHeight: '140px' }}
                    onClick={() => setGallery(0)}
                  />
                  {photos.length > 1 && (
                    <button
                      onClick={() => setGallery(0)}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
                    >
                      <Images size={11} />
                      {photos.length} фото
                    </button>
                  )}
                </div>
              )}

              {/* Details — right column */}
              <div className="flex-1 min-w-0 px-3 py-2 flex flex-col gap-2 text-xs text-gray-500">
                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                  <div>
                    <div className="text-gray-400 mb-0.5">Сума</div>
                    <div className={`font-semibold ${record.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {record.type === 'income' ? '+' : '−'}{formatMoney(Number(record.amount))}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-0.5">Дата</div>
                    <div className="text-gray-800">{formatDateShort(record.date)}</div>
                  </div>
                  {record.category && (
                    <div>
                      <div className="text-gray-400 mb-0.5">Категорія</div>
                      <div className="text-gray-800 truncate">{record.category.name}</div>
                    </div>
                  )}
                  {record.client && (
                    <div>
                      <div className="text-gray-400 mb-0.5">Замовник</div>
                      <div className="text-gray-800 truncate">{record.client.name}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-400 mb-0.5">Оплата</div>
                    <div className="text-gray-800">{{ cash: 'Готівка', card: 'Картка', fop: 'ФОП' }[record.payment_method]}</div>
                  </div>
                  {record.dimensions && Object.keys(record.dimensions).length > 0 && (
                    <div>
                      <div className="text-gray-400 mb-0.5">Розміри</div>
                      <div className="text-gray-800">
                        {[record.dimensions.width, record.dimensions.height, record.dimensions.thickness].filter(Boolean).join(' × ')} см
                      </div>
                    </div>
                  )}
                  {record.description && (
                    <div className="col-span-2">
                      <div className="text-gray-400 mb-0.5">Опис</div>
                      <div className="text-gray-800">{record.description}</div>
                    </div>
                  )}
                  {record.record_workers && record.record_workers.length > 0 && (
                    <div className="col-span-2">
                      <div className="text-gray-400 mb-0.5">Виплачено</div>
                      <div className="text-purple-600 font-medium">
                        {formatMoney(record.record_workers.reduce((s, rw) => s + Number(rw.amount_paid), 0))}
                        <span className="text-gray-400 font-normal text-xs ml-1">
                          ({record.record_workers.map(rw => `${rw.worker?.name ?? '?'} ${formatMoney(Number(rw.amount_paid))}`).join(', ')})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 px-3 pb-3 pt-2 border-t border-gray-50">
              <button onClick={() => navigate(`/records/${record.id}/edit`)}
                className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-500 py-2 rounded-xl bg-blue-50">
                <Pencil size={13} /> Редагувати
              </button>
              <button onClick={() => onCopy(record)}
                className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600 py-2 rounded-xl bg-gray-100">
                <Copy size={13} /> Копіювати
              </button>
              <button onClick={() => onDelete(record.id)}
                className="flex-1 flex items-center justify-center gap-1 text-xs text-red-500 py-2 rounded-xl bg-red-50">
                <Trash2 size={13} /> Видалити
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
