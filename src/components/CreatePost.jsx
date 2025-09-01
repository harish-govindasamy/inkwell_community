import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/SupabaseAuthContext";
import { useToast } from "./ToastProvider";
import { postService } from "../services/postService";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import {
  Save,
  Eye,
  EyeOff,
  FileText,
  Tag as TagIcon,
  Globe,
  ArrowLeft,
  Bold,
  Italic,
  Link,
  Code,
  List,
  ListOrdered,
  Quote,
  Image,
  Table,
  Maximize2,
  Minimize2,
  Settings,
  Upload,
  X,
} from "lucide-react";

const CreatePost = ({ isEdit = false }) => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: [],
    status: "draft",
    coverImage: null,
  });

  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState("split"); // 'split', 'preview', 'edit'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);

  const categories = [
    "Technology",
    "Programming",
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "DevOps",
    "Security",
    "UI/UX",
    "Career",
    "Tutorials",
    "Opinion",
    "News",
    "Review",
  ];

  const toolbarButtons = [
    { icon: Bold, label: "Bold", syntax: "**text**", shortcut: "Ctrl+B" },
    { icon: Italic, label: "Italic", syntax: "*text*", shortcut: "Ctrl+I" },
    { icon: Link, label: "Link", syntax: "[text](url)", shortcut: "Ctrl+K" },
    { icon: Code, label: "Inline Code", syntax: "`code`", shortcut: "Ctrl+`" },
    { icon: List, label: "Bullet List", syntax: "- item", shortcut: null },
    {
      icon: ListOrdered,
      label: "Numbered List",
      syntax: "1. item",
      shortcut: null,
    },
    { icon: Quote, label: "Quote", syntax: "> quote", shortcut: null },
    { icon: Image, label: "Image", syntax: "![alt](url)", shortcut: null },
    {
      icon: Table,
      label: "Table",
      syntax: "| Col1 | Col2 |\n|------|------|\n| Val1 | Val2 |",
      shortcut: null,
    },
  ];

  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById("content-editor");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText;
    if (syntax.includes("text")) {
      newText = syntax.replace("text", selectedText || "text");
    } else if (syntax.includes("url")) {
      newText = syntax.replace("url", "https://example.com");
    } else {
      newText = syntax;
    }

    const before = text.substring(0, start);
    const after = text.substring(end);
    const updatedContent = before + newText + after;

    setFormData({ ...formData, content: updatedContent });

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + newText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Load existing post for editing
  useEffect(() => {
    if (isEdit && id) {
      loadPostForEditing();
    }
  }, [isEdit, id]);

  const loadPostForEditing = async () => {
    try {
      setLoading(true);
      const { data, error } = await postService.getPostById(id);

      if (error) {
        setError("Failed to load post for editing");
        console.error("Error loading post:", error);
        return;
      }

      if (data) {
        setFormData({
          title: data.title || "",
          content: data.content || "",
          excerpt: data.excerpt || "",
          tags: data.post_tags?.map((pt) => pt.tags.name) || [],
          status: data.status || "draft",
        });
      }
    } catch (error) {
      console.error("Error loading post:", error);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  // Handle save function with Supabase database
  const handleSave = async (publish = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    if (!user) {
      setError("You must be logged in to create posts");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Calculate reading time
      const words = formData.content
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const readingTime = Math.ceil(words.length / 200);

      // Prepare post data for Supabase (matching your schema)
      const postData = {
        title: formData.title.trim(),
        content: formData.content,
        excerpt:
          formData.excerpt.trim() ||
          formData.content.substring(0, 160).replace(/[#*`]/g, "").trim() +
            "...",
        cover_image: formData.coverImage,
        status: publish ? "published" : "draft",
        author_id: user.id,
        slug: formData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, ""),
        published_at: publish ? new Date().toISOString() : null,
        reading_time: readingTime,
      };

      let result;
      if (isEdit) {
        // Update existing post
        result = await postService.updatePost(id, postData);
      } else {
        // Create new post
        result = await postService.createPost(postData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Handle tags if any exist
      if (formData.tags.length > 0 && result.data) {
        // Note: You'll need to implement tag handling in your postService
        // This would involve creating/finding tags and linking them to the post
        console.log(
          "Tags to process:",
          formData.tags,
          "for post:",
          result.data.id
        );
      }

      // Show success message
      if (toast) {
        toast.success(
          publish
            ? isEdit
              ? "Post updated and published!"
              : "Post published successfully!"
            : isEdit
            ? "Post updated!"
            : "Draft saved!"
        );
      }

      // Navigate to the post or dashboard
      if (publish && result.data) {
        navigate(`/post/${result.data.id}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      setError(`Failed to save post: ${error.message}`);
      if (toast) {
        toast.error("Failed to save post");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle tag input
  const handleTagKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags });
  };

  // Handle banner image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError("Image size should be less than 5MB");
      return;
    }

    setImageUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(filePath);

      setFormData({ ...formData, coverImage: publicUrl });
      if (toast) {
        toast.success("Banner image uploaded successfully!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again.");
      if (toast) {
        toast.error("Failed to upload image");
      }
    } finally {
      setImageUploading(false);
    }
  };

  const removeCoverImage = () => {
    setFormData({ ...formData, coverImage: null });
  };

  // Calculate reading time and word count
  useMemo(() => {
    const words = formData.content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
    setReadTime(Math.ceil(words.length / 200)); // 200 words per minute
  }, [formData.content]);

  const handleKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          insertMarkdown("**text**");
          break;
        case "i":
          e.preventDefault();
          insertMarkdown("*text*");
          break;
        case "k":
          e.preventDefault();
          insertMarkdown("[text](url)");
          break;
        case "`":
          e.preventDefault();
          insertMarkdown("`code`");
          break;
        case "s":
          e.preventDefault();
          handleSave();
          break;
      }
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {!isFullscreen && (
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{readTime} min read</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode("edit")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    previewMode === "edit"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setPreviewMode("split")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    previewMode === "split"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setPreviewMode("preview")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    previewMode === "preview"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  Preview
                </button>
              </div>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={
                  loading || !formData.title.trim() || !formData.content.trim()
                }
                className="btn btn-primary disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : isEdit ? "Update" : "Save Draft"}
              </button>

              <button
                onClick={() => handleSave(true)}
                disabled={
                  loading || !formData.title.trim() || !formData.content.trim()
                }
                className="btn btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Globe className="h-4 w-4 mr-2" />
                {loading
                  ? "Publishing..."
                  : isEdit
                  ? "Update & Publish"
                  : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Title and Metadata */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter your post title..."
            className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-400"
            style={{ fontFamily: "IBM Plex Mono, monospace" }}
          />

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add tags (e.g., react, javascript, tutorial)..."
                className="input text-sm w-64"
              />
              <TagIcon className="h-4 w-4 text-gray-400" />
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tag Suggestions */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Popular tags:</span>
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const tag = cat.toLowerCase().replace(/\s+/g, "");
                  if (
                    !formData.tags.includes(tag) &&
                    formData.tags.length < 10
                  ) {
                    setFormData({
                      ...formData,
                      tags: [...formData.tags, tag],
                    });
                  }
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                #{cat.toLowerCase().replace(/\s+/g, "")}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Editor Pane */}
          {(previewMode === "edit" || previewMode === "split") && (
            <div
              className={`${
                previewMode === "split" ? "lg:col-span-6" : "lg:col-span-9"
              } space-y-4`}
            >
              {/* Toolbar */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex flex-wrap gap-2">
                  {toolbarButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => insertMarkdown(button.syntax)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title={`${button.label} ${
                        button.shortcut ? `(${button.shortcut})` : ""
                      }`}
                    >
                      <button.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Editor */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <textarea
                  id="content-editor"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Write your post content in Markdown..."
                  className="w-full h-96 p-6 border-none outline-none resize-none bg-transparent"
                  style={{ fontFamily: "IBM Plex Mono, monospace" }}
                />
              </div>
            </div>
          )}

          {/* Preview Pane */}
          {(previewMode === "preview" || previewMode === "split") && (
            <div
              className={`${
                previewMode === "split" ? "lg:col-span-6" : "lg:col-span-9"
              }`}
            >
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-900">Preview</h3>
                </div>
                <div className="p-6 prose prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="code-block"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="code-inline" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {formData.content || "*Start writing to see preview...*"}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar */}
          <div
            className={`${
              previewMode === "split" ? "hidden" : "lg:col-span-3"
            } space-y-6`}
          >
            {/* Excerpt */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Post Excerpt</h3>
              <textarea
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder="Brief description of your post..."
                rows={3}
                className="input w-full"
              />
              <p className="text-sm text-gray-500 mt-2">
                {formData.excerpt.length}/160 characters
              </p>
            </div>

            {/* Cover Image */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Banner Image</h3>
              {formData.coverImage ? (
                <div className="relative">
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={removeCoverImage}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="input w-full"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Upload a banner image (max 5MB).
                  </p>
                </div>
              )}
            </div>

            {/* Markdown Help */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Markdown Guide</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span># Heading 1</span>
                  <code className="text-xs">## H2</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-bold">**Bold**</span>
                  <code className="text-xs">**text**</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="italic">*Italic*</span>
                  <code className="text-xs">*text*</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="underline">Link</span>
                  <code className="text-xs">[text](url)</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
