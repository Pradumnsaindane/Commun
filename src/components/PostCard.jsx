import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PostCard({ post, currentUserId, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return

    setDeleting(true)
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id)
      if (error) throw error
      onDelete()
    } catch (err) {
      console.error('[v0] Error deleting post:', err)
      alert('Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  const isOwner = post.author_id === currentUserId
  const authorName = post.profiles?.display_name || 'Unknown'
  const createdDate = new Date(post.created_at)
  const timeAgo = getTimeAgo(createdDate)

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <div className="avatar-circle">{authorName.charAt(0)}</div>
          <div className="author-info">
            <div className="author-name">{authorName}</div>
            <div className="post-time">{timeAgo}</div>
          </div>
        </div>

        {isOwner && (
          <button
            className="btn-icon"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete post"
          >
            ✕
          </button>
        )}
      </div>

      <div className="post-body">
        <p>{post.body}</p>
      </div>
    </div>
  )
}

function getTimeAgo(date) {
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}
