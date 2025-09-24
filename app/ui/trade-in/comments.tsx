'use client';
import { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

interface Comment {
  id: number;
  comment_type: string;
  comment: string;
  context_data: any;
  created_by: string;
  created_at: string;
}

interface TradeInCommentsProps {
  tradeInId: string;
}

export default function TradeInComments({ tradeInId }: TradeInCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/trade-in/requests/${tradeInId}/comments`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/trade-in/requests/${tradeInId}/comments`);
        const data = await response.json();
        
        if (data.success) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [tradeInId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/trade-in/requests/${tradeInId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh comments
        await fetchComments();
        setNewComment('');
      } else {
        alert('Error al agregar el comentario: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCommentTypeLabel = (type: string) => {
    const types = {
      'product_verification': 'Verificación de Productos',
      'status_change': 'Cambio de Estado',
      'state_change': 'Cambio de Estado Calculado',
      'general_comment': 'Comentario General',
      'repair_added': 'Reparación Agregada',
      'manual_comment': 'Comentario Manual'
    };
    return types[type as keyof typeof types] || type;
  };

  const getCommentTypeColor = (type: string) => {
    const colors = {
      'product_verification': 'bg-blue-100 text-blue-800',
      'status_change': 'bg-green-100 text-green-800',
      'state_change': 'bg-orange-100 text-orange-800',
      'general_comment': 'bg-gray-100 text-gray-800',
      'repair_added': 'bg-orange-100 text-orange-800',
      'manual_comment': 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    // Create date object and ensure it's handled correctly
    const date = new Date(dateString);
    
    // Use Intl.DateTimeFormat for more reliable timezone handling
    const formatter = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return formatter.format(date);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Bitácora de Comentarios</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center mb-4">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">Bitácora de Comentarios</h2>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hay comentarios registrados</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCommentTypeColor(comment.comment_type)}`}>
                  {getCommentTypeLabel(comment.comment_type)}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {formatDate(comment.created_at)}
                </div>
              </div>

              {/* Comment Content */}
              <div className="text-sm text-gray-800 whitespace-pre-line mb-2">
                {comment.comment}
              </div>

              {/* Footer */}
              <div className="flex items-center text-xs text-gray-500">
                <UserIcon className="h-3 w-3 mr-1" />
                <span>Por: {comment.created_by}</span>
              </div>

              {/* Context Data (if available) */}
              {comment.context_data && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                    Ver detalles técnicos
                  </summary>
                  <pre className="text-xs text-gray-400 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(comment.context_data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form - Always visible at the bottom */}
      <div className="pt-4 border-t border-gray-200">
        <form onSubmit={handleAddComment}>
          <div className="mb-3">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Comentario
            </label>
            <textarea
              id="comment"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe tu comentario aquí..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Agregando...' : 'Agregar Comentario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
