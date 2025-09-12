import { useEffect, useState } from 'react'
import api from '../lib/api'

type Device = {
  device_id: string
  prod_type?: string
  prod_name?: string
  last_seen_ts?: number
  online: boolean
}

export default function Devices() {
  const [items, setItems] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const { data } = await api.get('/api/devices')
      setItems(data.items || [])
    } catch (e: any) {
      setErr(e?.response?.data?.error || '加载失败')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [])

  const openDoor = async (id: string) => {
    await api.post(`/api/devices/${id}/open`, {})
    alert('已触发远程开门')
  }
  const relayOut = async (id: string) => {
    await api.post(`/api/devices/${id}/relay`, { relayIdx: 0, delay: 3 })
    alert('已触发继电器')
  }

  if (loading) return <div>加载中...</div>
  if (err) return <div className="text-red-600">{err}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">设备列表</h2>
        <button onClick={load} className="px-3 py-2 bg-gray-200 rounded">刷新</button>
      </div>
      <table className="w-full bg-white rounded-xl shadow overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">设备ID</th>
            <th className="text-left p-2">型号</th>
            <th className="text-left p-2">名称</th>
            <th className="text-left p-2">状态</th>
            <th className="text-left p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map(d => (
            <tr key={d.device_id} className="border-t">
              <td className="p-2 font-mono">{d.device_id}</td>
              <td className="p-2">{d.prod_type || '-'}</td>
              <td className="p-2">{d.prod_name || '-'}</td>
              <td className="p-2">
                <span className={"px-2 py-1 rounded text-white " + (d.online ? "bg-green-600" : "bg-red-600")}>
                  {d.online ? '在线' : '离线'}
                </span>
              </td>
              <td className="p-2 flex gap-2">
                <button onClick={()=>openDoor(d.device_id)} className="px-3 py-1 bg-blue-600 text-white rounded">远程开门</button>
                <button onClick={()=>relayOut(d.device_id)} className="px-3 py-1 bg-gray-700 text-white rounded">继电器</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
