# 💪 헬스메이트 (my-community)

함께 운동할 헬스 메이트를 구하는 커뮤니티입니다. React + Vite 프론트엔드가 백엔드 서버 없이 Supabase(DB·인증·Storage)에 직접 연결됩니다.

## 주요 기능
- 이메일 회원가입 / 로그인 (Supabase Auth — 비밀번호는 암호화 저장)
- 메이트 게시판: 번호·제목·작성자·작성일·조회수·좋아요, 제목 검색, 페이지 이동
- 게시물 상세: 내용, 사진, 좋아요, 별점(1~5), 댓글
- 사진 업로드 (Storage `post-images` 버킷, 5MB 이하)
- 운동기록: 날짜별 운동 일지 + 이번 달 통계 (본인만 조회)

## DB 구조 (Supabase)
| 테이블 | 설명 |
| --- | --- |
| `users` | 사용자 번호, 이름, 이메일, 전화번호, 가입일 (회원가입 시 트리거로 자동 생성) |
| `posts` | 게시물 번호, 제목, 내용, 사진, 조회수, 작성자, 작성일, 수정일 |
| `comments` | 댓글 번호, 내용, 작성자, 게시물, 작성일 |
| `likes` / `ratings` | 좋아요 / 별점 (사용자당 게시물 1회) |
| `workout_logs` | 운동 기록 |

모든 테이블에 RLS 가 켜져 있어 본인 글/댓글/기록만 수정·삭제할 수 있습니다.

## 로컬 실행
```bash
cp .env.example .env   # Supabase URL / publishable key 입력
npm install
npm run dev
```

## 배포
`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml` 이 빌드 후 GitHub Pages 로 배포합니다.
저장소 Secrets 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 가 필요합니다.
