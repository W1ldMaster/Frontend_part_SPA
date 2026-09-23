import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { usersApi, getErrorMessage, normalizePage } from '../api/endpoints'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard.jsx'
import Loader from '../components/Loader.jsx'

export default function Profile({ me = false }) {
  const { username } = useParams()
  const { user: currentUser, token, reload } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const target = me ? null : username

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const req = me ? usersApi.me() : usersApi.profile(target)
    req
      .then((res) => setProfile(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [me, target])

  useEffect(() => {
    load()
  }, [load])

  const isSelf = currentUser?.username && profile?.author?.username === currentUser.username

  const toggleFollow = async () => {
    if (!profile) return
    const name = profile.author?.username
    if (!name) return

    setBusy(true)
    try {
      if (profile.is_following) {
        await usersApi.unfollow(name)
      } else {
        await usersApi.follow(name)
      }
      load()
      reload?.()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <div className="alert alert--error">{error}</div>
  if (!profile) return <div className="empty">Профиль не найден</div>

  const postsPage = normalizePage(profile.posts)
  const posts = postsPage.items

  return (
    <div className="page">
      <section className="card profile">
        <div className="profile__head">
          <div className="avatar" aria-hidden>
            {(profile.author?.username || '?')[0].toUpperCase()}
          </div>
          <div className="profile__info">
            <h1 className="profile__name">@{profile.author?.username}</h1>
            <div className="profile__stats">
              <span><b>{profile.total_posts ?? posts.length}</b> постов</span>
            </div>
          </div>

          {token && !isSelf && (
            <button
              className={'btn ' + (profile.is_following ? 'btn-ghost' : 'btn-primary')}
              onClick={toggleFollow}
              disabled={busy}
            >
              {profile.is_following ? 'Отписаться' : 'Подписаться'}
            </button>
          )}
        </div>
      </section>

      <h2 className="section-title">Посты</h2>
      {posts.length === 0 && <div className="empty">Пока нет постов</div>}
      <div className="posts">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  )
}