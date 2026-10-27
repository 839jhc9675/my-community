import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-mark" aria-hidden="true">💪</span>헬스메이트
        </Link>
        <nav className="nav">
          <NavLink to="/" end>메이트 게시판</NavLink>
          <NavLink to="/workout">운동기록</NavLink>
        </nav>
        <div className="header-user">
          {user ? (
            <>
              <span className="hello"><strong>{profile?.name ?? '회원'}</strong>님</span>
              <button className="btn btn-ghost" onClick={handleSignOut}>로그아웃</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-yellow">로그인</Link>
          )}
        </div>
      </div>
      <div className="stripe" aria-hidden="true"><span /><span /><span /></div>
    </header>
  )
}
