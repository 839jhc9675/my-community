import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// 로그인이 필요한 페이지를 감싸는 컴포넌트
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="empty">불러오는 중...</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
