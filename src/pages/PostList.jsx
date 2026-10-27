import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { formatListDate, relationCount } from '../lib/format.js'
import { supabase } from '../lib/supabase.js'

const PAGE_SIZE = 15

export default function PostList() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? 1)
  const keyword = searchParams.get('q') ?? ''

  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState(keyword)

  useEffect(() => {
    let ignore = false
    const from = (page - 1) * PAGE_SIZE

    let query = supabase
      .from('posts')
      .select('id, title, views, created_at, image_url, users!posts_user_id_fkey(name), comments(count), likes(count)', { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (keyword) query = query.ilike('title', `%${keyword}%`)

    query.then(({ data, count, error }) => {
      if (ignore) return
      if (error) setError('게시글을 불러오지 못했어요.')
      else {
        setPosts(data)
        setTotal(count ?? 0)
      }
      setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [page, keyword])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSearch = (e) => {
    e.preventDefault()
    setLoading(true)
    setSearchParams(searchInput.trim() ? { q: searchInput.trim() } : {})
  }

  const goPage = (p) => {
    setLoading(true)
    setSearchParams(keyword ? { q: keyword, page: p } : { page: p })
  }

  return (
    <section>
      <div className="hero">
        <div>
          <p className="hero-kicker">OUR GYM CLUB</p>
          <h1 className="hero-title">같이 하면 <span className="hl-yellow">더 무겁게</span> 든다!</h1>
          <p className="hero-desc">동네 헬스장, 시간대, 운동 부위까지 — 나와 딱 맞는 메이트를 찾아보세요.</p>
        </div>
        <Link to={user ? '/write' : '/login'} className="btn btn-yellow btn-lg">✍️ 메이트 구하기 글쓰기</Link>
      </div>

      <div className="board">
        <div className="board-head">
          <h2 className="board-title">메이트 게시판 <span className="count">{total}</span></h2>
          <form onSubmit={handleSearch} className="search">
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="제목 검색" aria-label="제목 검색" />
            <button type="submit" className="btn btn-blue">검색</button>
          </form>
        </div>

        <table className="board-table">
          <thead>
            <tr>
              <th className="col-no">번호</th>
              <th>제목</th>
              <th className="col-author">작성자</th>
              <th className="col-date">작성일</th>
              <th className="col-num">조회</th>
              <th className="col-num">좋아요</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="empty">불러오는 중...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="empty">{error}</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={6} className="empty">{keyword ? '검색 결과가 없어요.' : '첫 번째 메이트 모집글을 올려보세요! 💪'}</td></tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td className="col-no">{post.id}</td>
                  <td className="col-title">
                    <Link to={`/posts/${post.id}`}>{post.title}</Link>
                    {post.image_url && <span className="tag-img" title="사진 첨부">📷</span>}
                    {relationCount(post.comments) > 0 && <span className="cmt-count">[{relationCount(post.comments)}]</span>}
                    <span className="mobile-meta">
                      {post.users?.name} · {formatListDate(post.created_at)} · 조회 {post.views} · ❤️ {relationCount(post.likes)}
                    </span>
                  </td>
                  <td className="col-author">{post.users?.name ?? '알 수 없음'}</td>
                  <td className="col-date">{formatListDate(post.created_at)}</td>
                  <td className="col-num">{post.views}</td>
                  <td className="col-num">{relationCount(post.likes)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <nav className="pagination" aria-label="페이지">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={p === page ? 'active' : ''} onClick={() => goPage(p)}>{p}</button>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}
