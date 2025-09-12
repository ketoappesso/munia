import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Login() {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation() as any

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    try {
      const { data } = await api.post('/api/login', { password })
      localStorage.setItem('token', data.token)
      const to = location.state?.from?.pathname || '/'
      navigate(to, { replace: true })
    } catch (e: any) {
      setErr(e?.response?.data?.error || '登录失败')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded-xl shadow w-96">
        <h2 className="text-xl font-bold mb-4">管理员登录</h2>
        <input
          type="password"
          className="border rounded w-full p-2 mb-3"
          placeholder="管理员密码"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />
        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:opacity-90">登录</button>
      </form>
    </div>
  )
}
