import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CreatePost({ userId, userProfile, onPostCreated }) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({ author_id: userId, body: body.trim() })
        .select('id, body, created_at, author_id')
        .single()

      if (error) throw error

      setBody('')
      onPostCreated({ ...data, profiles: userProfile || null })
    } catch (err) {
      setError(err.message || 'Failed to create post')
      console.error('[v0] Error creating post:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-post">
      <div className="post-avatar">
        <div className="avatar-circle">{userProfile?.display_name?.charAt(0) || '?'}</div>
      </div>

      <form onSubmit={handleSubmit} className="post-form">
        <textarea
          placeholder="What's on your mind? Share your thoughts, questions, or collaborations..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={3}
          required
          disabled={loading}
        />

        {error && <div className="form-error">{error}</div>}

        <div className="post-footer">
          <span className="char-count">{body.length}/5000</span>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={loading || !body.trim()}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
