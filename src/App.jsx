import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import PostList from './pages/PostList.jsx'
import PostDetail from './pages/PostDetail.jsx'
import PostForm from './pages/PostForm.jsx'
import Workout from './pages/Workout.jsx'

function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/write" element={<RequireAuth><PostForm /></RequireAuth>} />
          <Route path="/posts/:id/edit" element={<RequireAuth><PostForm /></RequireAuth>} />
          <Route path="/workout" element={<RequireAuth><Workout /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">© 헬스메이트 · 오늘도 득근하세요 💪</footer>
    </>
  )
}

export default App
