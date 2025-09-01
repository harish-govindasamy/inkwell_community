import { useState, useCallback, useEffect } from "react";
import { postService, commentService } from "../services/postService";

// Hook for managing posts with Supabase integration
export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all published posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await postService.getPublishedPosts();
      if (error) throw new Error(error);
      setPosts(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's posts
  const fetchUserPosts = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await postService.getUserPosts(userId);
      if (error) throw new Error(error);
      setPosts(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching user posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new post
  const createPost = useCallback(async (postData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await postService.createPost(postData);
      if (error) throw new Error(error);

      // Add to posts list if it's published
      if (data.status === "published") {
        setPosts((prev) => [data, ...prev]);
      }

      return { data, error: null };
    } catch (err) {
      setError(err.message);
      console.error("Error creating post:", err);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update post
  const updatePost = useCallback(async (postId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await postService.updatePost(postId, updates);
      if (error) throw new Error(error);

      // Update in posts list
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, ...data } : post))
      );

      return { data, error: null };
    } catch (err) {
      setError(err.message);
      console.error("Error updating post:", err);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete post
  const deletePost = useCallback(async (postId) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await postService.deletePost(postId);
      if (error) throw new Error(error);

      // Remove from posts list
      setPosts((prev) => prev.filter((post) => post.id !== postId));

      return { error: null };
    } catch (err) {
      setError(err.message);
      console.error("Error deleting post:", err);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Like/Unlike post
  const toggleLike = useCallback(async (postId, userId) => {
    try {
      const { error } = await postService.toggleLike(postId, userId);
      if (error) throw new Error(error);

      // Update like count in posts list
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              like_count: post.like_count + (post.liked ? -1 : 1),
              liked: !post.liked,
            };
          }
          return post;
        })
      );

      return { error: null };
    } catch (err) {
      console.error("Error toggling like:", err);
      return { error: err.message };
    }
  }, []);

  // Bookmark/Unbookmark post
  const toggleBookmark = useCallback(async (postId, userId) => {
    try {
      const { error } = await postService.toggleBookmark(postId, userId);
      if (error) throw new Error(error);

      // Update bookmark status in posts list
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              bookmarked: !post.bookmarked,
            };
          }
          return post;
        })
      );

      return { error: null };
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      return { error: err.message };
    }
  }, []);

  // Search posts
  const searchPosts = useCallback(async (query) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await postService.searchPosts(query);
      if (error) throw new Error(error);
      setPosts(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error searching posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    fetchUserPosts,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    toggleBookmark,
    searchPosts,
  };
};

// Hook for managing a single post
export const usePost = (postId) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch single post
  const fetchPost = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await postService.getPostById(postId);
      if (error) throw new Error(error);
      setPost(data);

      // Increment view count
      await postService.incrementViewCount(postId);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching post:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Auto-fetch post when postId changes
  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Update post
  const updatePost = useCallback(
    async (updates) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await postService.updatePost(postId, updates);
        if (error) throw new Error(error);
        setPost(data);
        return { data, error: null };
      } catch (err) {
        setError(err.message);
        console.error("Error updating post:", err);
        return { data: null, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  // Delete post
  const deletePost = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await postService.deletePost(postId);
      if (error) throw new Error(error);
      setPost(null);
      return { error: null };
    } catch (err) {
      setError(err.message);
      console.error("Error deleting post:", err);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Like/Unlike post
  const toggleLike = useCallback(
    async (userId) => {
      try {
        const { error } = await postService.toggleLike(postId, userId);
        if (error) throw new Error(error);

        setPost((prev) =>
          prev
            ? {
                ...prev,
                like_count: prev.like_count + (prev.liked ? -1 : 1),
                liked: !prev.liked,
              }
            : null
        );

        return { error: null };
      } catch (err) {
        console.error("Error toggling like:", err);
        return { error: err.message };
      }
    },
    [postId]
  );

  // Bookmark/Unbookmark post
  const toggleBookmark = useCallback(
    async (userId) => {
      try {
        const { error } = await postService.toggleBookmark(postId, userId);
        if (error) throw new Error(error);

        setPost((prev) =>
          prev
            ? {
                ...prev,
                bookmarked: !prev.bookmarked,
              }
            : null
        );

        return { error: null };
      } catch (err) {
        console.error("Error toggling bookmark:", err);
        return { error: err.message };
      }
    },
    [postId]
  );

  return {
    post,
    loading,
    error,
    fetchPost,
    updatePost,
    deletePost,
    toggleLike,
    toggleBookmark,
  };
};

// Hook for managing comments
export const useComments = (postId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch comments for a post
  const fetchComments = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await commentService.getComments(postId);
      if (error) throw new Error(error);
      setComments(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Auto-fetch comments when postId changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Add comment
  const addComment = useCallback(
    async (commentData) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await commentService.addComment({
          ...commentData,
          post_id: postId,
        });
        if (error) throw new Error(error);

        setComments((prev) => [...prev, data]);
        return { data, error: null };
      } catch (err) {
        setError(err.message);
        console.error("Error adding comment:", err);
        return { data: null, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  // Delete comment
  const deleteComment = useCallback(async (commentId) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await commentService.deleteComment(commentId);
      if (error) throw new Error(error);

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      return { error: null };
    } catch (err) {
      setError(err.message);
      console.error("Error deleting comment:", err);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    deleteComment,
  };
};
