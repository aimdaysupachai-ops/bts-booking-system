'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface Station { station_id: string; station_name: string; line_name: string }
interface Card { card_id: string; balance: number; card_status: string }

export default function BookingPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [stations, setStations] = useState<Station[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [form, setForm] = useState({
    user_name: '', user_email: '', booking_datetime: '', trip_type: 'oneway',
    origin: '', destination: '', card_id: '',
  })
  const [fare, setFare] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) { router.push('/login'); return }
    setForm(f => ({ ...f, user_name: user.display_name, user_email: user.email }))
  }, [user, router])

  // Load stations + cards
  useEffect(() => {
    supabase.from('bts_stations').select('station_id,station_name,line_name')
      .eq('is_active', true).order('sort_order').then(({ data }) => {
        if (data) { setStations(data); setForm(f => ({ ...f, origin: data[0]?.station_id || '', destination: data[1]?.station_id || '' })) }
      })
    loadCards()
  }, [])

  const loadCards = async () => {
    const { data } = await supabase.from('bts_cards').select('*').eq('is_active', true).order('card_id')
    if (data) setCards(data)
  }

  // Calculate fare whenever origin/destination/trip_type changes
  const calcFare = useCallback(async (origin: string, dest: string, trip: string) => {
    if (!origin || !dest || origin === dest) { setFare(null); return }
    const { data } = await supabase.from('bts_fares')
      .select('fare').eq('origin_code', origin).eq('destination_code', dest)
      .eq('trip_type', 'oneway').eq('is_active', true).limit(1)
    if (data?.[0]) {
      const f = Number(data[0].fare) * (trip === 'round' ? 2 : 1)
      setFare(f)
      // Auto-select best card
      const avail = cards.filter(c => c.card_status === 'Available' && c.balance >= f)
      setForm(prev => ({ ...prev, card_id: avail[0]?.card_id || '' }))
    } else {
      setFare(null)
    }
  }, [cards])

  useEffect(() => {
    if (form.origin && form.destination) calcFare(form.origin, form.destination, form.trip_type)
  }, [form.origin, form.destination, form.trip_type, calcFare])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleBook = async () => {
    if (!user) return
    if (!form.user_name || !form.user_email || !form.booking_datetime) { setMsg({ text: 'กรุณากรอกข้อมูลให้ครบ', type: 'error' }); return }
    if (!form.origin || !form.destination || form.origin === form.destination) { setMsg({ text: 'กรุณาเลือกต้นทางและปลายทางที่ต่างกัน', type: 'error' }); return }
    if (fare === null || fare <= 0) { setMsg({ text: 'ไม่พบราคาค่าโดยสาร', type: 'error' }); return }
    if (!form.card_id) { setMsg({ text: 'ไม่มีบัตรว่างที่มียอดเพียงพอ', type: 'error' }); return }
    setBusy(true); setMsg(null)
    const { data, error } = await supabase.rpc('create_booking', {
      p_user_name: form.user_name,
      p_user_email: form.user_email,
      p_booking_datetime: new Date(form.booking_datetime).toISOString(),
      p_origin_code: form.origin,
      p_destination_code: form.destination,
      p_trip_type: form.trip_type,
      p_fare: fare,
      p_card_id: form.card_id,
      p_staff_id: user.staff_id,
    })
    setBusy(false)
    if (error) { setMsg({ text: 'เกิดข้อผิดพลาด: ' + error.message, type: 'error' }); return }
    setMsg({ text: `จองสำเร็จ! เลขที่จอง: ${data}`, type: 'success' })
    loadCards()
    setTimeout(() => router.push('/booking-list'), 1500)
  }

  const now = new Date(); now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
  const defaultDT = now.toISOString().slice(0, 16)
  const availCards = cards.filter(c => c.card_status === 'Available' && (fare === null || c.balance >= fare))

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-1">สร้างการจองใหม่</h1>
      <p className="text-sm text-gray-500 mb-6">จองบัตรโดยสาร BTS สำหรับพนักงาน</p>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {/* Name & Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">ชื่อผู้จอง</label>
            <input value={form.user_name} onChange={e => set('user_name', e.target.value)} placeholder="ชื่อ-นามสกุล"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input type="email" value={form.user_email} onChange={e => set('user_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>

        {/* Date & Trip type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">วันและเวลาเดินทาง</label>
            <input type="datetime-local" defaultValue={defaultDT} onChange={e => set('booking_datetime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">ประเภทการเดินทาง</label>
            <select value={form.trip_type} onChange={e => set('trip_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="oneway">เที่ยวเดียว</option>
              <option value="round">ไป-กลับ</option>
            </select>
          </div>
        </div>

        {/* Origin & Destination */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">สถานีต้นทาง</label>
            <select value={form.origin} onChange={e => set('origin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_id} - {s.station_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">สถานีปลายทาง</label>
            <select value={form.destination} onChange={e => set('destination', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_id} - {s.station_name}</option>)}
            </select>
          </div>
        </div>

        {/* Fare display */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">ค่าโดยสารโดยประมาณ</div>
              <div className="text-2xl font-semibold">{fare !== null ? `${fare} THB` : '–'}</div>
              {form.origin && form.destination && form.origin !== form.destination && (
                <div className="text-xs text-gray-400 mt-1">{form.origin} → {form.destination} / {form.trip_type === 'round' ? 'ไป-กลับ' : 'เที่ยวเดียว'}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">เลือกบัตร</div>
              {availCards.length > 0 ? (
                <select value={form.card_id} onChange={e => set('card_id', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                  {availCards.map(c => <option key={c.card_id} value={c.card_id}>{c.card_id} ({c.balance} THB)</option>)}
                </select>
              ) : (
                <span className="text-sm text-red-600">ไม่มีบัตรว่าง</span>
              )}
            </div>
          </div>
        </div>

        {/* Card status overview */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">สถานะบัตรทั้งหมด</div>
          <div className="flex gap-2 flex-wrap">
            {cards.map(c => (
              <span key={c.card_id} className={`text-xs px-3 py-1.5 rounded-lg border ${c.card_status === 'Available' ? 'bg-green-50 border-green-200 text-green-700' : c.card_status === 'Reserved' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                {c.card_id} · {c.balance} THB · {c.card_status}
              </span>
            ))}
          </div>
        </div>

        <button onClick={handleBook} disabled={busy || !availCards.length || fare === null}
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {busy ? 'กำลังดำเนินการ...' : 'ยืนยันการจอง'}
        </button>
      </div>
    </div>
  )
}
