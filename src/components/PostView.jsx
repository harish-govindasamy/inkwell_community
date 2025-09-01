import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/SupabaseAuthContext";
import { postService } from "../services/postService";
import { usePost, useComments } from "../hooks/usePosts";
import { useToast } from "./ToastProvider";
import ReactMarkdown from "react-markdown";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  MoreHorizontal,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Eye,
  ThumbsUp,
} from "lucide-react";

const PostView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Use custom hooks for post and comments
  const {
    post,
    loading: postLoading,
    toggleLike,
    toggleBookmark,
    deletePost,
  } = usePost(id);
  const { comments, loading: commentsLoading, addComment } = useComments(id);

  const [newComment, setNewComment] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    // Increment view count when post loads
    if (post && user) {
      postService.incrementViewCount(id);
    }
  }, [post, id, user]);

  const handleLike = async () => {
    if (!user) {
      toast?.error("Please sign in to like posts");
      return;
    }

    const result = await toggleLike(user.id);
    if (result.error) {
      toast?.error("Failed to update like");
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast?.error("Please sign in to bookmark posts");
      return;
    }

    const result = await toggleBookmark(user.id);
    if (result.error) {
      toast?.error("Failed to update bookmark");
    } else {
      toast?.success(
        post?.bookmarked ? "Removed from bookmarks" : "Added to bookmarks"
      );
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || "Check out this post",
          url: window.location.href,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast?.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast?.success("Link copied to clipboard!");
      } catch (err) {
        toast?.error("Failed to share post");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    const result = await deletePost();
    if (result.error) {
      toast?.error("Failed to delete post");
    } else {
      toast?.success("Post deleted successfully");
      navigate("/dashboard");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    const commentData = {
      content: newComment.trim(),
      author_id: user.id,
      post_id: id,
    };

    const result = await addComment(commentData);
    if (result.error) {
      toast?.error("Failed to add comment");
    } else {
      setNewComment("");
      toast?.success("Comment added successfully");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Post not found
          </h1>
          <p className="text-gray-600 mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/posts"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>

        {/* Main Content */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Cover Image */}
          {post.cover_image && (
            <div className="w-full h-64 md:h-80 relative">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
            </div>
          )}

          {/* Article Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-medium">
                    {post.profiles?.full_name
                      ? post.profiles.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : post.profiles?.username?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {post.profiles?.full_name ||
                      post.profiles?.username ||
                      "Unknown Author"}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                    <span className="mx-2">•</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{post.reading_time || 1} min read</span>
                    <span className="mx-2">•</span>
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{post.view_count || 0} views</span>
                  </div>
                </div>
              </div>

              {/* Three dots menu */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    {user && user.id === post.author_id && (
                      <>
                        <Link
                          to={`/edit/${post.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Post
                        </Link>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleDeletePost();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Post
                        </button>
                        <hr className="my-1" />
                      </>
                    )}
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleShare();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Post
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* Tags */}
            {post.post_tags && post.post_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.post_tags.map((postTag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-indigo-100 hover:text-indigo-700 cursor-pointer transition-colors"
                  >
                    #{postTag.tags.name}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    post.liked
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${post.liked ? "fill-current" : ""}`}
                  />
                  <span>{post.like_count || 0}</span>
                  <span className="hidden sm:inline">
                    {post.like_count === 1 ? "like" : "likes"}
                  </span>
                </button>

                <button
                  onClick={handleBookmark}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    post.bookmarked
                      ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                      : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Bookmark
                    className={`h-5 w-5 ${
                      post.bookmarked ? "fill-current" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {post.bookmarked ? "Saved" : "Save"}
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {sharing ? "Sharing..." : "Share"}
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MessageSquare className="h-4 w-4" />
                <span>{comments?.length || 0} comments</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-8">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Discussion ({comments?.length || 0})
            </h3>
          </div>

          {/* Add Comment */}
          {user ? (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user.user_metadata?.full_name
                      ? user.user_metadata.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : user.email?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add to the discussion..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || commentsLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentsLoading ? "Posting..." : "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-gray-200 text-center">
              <p className="text-gray-600">
                <Link
                  to="/auth"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign in
                </Link>{" "}
                to join the discussion
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="divide-y divide-gray-200">
            {commentsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading comments...</p>
              </div>
            ) : comments?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              comments?.map((comment) => (
                <div key={comment.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {comment.profiles?.full_name
                          ? comment.profiles.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : comment.profiles?.username?.[0]?.toUpperCase() ||
                            "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="font-medium text-gray-900">
                          {comment.profiles?.full_name ||
                            comment.profiles?.username ||
                            "Unknown Author"}
                        </p>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{comment.content}</p>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{comment.like_count || 0}</span>
                        </button>
                        <button className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default PostView;
