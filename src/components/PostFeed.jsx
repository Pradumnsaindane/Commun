import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from './PostCard'
import CreatePost from './CreatePost'

export default function PostFeed({ userId, profile }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()

    // Subscribe to real-time post changes
    const subscription = supabase
      .channel('posts-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          loadPosts()
        } else if (payload.eventType === 'DELETE') {
          setPosts(posts.filter(p => p.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadPosts = async () => {
    try {
      const { data: postRows, error } = await supabase
        .from('posts')
        .select('id, body, created_at, author_id')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const authorIds = [...new Set((postRows || []).map((post) => post.author_id))]
      const { data: profiles, error: profilesError } = authorIds.length
        ? await supabase.from('profiles').select('id, display_name').in('id', authorIds)
        : { data: [], error: null }
      if (profilesError) throw profilesError

      const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]))
      setPosts((postRows || []).map((post) => ({
        ...post,
        profiles: profileById.get(post.author_id) || null,
      })))
    } catch (err) {
      console.error('[v0] Error loading posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = async (newPost) => {
    setPosts([newPost, ...posts])
  }

  return (
    <div className="feed-container">
      <div className="feed-card">
        <CreatePost userId={userId} userProfile={profile} onPostCreated={handlePostCreated} />
      </div>

      <div className="posts-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={userId} onDelete={loadPosts} />
          ))
        )}
      </div>
    </div>
  )
}
