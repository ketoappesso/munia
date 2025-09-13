import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  const phone = localStorage.getItem('phone')
  if (phone) (config.headers as any)['x-user-phone'] = phone
  return config
})

export default api
