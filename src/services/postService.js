import { supabase } from "../lib/supabase";

// Post Service for Supabase Integration
export const postService = {
  // Get all published posts
  async getPublishedPosts() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:author_id (
            id,
            full_name,
            username,
            avatar_url
          ),
          post_tags (
            tags (
              id,
              name,
              slug
            )
          )
        `
        )
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching published posts:", error);
      return { data: null, error: error.message };
    }
  },

  // Get posts by user
  async getUserPosts(userId) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          post_tags (
            tags (
              id,
              name,
              slug
            )
          )
        `
        )
        .eq("author_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching user posts:", error);
      return { data: null, error: error.message };
    }
  },

  // Get single post by ID
  async getPostById(postId) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:author_id (
            id,
            full_name,
            username,
            avatar_url
          ),
          post_tags (
            tags (
              id,
              name,
              slug
            )
          )
        `
        )
        .eq("id", postId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching post:", error);
      return { data: null, error: error.message };
    }
  },

  // Create new post
  async createPost(postData) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([postData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error creating post:", error);
      return { data: null, error: error.message };
    }
  },

  // Update post
  async updatePost(postId, updates) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", postId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating post:", error);
      return { data: null, error: error.message };
    }
  },

  // Delete post
  async deletePost(postId) {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting post:", error);
      return { error: error.message };
    }
  },

  // Increment view count
  async incrementViewCount(postId) {
    try {
      const { error } = await supabase.rpc("increment_view_count", {
        post_id: postId,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error incrementing view count:", error);
      return { error: error.message };
    }
  },

  // Like/Unlike post
  async toggleLike(postId, userId) {
    try {
      // Check if user already liked the post
      const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase.from("likes").insert([
          {
            post_id: postId,
            user_id: userId,
          },
        ]);

        if (error) throw error;
      }

      return { error: null };
    } catch (error) {
      console.error("Error toggling like:", error);
      return { error: error.message };
    }
  },

  // Bookmark/Unbookmark post
  async toggleBookmark(postId, userId) {
    try {
      // Check if user already bookmarked the post
      const { data: existingBookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (existingBookmark) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", existingBookmark.id);

        if (error) throw error;
      } else {
        // Add bookmark
        const { error } = await supabase.from("bookmarks").insert([
          {
            post_id: postId,
            user_id: userId,
          },
        ]);

        if (error) throw error;
      }

      return { error: null };
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      return { error: error.message };
    }
  },

  // Get trending tags
  async getTrendingTags() {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("post_count", { ascending: false })
        .limit(10);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching trending tags:", error);
      return { data: null, error: error.message };
    }
  },

  // Search posts
  async searchPosts(query) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:author_id (
            id,
            full_name,
            username,
            avatar_url
          ),
          post_tags (
            tags (
              id,
              name,
              slug
            )
          )
        `
        )
        .eq("status", "published")
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error searching posts:", error);
      return { data: null, error: error.message };
    }
  },

  // Get user's liked posts
  async getUserLikedPosts(userId) {
    try {
      const { data, error } = await supabase
        .from("likes")
        .select(
          `
          posts (
            *,
            profiles:author_id (
              id,
              full_name,
              username,
              avatar_url
            ),
            post_tags (
              tags (
                id,
                name,
                slug
              )
            )
          )
        `
        )
        .eq("user_id", userId)
        .not("post_id", "is", null);

      if (error) throw error;
      return { data: data?.map((item) => item.posts), error: null };
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      return { data: null, error: error.message };
    }
  },

  // Get user's bookmarked posts
  async getUserBookmarkedPosts(userId) {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(
          `
          posts (
            *,
            profiles:author_id (
              id,
              full_name,
              username,
              avatar_url
            ),
            post_tags (
              tags (
                id,
                name,
                slug
              )
            )
          )
        `
        )
        .eq("user_id", userId);

      if (error) throw error;
      return { data: data?.map((item) => item.posts), error: null };
    } catch (error) {
      console.error("Error fetching bookmarked posts:", error);
      return { data: null, error: error.message };
    }
  },
};

// Comment Service
export const commentService = {
  // Get comments for a post
  async getComments(postId) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles:author_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `
        )
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching comments:", error);
      return { data: null, error: error.message };
    }
  },

  // Add comment
  async addComment(commentData) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([commentData])
        .select(
          `
          *,
          profiles:author_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `
        )
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error adding comment:", error);
      return { data: null, error: error.message };
    }
  },

  // Delete comment
  async deleteComment(commentId) {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting comment:", error);
      return { error: error.message };
    }
  },
};
