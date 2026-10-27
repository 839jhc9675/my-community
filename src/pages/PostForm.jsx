import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { IMAGE_BUCKET, supabase } from '../lib/supabase.js'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// 새 글 작성과 기존 글 수정을 함께 처리
export default function PostForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    supabase
      .from('posts')
      .select('title, content, image_url, user_id')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return navigate('/', { replace: true })
        setTitle(data.title)
        setContent(data.content)
        setImageUrl(data.image_url)
      })
  }, [id, isEdit, navigate])

  // 선택한 사진 미리보기 URL 교체 (이전 URL 은 메모리 해제)
  const changeFile = (next) => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(next)
    setPreview(next ? URL.createObjectURL(next) : null)
  }

  const handleFile = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith('image/')) return setError('이미지 파일만 올릴 수 있어요.')
    if (selected.size > MAX_IMAGE_SIZE) return setError('사진은 5MB 이하만 올릴 수 있어요.')
    setError('')
    changeFile(selected)
  }

  const uploadImage = async () => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    // 본인 auth id 폴더에만 업로드 가능 (Storage 정책)
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type })
    if (error) throw error
    return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profile) return setError('회원 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.')
    setSubmitting(true)
    setError('')
    try {
      const newImageUrl = file ? await uploadImage() : imageUrl
      const payload = { title: title.trim(), content: content.trim(), image_url: newImageUrl }

      const { data, error } = isEdit
        ? await supabase.from('posts').update(payload).eq('id', id).select('id').single()
        : await supabase.from('posts').insert({ ...payload, user_id: profile.id }).select('id').single()
      if (error) throw error
      navigate(`/posts/${data.id}`, { replace: true })
    } catch {
      setError('저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  const shownImage = preview ?? imageUrl

  return (
    <section className="panel">
      <h1 className="panel-title">{isEdit ? '게시글 수정' : '메이트 구하기 글쓰기'}</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 강남역 근처 저녁 7시 하체 메이트 구해요" required maxLength={200} />
        </label>
        <label>
          내용
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            required
            placeholder={'운동 장소, 시간대, 운동 부위, 경력 등을 적어주세요.\n\n📍 장소:\n⏰ 시간:\n🏋️ 운동:\n💬 한마디:'}
          />
        </label>

        <div className="file-field">
          <span>사진 (선택, 5MB 이하)</span>
          <label className="btn btn-ghost file-btn">
            📷 사진 선택
            <input type="file" accept="image/*" onChange={handleFile} hidden />
          </label>
          {shownImage && (
            <div className="image-preview">
              <img src={shownImage} alt="첨부 사진 미리보기" />
              <button type="button" className="link-btn" onClick={() => { changeFile(null); setImageUrl(null) }}>사진 빼기</button>
            </div>
          )}
        </div>

        {error && <p className="msg msg-error">{error}</p>}
        <div className="form-actions">
          <Link to={isEdit ? `/posts/${id}` : '/'} className="btn btn-ghost">취소</Link>
          <button type="submit" className="btn btn-red" disabled={submitting}>
            {submitting ? '저장 중...' : isEdit ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </form>
    </section>
  )
}
