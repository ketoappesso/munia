import { useEffect, useState } from 'react'
import api from '../lib/api'

type RecordItem = {
  id: number
  device_id: string
  person_id?: string
  record_time?: number
  record_type?: number
  record_pass?: number
  similarity?: number
}

export default function Records() {
  const [items, setItems] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const { data } = await api.get('/api/records?page=1&pageSize=50')
      setItems(data.items || [])
    } catch (e: any) {
      setErr(e?.response?.data?.error || '加载失败')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  if (loading) return <div>加载中...</div>
  if (err) return <div className="text-red-600">{err}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">通行记录</h2>
        <button onClick={load} className="px-3 py-2 bg-gray-200 rounded">刷新</button>
      </div>
      <table className="w-full bg-white rounded-xl shadow overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">设备ID</th>
            <th className="text-left p-2">人员ID</th>
            <th className="text-left p-2">时间</th>
            <th className="text-left p-2">结果</th>
            <th className="text-left p-2">相似度</th>
          </tr>
        </thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.id}</td>
              <td className="p-2 font-mono">{r.device_id}</td>
              <td className="p-2">{r.person_id || '-'}</td>
              <td className="p-2">{r.record_time ? new Date((r.record_time||0)*1000).toLocaleString() : '-'}</td>
              <td className="p-2">{r.record_pass === 1 ? '通过' : r.record_pass === 0 ? '拒绝' : '-'}</td>
              <td className="p-2">{r.similarity ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
