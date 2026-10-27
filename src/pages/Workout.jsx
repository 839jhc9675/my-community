import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const today = () => new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD (로컬 날짜)
const emptyForm = () => ({ workout_date: today(), exercise: '', sets: '', reps: '', weight: '', duration_min: '', memo: '' })

// 빈 입력값은 null 로, 숫자 칸은 숫자로 변환
function toPayload(form) {
  const num = (v) => (v === '' ? null : Number(v))
  return {
    workout_date: form.workout_date,
    exercise: form.exercise.trim(),
    sets: num(form.sets),
    reps: num(form.reps),
    weight: num(form.weight),
    duration_min: num(form.duration_min),
    memo: form.memo.trim() || null,
  }
}

export default function Workout() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .order('workout_date', { ascending: false })
      .order('id', { ascending: false })
      .limit(100)
    setLogs(data ?? [])
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('workout_logs').insert({ ...toPayload(form), user_id: profile.id })
    setSaving(false)
    if (error) return setError('기록을 저장하지 못했어요.')
    setForm({ ...emptyForm(), workout_date: form.workout_date })
    loadLogs()
  }

  const remove = async (logId) => {
    if (!window.confirm('이 기록을 삭제할까요?')) return
    await supabase.from('workout_logs').delete().eq('id', logId)
    loadLogs()
  }

  // 이번 달 통계
  const monthPrefix = today().slice(0, 7)
  const monthLogs = logs.filter((l) => l.workout_date.startsWith(monthPrefix))
  const monthDays = new Set(monthLogs.map((l) => l.workout_date)).size
  const monthMinutes = monthLogs.reduce((sum, l) => sum + (l.duration_min ?? 0), 0)

  // 날짜별로 묶어서 표시
  const grouped = logs.reduce((acc, log) => {
    ;(acc[log.workout_date] ??= []).push(log)
    return acc
  }, {})

  return (
    <section>
      <div className="stats">
        <div className="stat stat-blue"><span>이번 달 운동일</span><strong>{monthDays}일</strong></div>
        <div className="stat stat-red"><span>이번 달 기록</span><strong>{monthLogs.length}개</strong></div>
        <div className="stat stat-yellow"><span>이번 달 운동시간</span><strong>{monthMinutes}분</strong></div>
      </div>

      <div className="panel">
        <h1 className="panel-title">오늘의 운동 기록하기 🏋️</h1>
        <form onSubmit={handleSubmit} className="workout-form">
          <label>날짜<input type="date" value={form.workout_date} onChange={update('workout_date')} required /></label>
          <label className="wide">운동 종목<input value={form.exercise} onChange={update('exercise')} placeholder="예) 스쿼트, 러닝" required maxLength={50} /></label>
          <label>세트<input type="number" min="0" value={form.sets} onChange={update('sets')} /></label>
          <label>횟수<input type="number" min="0" value={form.reps} onChange={update('reps')} /></label>
          <label>무게(kg)<input type="number" min="0" step="0.5" value={form.weight} onChange={update('weight')} /></label>
          <label>시간(분)<input type="number" min="0" value={form.duration_min} onChange={update('duration_min')} /></label>
          <label className="full">메모<input value={form.memo} onChange={update('memo')} placeholder="컨디션, 느낀 점 등" maxLength={200} /></label>
          {error && <p className="msg msg-error full">{error}</p>}
          <button type="submit" className="btn btn-red full" disabled={saving}>{saving ? '저장 중...' : '기록 추가'}</button>
        </form>
      </div>

      <div className="panel">
        <h2 className="panel-title">나의 운동 일지</h2>
        {logs.length === 0 && <p className="empty">아직 기록이 없어요. 오늘 운동부터 기록해 볼까요?</p>}
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="log-day">
            <h3 className="log-date">{date}</h3>
            <ul className="log-list">
              {items.map((log) => (
                <li key={log.id} className="log-item">
                  <strong>{log.exercise}</strong>
                  <span className="log-detail">
                    {[
                      log.sets != null && `${log.sets}세트`,
                      log.reps != null && `${log.reps}회`,
                      log.weight != null && `${log.weight}kg`,
                      log.duration_min != null && `${log.duration_min}분`,
                    ].filter(Boolean).join(' · ')}
                  </span>
                  {log.memo && <span className="log-memo">{log.memo}</span>}
                  <button className="link-btn" onClick={() => remove(log.id)}>삭제</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
