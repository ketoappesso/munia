import { useEffect, useState } from 'react'
import api from '../lib/api'

type Device = { device_id: string, prod_name?: string }

export default function MySpace() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageId, setImageId] = useState<number | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [startAt, setStartAt] = useState<string>('')
  const [endAt, setEndAt] = useState<string>('')
  const phone = localStorage.getItem('phone') || ''

  useEffect(() => { (async () => {
    const { data } = await api.get('/api/devices')
    setDevices(data.items || [])
  })() }, [])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFile(f || null)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const upload = async () => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('user_phone', phone)
    const { data } = await api.post('/api/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    setImageId(data.id)
  }

  const create = async () => {
    if (!imageId || !startAt || selected.length === 0) return
    await api.post('/api/schedules', { image_id: imageId, start_at: startAt, end_at: endAt || null, targets: selected, user_phone: phone })
    alert('已创建派发计划')
    setImageId(null)
    setFile(null)
    setPreview(null)
  }

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.concat(id))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">我的空间</h2>
      <div className="text-sm text-gray-600">上传图片并选择时间段与设备，创建下发计划。</div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <input type="file" accept="image/*" onChange={onFile} />
          {preview && <img src={preview} className="max-h-48 rounded border" />}
          <button onClick={upload} disabled={!file} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">上传图片</button>
          {imageId && <div className="text-xs text-green-700">已上传，ID：{imageId}</div>}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">开始时间</label>
            <input type="datetime-local" className="border rounded p-2 w-full" value={startAt} onChange={(e)=>setStartAt(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">结束时间（可选）</label>
            <input type="datetime-local" className="border rounded p-2 w-full" value={endAt} onChange={(e)=>setEndAt(e.target.value)} />
          </div>
          <div>
            <div className="text-sm mb-1">选择设备</div>
            <div className="max-h-40 overflow-auto border rounded p-2 space-y-1">
              {devices.map(d => (
                <label key={d.device_id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selected.includes(d.device_id)} onChange={()=>toggle(d.device_id)} />
                  <span>{d.device_id}</span>
                  <span className="text-gray-500">{d.prod_name || ''}</span>
                </label>
              ))}
              {devices.length === 0 && <div className="text-gray-500 text-sm">暂无设备</div>}
            </div>
          </div>
          <button onClick={create} disabled={!imageId || !startAt || selected.length===0} className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50">创建计划</button>
        </div>
      </div>

      <div className="text-xs text-gray-500">注：当前为草案，后续权限绑定将改为真实登录用户。</div>
    </div>
  )
}

