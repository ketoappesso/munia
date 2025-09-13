import { useEffect, useState } from 'react'
import api from '../lib/api'

type Schedule = {
  id: number
  user_phone: string
  image_id?: number
  payload_type: 'image' | 'face'
  start_at: string
  end_at?: string
  targets?: string[]
}

export default function Backoffice() {
  const [items, setItems] = useState<Schedule[]>([])
  const load = async () => {
    const { data } = await api.get('/api/schedules', { params: { all: '1' } })
    setItems(data.items || [])
  }
  useEffect(() => { load() }, [])

  const remove = async (id: number) => { await api.delete(`/api/schedules/${id}`); load() }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">我的后台（全局视角）</h2>
      <div className="text-sm text-gray-600">概览已创建的派发计划（所有用户）。未来将整合设备、人脸管理的完整页面。</div>

      <div className="border rounded">
        <div className="p-3 font-medium bg-gray-50">派发计划</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">ID</th>
              <th className="p-2">用户</th>
              <th className="p-2">类型</th>
              <th className="p-2">时间</th>
              <th className="p-2">设备</th>
              <th className="p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.id}</td>
                <td className="p-2">{s.user_phone}</td>
                <td className="p-2">{s.payload_type}</td>
                <td className="p-2">{s.start_at} {s.end_at ? `→ ${s.end_at}` : ''}</td>
                <td className="p-2">{(s.targets||[]).join(', ')}</td>
                <td className="p-2"><button onClick={()=>remove(s.id)} className="text-red-600">删除</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-2 text-gray-500" colSpan={6}>暂无计划</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">提示：本页为草案，最终将合并到 /munia app 前端，并仅在特殊账号显示。</div>
    </div>
  )
}

