import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('phone')
    navigate('/login')
  }
  const linkCls = ({ isActive }: any) => `px-3 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`
  const phone = localStorage.getItem('phone')
  const isSuper = phone === '18874748888'

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold mb-4">Facegate</h1>
        <nav className="flex flex-col gap-2">
          <NavLink to="/devices" className={linkCls}>设备</NavLink>
          <NavLink to="/records" className={linkCls}>记录</NavLink>
          <NavLink to="/persons" className={linkCls}>人员</NavLink>
          {isSuper && <NavLink to="/backoffice" className={linkCls}>我的后台</NavLink>}
          <NavLink to="/my-space" className={linkCls}>我的空间</NavLink>
        </nav>
        <div className="mt-4 text-xs text-gray-500">{phone ? `当前手机号：${phone}` : '未设置手机号'}</div>
        <button onClick={logout} className="mt-3 text-sm text-red-600">退出登录</button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
