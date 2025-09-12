import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'

type Person = {
  phone: string
  person_name: string
  picture_url?: string
  picture_file?: string
  ic_card_id?: string
  idcard_no?: string
  member_level?: string
  member_expiry?: string
  is_ape_lord?: boolean
}

export default function Persons() {
  const [items, setItems] = useState<Person[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [fetchingMembers, setFetchingMembers] = useState(false)
  const [syncingDevices, setSyncingDevices] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const { data } = await api.get('/api/persons')
      setItems(data.items || [])
    } catch (e: any) {
      setErr(e?.response?.data?.error || '加载失败')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => { load() }, [])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }
      setSelectedPhoto(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const add = async () => {
    if (!phone || !name) return alert('请输入电话号码和姓名')
    
    // Validate phone format
    const phoneRegex = /^[0-9]{10,15}$/
    if (!phoneRegex.test(phone)) {
      return alert('请输入有效的电话号码（10-15位数字）')
    }
    
    try {
      const formData = new FormData()
      formData.append('phone', phone)
      formData.append('person_name', name)
      
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto)
      }
      
      await api.post('/api/persons', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Reset form
      setPhone('')
      setName('')
      setSelectedPhoto(null)
      setPhotoPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      load()
    } catch (e: any) {
      alert(e?.response?.data?.error || '添加失败')
    }
  }
  
  const remove = async (phone: string) => {
    if (!confirm('确定要删除该人员吗？')) return
    try {
      await api.delete('/api/persons/' + encodeURIComponent(phone))
      load()
    } catch (e: any) {
      alert(e?.response?.data?.error || '删除失败')
    }
  }

  const fetchMemberInfo = async () => {
    if (items.length === 0) {
      alert('暂无人员数据')
      return
    }
    
    setFetchingMembers(true)
    try {
      const updatedItems = await Promise.all(
        items.map(async (person) => {
          try {
            const { data } = await api.post('/api/persons/fetch-member', {
              phone: person.phone
            })
            return {
              ...person,
              member_level: data.level,
              member_expiry: data.expiryDate,
              is_ape_lord: data.isApeLord
            }
          } catch (e) {
            console.error(`Failed to fetch member info for ${person.phone}:`, e)
            return person
          }
        })
      )
      setItems(updatedItems)
      alert('会员信息拉取成功')
    } catch (e: any) {
      alert('拉取会员信息失败: ' + (e?.response?.data?.error || e.message))
    } finally {
      setFetchingMembers(false)
    }
  }

  const syncToDevices = async () => {
    if (items.length === 0) {
      alert('暂无人员数据')
      return
    }
    
    if (!confirm('确定要将所有人员信息下发到全部设备吗？')) return
    
    setSyncingDevices(true)
    try {
      const { data } = await api.post('/api/persons/sync-devices', {
        persons: items
      })
      alert(`成功下发到 ${data.deviceCount} 个设备`)
    } catch (e: any) {
      alert('下发设备失败: ' + (e?.response?.data?.error || e.message))
    } finally {
      setSyncingDevices(false)
    }
  }

  if (loading) return <div className="p-4">加载中...</div>
  if (err) return <div className="p-4 text-red-600">{err}</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">人员管理</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchMemberInfo}
            disabled={fetchingMembers}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {fetchingMembers ? '拉取中...' : '拉取会员信息'}
          </button>
          <button
            onClick={syncToDevices}
            disabled={syncingDevices || items.length === 0 || !items.some(p => p.member_level)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {syncingDevices ? '下发中...' : '下发全部设备'}
          </button>
        </div>
      </div>
      
      {/* Add Person Form */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">添加人员</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input 
              className="border rounded p-2 flex-1" 
              placeholder="电话号码（10-15位数字）" 
              value={phone} 
              onChange={e=>setPhone(e.target.value)}
              maxLength={15}
            />
            <input 
              className="border rounded p-2 flex-1" 
              placeholder="姓名" 
              value={name} 
              onChange={e=>setName(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上传人员照片（可选）
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            
            {photoPreview && (
              <div className="w-20 h-20 border rounded overflow-hidden">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          
          <button 
            onClick={add} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            添加人员
          </button>
        </div>
      </div>

      {/* Persons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">照片</th>
              <th className="text-left p-3">电话号码</th>
              <th className="text-left p-3">姓名</th>
              <th className="text-left p-3">会员级别</th>
              <th className="text-left p-3">到期时间</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  暂无人员数据
                </td>
              </tr>
            ) : (
              items.map(p => (
                <tr key={p.phone} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {p.picture_url ? (
                      <img 
                        src={`http://localhost:3001${p.picture_url}`}
                        alt={p.person_name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjIwOTEgMjAgMjQgMTguMjA5MSAyNCAxNkMyNCAxMy43OTA5IDIyLjIwOTEgMTIgMjAgMTJDMTcuNzkwOSAxMiAxNiAxMy43OTA5IDE2IDE2QzE2IDE4LjIwOTEgMTcuNzkwOSAyMCAyMCAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAxOS44IDI0QzE1LjE4MTcgMjQgMTEuNiAyNi42ODYzIDExLjYgMzBIMjhWMzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg=='
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-mono">{p.phone}</td>
                  <td className="p-3">{p.person_name}</td>
                  <td className="p-3">
                    {p.member_level ? (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        p.is_ape_lord ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {p.member_level}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {p.member_expiry ? (
                      <span className="text-sm">
                        {new Date(p.member_expiry).toLocaleDateString('zh-CN')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={()=>remove(p.phone)} 
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}