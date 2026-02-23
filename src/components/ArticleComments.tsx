// src/components/ArticleComments.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Trash2, Edit2, X, Check, Loader2, Reply } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  users?: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface ArticleCommentsProps {
  articleId: string;
  articleAuthorId: string;
  articlePrice: number;
  hasPurchased: boolean;
}

export default function ArticleComments({
  articleId,
  articleAuthorId,
  articlePrice,
  hasPurchased,
}: ArticleCommentsProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const INITIAL_DISPLAY = 5;
  const isFreeArticle = articlePrice === 0;
  const canComment = user && (isFreeArticle || hasPurchased);
  const loginUrl = `/signin?redirect=${encodeURIComponent(location.pathname)}`;

  // コメント読み込み
  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    setLoading(true);

    // 総件数取得
    const { count } = await supabase
      .from('article_comments')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId);

    setTotalCount(count || 0);

    // コメント取得
    const { data, error } = await supabase
      .from('article_comments')
      .select(`
        *,
        users:user_id (display_name, email, avatar_url)
      `)
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments:', error);
    } else {
      // 親コメントと返信を整理
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      (data || []).forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
      });

      (data || []).forEach(comment => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          commentMap.get(comment.parent_id)!.replies!.push(comment);
        } else if (!comment.parent_id) {
          rootComments.push(comment);
        }
      });

      // 新しい順に並べ替え
      setComments(rootComments.reverse());
    }

    setLoading(false);
  };

  // コメント投稿
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;

    // 有料記事で未購入の場合は投稿不可
    if (!isFreeArticle && !hasPurchased) {
      alert('この記事にコメントするには購入が必要です。');
      return;
    }

    if (newComment.length > 500) {
      alert('コメントは500文字以内で入力してください。');
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('article_comments')
      .insert({
        article_id: articleId,
        user_id: user.id,
        content: newComment.trim(),
      })
      .select(`
        *,
        users:user_id (display_name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error posting comment:', error);
      alert('コメントの投稿に失敗しました。');
    } else if (data) {
      setComments([data, ...comments]);
      setTotalCount(prev => prev + 1);
      setNewComment('');
    }

    setSubmitting(false);
  };

  // コメント編集
  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || editContent.length > 500) return;

    const { error } = await supabase
      .from('article_comments')
      .update({
        content: editContent.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error updating comment:', error);
      alert('コメントの更新に失敗しました。');
    } else {
      setComments(comments.map(c =>
        c.id === commentId ? { ...c, content: editContent.trim(), updated_at: new Date().toISOString() } : c
      ));
      setEditingId(null);
      setEditContent('');
    }
  };

  // コメント削除
  const handleDelete = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return;

    const { error } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      alert('コメントの削除に失敗しました。');
    } else {
      // 親コメントまたは返信を削除
      setComments(comments.map(c => ({
        ...c,
        replies: c.replies?.filter(r => r.id !== commentId)
      })).filter(c => c.id !== commentId));
      setTotalCount(prev => prev - 1);
    }
  };

  // 返信投稿
  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim() || submitting) return;

    if (!isFreeArticle && !hasPurchased) {
      alert('この記事にコメントするには購入が必要です。');
      return;
    }

    if (replyContent.length > 500) {
      alert('返信は500文字以内で入力してください。');
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('article_comments')
      .insert({
        article_id: articleId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId,
      })
      .select(`
        *,
        users:user_id (display_name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error posting reply:', error);
      alert('返信の投稿に失敗しました。');
    } else if (data) {
      setComments(comments.map(c =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), data] }
          : c
      ));
      setTotalCount(prev => prev + 1);
      setReplyContent('');
      setReplyingTo(null);
    }

    setSubmitting(false);
  };

  const displayedComments = showAll ? comments : comments.slice(0, INITIAL_DISPLAY);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-bold text-gray-900">
          コメント {totalCount > 0 && <span className="text-gray-500 font-normal">({totalCount})</span>}
        </h3>
      </div>

      {/* コメント投稿フォーム */}
      {user ? (
        canComment ? (
          <form onSubmit={handleSubmit} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{newComment.length}/500</span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '投稿する'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-600">
            この記事にコメントするには購入が必要です。
          </div>
        )
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-600">
          コメントするには<Link to={loginUrl} className="text-gray-900 font-medium hover:underline">ログイン</Link>してください。
        </div>
      )}

      {/* コメント一覧 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          まだコメントはありません。
        </div>
      ) : (
        <div className="space-y-4">
          {displayedComments.map((comment) => {
            const isOwner = user?.id === comment.user_id;
            const isArticleAuthor = user?.id === articleAuthorId;
            const canModify = isOwner || isArticleAuthor;
            const displayName = comment.users?.display_name || comment.users?.email?.split('@')[0] || '匿名';

            return (
              <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  {/* アバター */}
                  <Link to={`/users/${comment.user_id}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      <img src={comment.users?.avatar_url || '/noicon.png'} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    {/* ヘッダー */}
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/users/${comment.user_id}`}
                        className="font-medium text-sm text-gray-900 hover:underline"
                      >
                        {displayName}
                      </Link>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-xs text-gray-400">(編集済み)</span>
                      )}
                    </div>

                    {/* コンテンツ */}
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none text-sm"
                          rows={3}
                          maxLength={500}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(comment.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditContent(''); }}
                            className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    )}

                    {/* アクション */}
                    {editingId !== comment.id && (
                      <div className="flex items-center gap-3 mt-2">
                        {canComment && (
                          <button
                            onClick={() => { setReplyingTo(comment.id); setReplyContent(''); }}
                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" />
                            返信
                          </button>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            編集
                          </button>
                        )}
                        {canModify && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            削除
                          </button>
                        )}
                      </div>
                    )}

                    {/* 返信フォーム */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-200">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="返信を入力..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none text-sm"
                          rows={2}
                          maxLength={500}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">{replyContent.length}/500</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyContent.trim() || submitting}
                              className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50"
                            >
                              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : '返信'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 返信一覧 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                        {comment.replies.map((reply) => {
                          const replyDisplayName = reply.users?.display_name || reply.users?.email?.split('@')[0] || '匿名';
                          const isReplyOwner = user?.id === reply.user_id;
                          const canModifyReply = isReplyOwner || user?.id === articleAuthorId;

                          return (
                            <div key={reply.id} className="flex items-start gap-2">
                              <Link to={`/users/${reply.user_id}`} className="flex-shrink-0">
                                <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden">
                                  <img src={reply.users?.avatar_url || '/noicon.png'} alt="" className="w-full h-full object-cover" />
                                </div>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Link to={`/users/${reply.user_id}`} className="font-medium text-xs text-gray-900 hover:underline">
                                    {replyDisplayName}
                                  </Link>
                                  <span className="text-[10px] text-gray-400">{formatDate(reply.created_at)}</span>
                                </div>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                                {canModifyReply && (
                                  <button
                                    onClick={() => handleDelete(reply.id)}
                                    className="text-[10px] text-gray-400 hover:text-red-500 mt-1"
                                  >
                                    削除
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* もっと見る */}
          {!showAll && comments.length > INITIAL_DISPLAY && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
            >
              もっと見る（残り {comments.length - INITIAL_DISPLAY} 件）
            </button>
          )}
        </div>
      )}
    </div>
  );
}
