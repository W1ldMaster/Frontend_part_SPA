import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Feed from './pages/Feed.jsx'
import FollowFeed from './pages/FollowFeed.jsx'
import Groups from './pages/Groups.jsx'
import GroupPosts from './pages/GroupPosts.jsx'
import Profile from './pages/Profile.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Settings from './pages/Settings.jsx'


function RequireAuth({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/follow" element={<RequireAuth><FollowFeed /></RequireAuth>} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:slug" element={<GroupPosts />} />
          <Route path="/profile/me" element={<RequireAuth><Profile me /></RequireAuth>} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}