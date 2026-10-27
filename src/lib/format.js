const pad = (n) => String(n).padStart(2, '0')

// 날짜를 2026.10.27 14:05 형태로 표시
export function formatDateTime(value) {
  const d = new Date(value)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 오늘 쓴 글은 시간만, 이전 글은 날짜만 (네이버 카페 목록 방식)
export function formatListDate(value) {
  const d = new Date(value)
  if (d.toDateString() === new Date().toDateString()) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

// supabase 관계 count 결과([{ count: n }])에서 숫자만 꺼냄
export function relationCount(rel) {
  return rel?.[0]?.count ?? 0
}
