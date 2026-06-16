import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { profile } = useAuth()

  useEffect(() => {
    if (profile) navigate('/timeline')
  }, [profile])

  async function handleLogin() {
    setError('')
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-80 rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">협업툴</h1>
        <p className="mb-6 text-sm text-gray-400">계정 정보는 관리자에게 문의하세요.</p>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">아이디 (이메일)</label>
          <input
            type="text"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">비밀번호</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading}
          className="mt-2 w-full rounded bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </div>
    </div>
  )
}
