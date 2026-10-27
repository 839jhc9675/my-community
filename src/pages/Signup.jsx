import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '', phone: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 해요.')
    if (form.password !== form.passwordConfirm) return setError('비밀번호가 서로 일치하지 않아요.')

    setSubmitting(true)
    // 이름·전화번호는 메타데이터로 전달 → DB 트리거가 users 테이블에 저장
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, phone: form.phone },
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
    setSubmitting(false)

    if (error) {
      setError(error.message.includes('already registered') ? '이미 가입된 이메일이에요.' : error.message)
      return
    }
    if (data.session) {
      navigate('/', { replace: true })
    } else {
      setNotice('가입 완료! 입력하신 이메일로 인증 메일을 보냈어요. 인증 후 로그인해 주세요.')
    }
  }

  if (notice) {
    return (
      <section className="auth-card">
        <div className="auth-badge">WELCOME</div>
        <h1 className="auth-title">환영합니다! 🎉</h1>
        <p className="msg msg-ok">{notice}</p>
        <Link to="/login" className="btn btn-blue btn-block">로그인하러 가기</Link>
      </section>
    )
  }

  return (
    <section className="auth-card">
      <div className="auth-badge">JOIN US</div>
      <h1 className="auth-title">헬스메이트 회원가입</h1>
      <p className="auth-sub">가입하고 오늘부터 같이 운동해요!</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          이름
          <input value={form.name} onChange={update('name')} placeholder="홍길동" required maxLength={30} autoComplete="name" />
        </label>
        <label>
          이메일
          <input type="email" value={form.email} onChange={update('email')} placeholder="example@email.com" required autoComplete="email" />
        </label>
        <label>
          비밀번호
          <input type="password" value={form.password} onChange={update('password')} placeholder="6자 이상" required autoComplete="new-password" />
        </label>
        <label>
          비밀번호 확인
          <input type="password" value={form.passwordConfirm} onChange={update('passwordConfirm')} required autoComplete="new-password" />
        </label>
        <label>
          전화번호
          <input type="tel" value={form.phone} onChange={update('phone')} placeholder="010-1234-5678" autoComplete="tel" />
        </label>
        {error && <p className="msg msg-error">{error}</p>}
        <button type="submit" className="btn btn-red btn-block" disabled={submitting}>
          {submitting ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <p className="auth-footer">
        이미 회원이신가요? <Link to="/login">로그인하기</Link>
      </p>
    </section>
  )
}
