import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/timeline')
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">비밀번호</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="mt-2 w-full rounded bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          로그인
        </button>
      </div>
    </div>
  )
}
