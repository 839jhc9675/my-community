import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import StarRating from '../components/StarRating.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDateTime } from '../lib/format.js'
import { IMAGE_BUCKET, supabase } from '../lib/supabase.js'

// 공개 URL 에서 Storage 안의 파일 경로만 추출
function storagePathFromUrl(url) {
  const marker = `/${IMAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  return idx === -1 ? null : url.slice(idx + marker.length)
}

export default function PostDetail() {
  const { id } = useParams()
  const postId = Number(id)
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [post, setPost] = useState(null)
  const [likes, setLikes] = useState([])
  const [ratings, setRatings] = useState([])
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const viewCounted = useRef(false)

  const loadReactions = useCallback(async () => {
    const [likeRes, ratingRes, commentRes] = await Promise.all([
      supabase.from('likes').select('user_id').eq('post_id', postId),
      supabase.from('ratings').select('user_id, score').eq('post_id', postId),
      supabase.from('comments').select('id, content, created_at, user_id, users(name)').eq('post_id', postId).order('id'),
    ])
    setLikes(likeRes.data ?? [])
    setRatings(ratingRes.data ?? [])
    setComments(commentRes.data ?? [])
  }, [postId])

  useEffect(() => {
    let ignore = false

    const load = async () => {
      // 조회수는 페이지에 들어올 때 한 번만 증가 (개발 모드 StrictMode 이중 실행 방지)
      if (!viewCounted.current) {
        viewCounted.current = true
        await supabase.rpc('increment_views', { p_post_id: postId })
      }
      const { data } = await supabase
        .from('posts')
        .select('id, title, content, image_url, views, created_at, updated_at, user_id, users!posts_user_id_fkey(name)')
        .eq('id', postId)
        .maybeSingle()
      if (ignore) return
      setPost(data)
      await loadReactions()
      if (!ignore) setLoading(false)
    }
    load()
    return () => {
      ignore = true
    }
  }, [postId, loadReactions])

  if (loading) return <p className="empty">불러오는 중...</p>
  if (!post) {
    return (
      <div className="empty">
        <p>게시글을 찾을 수 없어요.</p>
        <Link to="/" className="btn btn-blue">목록으로</Link>
      </div>
    )
  }

  const myId = profile?.id
  const isMine = myId === post.user_id
  const liked = likes.some((l) => l.user_id === myId)
  const myRating = ratings.find((r) => r.user_id === myId)?.score ?? 0
  const avgRating = ratings.length ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0

  const requireLogin = () => {
    if (user && myId) return true
    navigate('/login', { state: { from: `/posts/${postId}` } })
    return false
  }

  const toggleLike = async () => {
    if (!requireLogin() || busy) return
    setBusy(true)
    if (liked) await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', myId)
    else await supabase.from('likes').insert({ post_id: postId, user_id: myId })
    await loadReactions()
    setBusy(false)
  }

  const rate = async (score) => {
    if (!requireLogin() || busy) return
    setBusy(true)
    await supabase.from('ratings').upsert({ post_id: postId, user_id: myId, score })
    await loadReactions()
    setBusy(false)
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!requireLogin() || !commentText.trim()) return
    setBusy(true)
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: myId, content: commentText.trim() })
    if (!error) setCommentText('')
    await loadReactions()
    setBusy(false)
  }

  const deleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    await loadReactions()
  }

  const deletePost = async () => {
    if (!window.confirm('게시글을 삭제할까요? 댓글도 함께 삭제됩니다.')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) return window.alert('삭제하지 못했어요.')
    const path = post.image_url && storagePathFromUrl(post.image_url)
    if (path) await supabase.storage.from(IMAGE_BUCKET).remove([path])
    navigate('/', { replace: true })
  }

  const edited = new Date(post.updated_at) - new Date(post.created_at) > 1000

  return (
    <article className="detail">
      <Link to="/" className="back">← 메이트 게시판</Link>

      <header className="detail-head">
        <h1 className="detail-title">{post.title}</h1>
        <div className="detail-meta">
          <span className="author-chip">{post.users?.name ?? '알 수 없음'}</span>
          <span>{formatDateTime(post.created_at)}{edited && ' (수정됨)'}</span>
          <span>조회 {post.views}</span>
          <span>❤️ {likes.length}</span>
          <span>💬 {comments.length}</span>
        </div>
      </header>

      <div className="detail-body">
        {post.image_url && <img src={post.image_url} alt="첨부 사진" className="detail-img" />}
        <p className="detail-content">{post.content}</p>
      </div>

      <div className="reactions">
        <button className={`btn like-btn ${liked ? 'liked' : ''}`} onClick={toggleLike} disabled={busy}>
          {liked ? '❤️' : '🤍'} 좋아요 {likes.length}
        </button>
        <div className="rating-box">
          <span className="rating-label">
            평균 별점 <strong>{avgRating.toFixed(1)}</strong> ({ratings.length}명)
          </span>
          <StarRating value={myRating} onChange={rate} disabled={busy} />
        </div>
      </div>

      {isMine && (
        <div className="owner-actions">
          <Link to={`/posts/${postId}/edit`} className="btn btn-ghost">수정</Link>
          <button className="btn btn-ghost danger" onClick={deletePost}>삭제</button>
        </div>
      )}

      <section className="comments">
        <h2>댓글 <span className="count">{comments.length}</span></h2>
        <ul className="comment-list">
          {comments.length === 0 && <li className="empty">첫 댓글을 남겨보세요!</li>}
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <div className="comment-head">
                <strong>{c.users?.name ?? '알 수 없음'}</strong>
                {c.user_id === post.user_id && <span className="badge-writer">작성자</span>}
                <span className="comment-date">{formatDateTime(c.created_at)}</span>
                {c.user_id === myId && (
                  <button className="link-btn" onClick={() => deleteComment(c.id)}>삭제</button>
                )}
              </div>
              <p>{c.content}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={addComment} className="comment-form">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? '같이 운동하고 싶다면 댓글을 남겨주세요!' : '로그인 후 댓글을 남길 수 있어요.'}
            maxLength={1000}
            rows={3}
            disabled={!user}
          />
          {user ? (
            <button type="submit" className="btn btn-blue" disabled={busy || !commentText.trim()}>등록</button>
          ) : (
            <Link to="/login" state={{ from: `/posts/${postId}` }} className="btn btn-blue">로그인</Link>
          )}
        </form>
      </section>
    </article>
  )
}
