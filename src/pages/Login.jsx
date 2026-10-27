import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      setError(
        error.message.includes('Email not confirmed')
          ? '이메일 인증이 아직 완료되지 않았어요. 메일함을 확인해 주세요.'
          : '이메일 또는 비밀번호가 올바르지 않습니다.',
      )
      return
    }
    navigate(location.state?.from ?? '/', { replace: true })
  }

  return (
    <section className="auth-card">
      <div className="auth-badge">HEALTH MATE</div>
      <h1 className="auth-title">헬스메이트 로그인</h1>
      <p className="auth-sub">함께 땀 흘릴 운동 메이트를 찾아보세요!</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required autoComplete="email" />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required autoComplete="current-password" />
        </label>
        {error && <p className="msg msg-error">{error}</p>}
        <button type="submit" className="btn btn-blue btn-block" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="auth-footer">
        아직 헬스메이트 회원이 아니신가요? <Link to="/signup">회원가입하기</Link>
      </p>
    </section>
  )
}
