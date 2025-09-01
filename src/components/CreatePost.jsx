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
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckSquare,
  Minus,
  Plus,
  Type,
  Hash,
  AtSign,
  Calendar,
  Clock,
  Zap,
  HelpCircle,
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [lastContent, setLastContent] = useState("");

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

  // Common emojis for quick insertion
  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😯", "😦", "😧",
    "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢",
    "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩", "👻", "👽",
    "🤖", "😈", "👿", "👹", "👺", "💀", "☠️", "👻", "👽", "🤖"
  ];

  const insertEmoji = (emoji) => {
    const textarea = document.getElementById("content-editor");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    const updatedContent = before + emoji + after;
    
    setFormData({ ...formData, content: updatedContent });
    setShowEmojiPicker(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Undo/Redo functionality
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      const newUndoStack = undoStack.slice(0, -1);
      
      setRedoStack([...redoStack, formData.content]);
      setUndoStack(newUndoStack);
      setFormData({ ...formData, content: previousContent });
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      
      setUndoStack([...undoStack, formData.content]);
      setRedoStack(newRedoStack);
      setFormData({ ...formData, content: nextContent });
    }
  };

  const saveToUndoStack = (content) => {
    if (content !== lastContent) {
      setUndoStack([...undoStack, lastContent]);
      setLastContent(content);
      setRedoStack([]); // Clear redo stack when new content is added
    }
  };

  // Enhanced toolbar with more GitHub Markdown features
  const toolbarButtons = [
    // Headings
    { 
      icon: Heading1, 
      label: "Heading 1", 
      syntax: "# ", 
      shortcut: "Ctrl+1",
      category: "headings"
    },
    { 
      icon: Heading2, 
      label: "Heading 2", 
      syntax: "## ", 
      shortcut: "Ctrl+2",
      category: "headings"
    },
    { 
      icon: Heading3, 
      label: "Heading 3", 
      syntax: "### ", 
      shortcut: "Ctrl+3",
      category: "headings"
    },
    // Text formatting
    { 
      icon: Bold, 
      label: "Bold", 
      syntax: "**text**", 
      shortcut: "Ctrl+B",
      category: "formatting"
    },
    { 
      icon: Italic, 
      label: "Italic", 
      syntax: "*text*", 
      shortcut: "Ctrl+I",
      category: "formatting"
    },
    { 
      icon: Strikethrough, 
      label: "Strikethrough", 
      syntax: "~~text~~", 
      shortcut: "Ctrl+Shift+X",
      category: "formatting"
    },
    { 
      icon: Code, 
      label: "Inline Code", 
      syntax: "`code`", 
      shortcut: "Ctrl+`",
      category: "formatting"
    },
    // Links and media
    { 
      icon: Link, 
      label: "Link", 
      syntax: "[text](url)", 
      shortcut: "Ctrl+K",
      category: "media"
    },
    { 
      icon: Image, 
      label: "Image", 
      syntax: "![alt](url)", 
      shortcut: "Ctrl+Shift+I",
      category: "media"
    },
    // Lists
    { 
      icon: List, 
      label: "Bullet List", 
      syntax: "- item", 
      shortcut: "Ctrl+Shift+L",
      category: "lists"
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      syntax: "1. item",
      shortcut: "Ctrl+Shift+O",
      category: "lists"
    },
    {
      icon: CheckSquare,
      label: "Task List",
      syntax: "- [ ] task",
      shortcut: "Ctrl+Shift+T",
      category: "lists"
    },
    // Block elements
    { 
      icon: Quote, 
      label: "Quote", 
      syntax: "> quote", 
      shortcut: "Ctrl+Shift+Q",
      category: "blocks"
    },
    {
      icon: Table,
      label: "Table",
      syntax: "| Col1 | Col2 |\n|------|------|\n| Val1 | Val2 |",
      shortcut: "Ctrl+Shift+M",
      category: "blocks"
    },
    {
      icon: Code,
      label: "Code Block",
      syntax: "```\ncode block\n```",
      shortcut: "Ctrl+Shift+C",
      category: "blocks"
    },
    // Special elements
    {
      icon: Hash,
      label: "Horizontal Rule",
      syntax: "---",
      shortcut: "Ctrl+Shift+H",
      category: "special"
    },
    {
      icon: AtSign,
      label: "Mention",
      syntax: "@username",
      shortcut: "Ctrl+Shift+@",
      category: "special"
    },
    {
      icon: Type,
      label: "Emoji",
      syntax: ":smile:",
      shortcut: "Ctrl+Shift+E",
      category: "special"
    },
  ];

  // Keyboard shortcuts mapping
  const shortcuts = {
    "Ctrl+1": () => insertMarkdown("# "),
    "Ctrl+2": () => insertMarkdown("## "),
    "Ctrl+3": () => insertMarkdown("### "),
    "Ctrl+B": () => insertMarkdown("**text**"),
    "Ctrl+I": () => insertMarkdown("*text*"),
    "Ctrl+Shift+X": () => insertMarkdown("~~text~~"),
    "Ctrl+`": () => insertMarkdown("`code`"),
    "Ctrl+K": () => insertMarkdown("[text](url)"),
    "Ctrl+Shift+I": () => insertMarkdown("![alt](url)"),
    "Ctrl+Shift+L": () => insertMarkdown("- item"),
    "Ctrl+Shift+O": () => insertMarkdown("1. item"),
    "Ctrl+Shift+T": () => insertMarkdown("- [ ] task"),
    "Ctrl+Shift+Q": () => insertMarkdown("> quote"),
    "Ctrl+Shift+M": () => insertMarkdown("| Col1 | Col2 |\n|------|------|\n| Val1 | Val2 |"),
    "Ctrl+Shift+C": () => insertMarkdown("```\ncode block\n```"),
    "Ctrl+Shift+H": () => insertMarkdown("---"),
    "Ctrl+Shift+@": () => insertMarkdown("@username"),
    "Ctrl+Shift+E": () => setShowEmojiPicker(!showEmojiPicker),
    "Ctrl+Z": () => handleUndo(),
    "Ctrl+Y": () => handleRedo(),
    "Ctrl+S": () => handleSave(),
    "Ctrl+Enter": () => handleSave(true),
    "Tab": (e) => {
      e.preventDefault();
      insertMarkdown("  ");
    },
    "Shift+Tab": (e) => {
      e.preventDefault();
      // Remove 2 spaces at cursor position
      const textarea = document.getElementById("content-editor");
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      if (start === end) {
        // No selection, just remove spaces at cursor
        const beforeCursor = text.substring(0, start);
        const afterCursor = text.substring(start);
        const lines = beforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        if (currentLine.startsWith('  ')) {
          const newBeforeCursor = beforeCursor.slice(0, -2);
          const updatedContent = newBeforeCursor + afterCursor;
          setFormData({ ...formData, content: updatedContent });
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start - 2, start - 2);
          }, 0);
        }
      }
    }
  };

  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById("content-editor");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText;
    let newCursorPosition;

    // Handle different syntax patterns
    if (syntax.includes("text")) {
      newText = syntax.replace("text", selectedText || "text");
      newCursorPosition = start + syntax.indexOf("text") + (selectedText ? selectedText.length : 4);
    } else if (syntax.includes("url")) {
      newText = syntax.replace("url", "https://example.com");
      newCursorPosition = start + syntax.indexOf("url") + 19; // length of https://example.com
    } else if (syntax.includes("item")) {
      newText = syntax.replace("item", selectedText || "item");
      newCursorPosition = start + syntax.indexOf("item") + (selectedText ? selectedText.length : 4);
    } else if (syntax.includes("task")) {
      newText = syntax.replace("task", selectedText || "task");
      newCursorPosition = start + syntax.indexOf("task") + (selectedText ? selectedText.length : 4);
    } else if (syntax.includes("quote")) {
      newText = syntax.replace("quote", selectedText || "quote");
      newCursorPosition = start + syntax.indexOf("quote") + (selectedText ? selectedText.length : 5);
    } else if (syntax.includes("code block")) {
      newText = syntax.replace("code block", selectedText || "code block");
      newCursorPosition = start + syntax.indexOf("code block") + (selectedText ? selectedText.length : 10);
    } else if (syntax.includes("alt")) {
      newText = syntax.replace("alt", selectedText || "alt");
      newCursorPosition = start + syntax.indexOf("alt") + (selectedText ? selectedText.length : 3);
    } else if (syntax.includes("username")) {
      newText = syntax.replace("username", selectedText || "username");
      newCursorPosition = start + syntax.indexOf("username") + (selectedText ? selectedText.length : 8);
    } else {
      newText = syntax;
      newCursorPosition = start + newText.length;
    }

    const before = text.substring(0, start);
    const after = text.substring(end);
    const updatedContent = before + newText + after;

    // Save to undo stack before updating
    saveToUndoStack(formData.content);
    setFormData({ ...formData, content: updatedContent });

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
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

  // Enhanced keyboard handler
  const handleKeyDown = (e) => {
    const key = e.key;
    const ctrlKey = e.ctrlKey || e.metaKey;
    const shiftKey = e.shiftKey;
    
    // Build shortcut key
    let shortcutKey = "";
    if (ctrlKey) shortcutKey += "Ctrl+";
    if (shiftKey) shortcutKey += "Shift+";
    shortcutKey += key.toUpperCase();

    // Check if shortcut exists
    if (shortcuts[shortcutKey]) {
      e.preventDefault();
      shortcuts[shortcutKey](e);
      return;
    }

    // Handle special cases
    if (key === "Tab") {
      e.preventDefault();
      insertMarkdown("  ");
    }
  };

  // Content change handler with undo support
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    saveToUndoStack(formData.content);
    setFormData({ ...formData, content: newContent });
  };

  // Auto-complete functionality
  const handleAutoComplete = (e) => {
    const textarea = e.target;
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // Auto-complete for common patterns
    const beforeCursor = value.substring(0, cursorPos);
    const lastChar = beforeCursor.charAt(beforeCursor.length - 1);
    
    // Auto-complete parentheses and brackets
    const autoCompletePairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`'
    };
    
    if (autoCompletePairs[lastChar]) {
      const closingChar = autoCompletePairs[lastChar];
      const afterCursor = value.substring(cursorPos);
      const newValue = beforeCursor + closingChar + afterCursor;
      
      saveToUndoStack(formData.content);
      setFormData({ ...formData, content: newValue });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-slate-700 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-6">
              {!isFullscreen && (
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-slate-300 hover:text-white transition-all duration-200 hover:bg-slate-800 px-3 py-2 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <span className="font-medium">Back</span>
                </button>
              )}

              <div className="flex items-center space-x-3 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="font-medium">{wordCount} words</span>
                <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                <span className="font-medium">{readTime} min read</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Enhanced View Mode Toggle */}
              <div className="flex items-center bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 border border-slate-700">
                <button
                  onClick={() => setPreviewMode("edit")}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                    previewMode === "edit"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <EyeOff className="h-4 w-4 inline mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setPreviewMode("split")}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                    previewMode === "split"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <Settings className="h-4 w-4 inline mr-2" />
                  Split
                </button>
                <button
                  onClick={() => setPreviewMode("preview")}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                    previewMode === "preview"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-2" />
                  Preview
                </button>
              </div>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200 border border-slate-700 hover:border-slate-600"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSave}
                  disabled={
                    loading || !formData.title.trim() || !formData.content.trim()
                  }
                  className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : isEdit ? "Update" : "Save Draft"}
                </button>

                <button
                  onClick={() => handleSave(true)}
                  disabled={
                    loading || !formData.title.trim() || !formData.content.trim()
                  }
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center"
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Enhanced Title and Metadata */}
        <div className="mb-8 space-y-6">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-8 rounded-2xl shadow-lg border border-slate-200">
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter your post title..."
              className="w-full text-4xl font-bold border-none outline-none bg-transparent placeholder-slate-400 text-slate-800"
              style={{ fontFamily: "IBM Plex Mono, monospace" }}
            />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add tags (e.g., react, javascript, tutorial)..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                  />
                  <TagIcon className="h-5 w-5 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <span className="font-medium">#{tag}</span>
                    <button
                      onClick={() => removeTag(index)}
                      className="ml-2 text-white hover:text-red-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Enhanced Quick Tag Suggestions */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-slate-600 font-medium">Popular tags:</span>
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
                  className="text-xs px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  #{cat.toLowerCase().replace(/\s+/g, "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Editor Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Editor Pane */}
          {(previewMode === "edit" || previewMode === "split") && (
            <div
              className={`${
                previewMode === "split" ? "lg:col-span-6" : "lg:col-span-9"
              } space-y-4`}
            >
              {/* Enhanced Toolbar */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 markdown-toolbar shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ✨ Markdown Tools
                  </h3>
                  <button
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="flex items-center text-sm text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                    title="Show/Hide Shortcuts"
                  >
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    <span className="font-medium">Shortcuts</span>
                  </button>
                </div>
                
                {/* Shortcuts Panel */}
                {showShortcuts && (
                  <div className="mb-6 p-4 bg-white rounded-xl shortcuts-panel shadow-lg border border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {toolbarButtons.map((button, index) => (
                        <div key={index} className="flex justify-between items-center p-1">
                          <span className="text-gray-600">{button.label}</span>
                          <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-gray-700">
                            {button.shortcut}
                          </kbd>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-1">
                        <span className="text-gray-600">Save Draft</span>
                        <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-gray-700">
                          Ctrl+S
                        </kbd>
                      </div>
                      <div className="flex justify-between items-center p-1">
                        <span className="text-gray-600">Publish</span>
                        <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-gray-700">
                          Ctrl+Enter
                        </kbd>
                      </div>
                      <div className="flex justify-between items-center p-1">
                        <span className="text-gray-600">Undo</span>
                        <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-gray-700">
                          Ctrl+Z
                        </kbd>
                      </div>
                      <div className="flex justify-between items-center p-1">
                        <span className="text-gray-600">Redo</span>
                        <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-gray-700">
                          Ctrl+Y
                        </kbd>
                      </div>
                    </div>
                  </div>
                )}

                {/* Categorized Toolbar */}
                <div className="space-y-4">
                  {/* Headings */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-slate-700 w-20 bg-white px-3 py-1 rounded-lg shadow-sm">Headings:</span>
                    <div className="flex space-x-2">
                      {toolbarButtons.filter(btn => btn.category === "headings").map((button, index) => (
                        <button
                          key={index}
                          onClick={() => insertMarkdown(button.syntax)}
                          className="p-3 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200 hover:border-slate-300"
                          title={`${button.label} (${button.shortcut})`}
                        >
                          <button.icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Formatting */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-slate-700 w-20 bg-white px-3 py-1 rounded-lg shadow-sm">Format:</span>
                    <div className="flex space-x-2">
                      {toolbarButtons.filter(btn => btn.category === "formatting").map((button, index) => (
                        <button
                          key={index}
                          onClick={() => insertMarkdown(button.syntax)}
                          className="p-3 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200 hover:border-slate-300"
                          title={`${button.label} (${button.shortcut})`}
                        >
                          <button.icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lists */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-slate-700 w-20 bg-white px-3 py-1 rounded-lg shadow-sm">Lists:</span>
                    <div className="flex space-x-2">
                      {toolbarButtons.filter(btn => btn.category === "lists").map((button, index) => (
                        <button
                          key={index}
                          onClick={() => insertMarkdown(button.syntax)}
                          className="p-3 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200 hover:border-slate-300"
                          title={`${button.label} (${button.shortcut})`}
                        >
                          <button.icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Media & Links */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-slate-700 w-20 bg-white px-3 py-1 rounded-lg shadow-sm">Media:</span>
                    <div className="flex space-x-2">
                      {toolbarButtons.filter(btn => btn.category === "media").map((button, index) => (
                        <button
                          key={index}
                          onClick={() => insertMarkdown(button.syntax)}
                          className="p-3 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200 hover:border-slate-300"
                          title={`${button.label} (${button.shortcut})`}
                        >
                          <button.icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Blocks */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-slate-700 w-20 bg-white px-3 py-1 rounded-lg shadow-sm">Blocks:</span>
                    <div className="flex space-x-2">
                      {toolbarButtons.filter(btn => btn.category === "blocks").map((button, index) => (
                        <button
                          key={index}
                          onClick={() => insertMarkdown(button.syntax)}
                          className="p-3 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200 hover:border-slate-300"
                          title={`${button.label} (${button.shortcut})`}
                        >
                          <button.icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-slate-700 w-20 bg-white px-3 py-1 rounded-lg shadow-sm">Special:</span>
                    <div className="flex space-x-2">
                      {toolbarButtons.filter(btn => btn.category === "special").map((button, index) => (
                        <button
                          key={index}
                          onClick={() => insertMarkdown(button.syntax)}
                          className="p-3 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200 hover:border-slate-300"
                          title={`${button.label} (${button.shortcut})`}
                        >
                          <button.icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Enhanced Emoji Picker */}
                {showEmojiPicker && (
                  <div className="mt-4 p-4 bg-white rounded-xl emoji-picker shadow-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-700">🎨 Quick Emojis</h4>
                      <button
                        onClick={() => setShowEmojiPicker(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => insertEmoji(emoji)}
                          className="p-2 text-xl hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all duration-200 hover:scale-110"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Content Editor */}
              <div className="bg-white border border-slate-200 rounded-2xl markdown-editor shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">📝 Content Editor</h3>
                </div>
                <textarea
                  id="content-editor"
                  value={formData.content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleAutoComplete}
                  placeholder="Write your post content in Markdown... Start with a heading or paragraph to see the magic happen! ✨"
                  className="w-full h-96 p-8 border-none outline-none resize-none bg-transparent text-slate-700 placeholder-slate-400"
                  style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "16px", lineHeight: "1.6" }}
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
              <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">👁️ Live Preview</h3>
                </div>
                <div className="p-8 prose prose-lg max-w-none">
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

          {/* Enhanced Sidebar */}
          <div
            className={`${
              previewMode === "split" ? "hidden" : "lg:col-span-3"
            } space-y-6`}
          >
            {/* Enhanced Excerpt */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold mb-4 text-slate-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📝 Post Excerpt
              </h3>
              <textarea
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder="Brief description of your post..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-slate-500">
                  {formData.excerpt.length}/160 characters
                </p>
                <div className={`w-16 h-2 rounded-full ${
                  formData.excerpt.length > 140 ? 'bg-red-200' : 
                  formData.excerpt.length > 120 ? 'bg-yellow-200' : 'bg-green-200'
                }`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      formData.excerpt.length > 140 ? 'bg-red-500' : 
                      formData.excerpt.length > 120 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((formData.excerpt.length / 160) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Enhanced Cover Image */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold mb-4 text-slate-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🖼️ Banner Image
              </h3>
              {formData.coverImage ? (
                <div className="relative group">
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-48 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300"
                  />
                  <button
                    onClick={removeCoverImage}
                    className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                    id="cover-image-input"
                  />
                  <label htmlFor="cover-image-input" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium mb-1">
                      {imageUploading ? "Uploading..." : "Click to upload banner image"}
                    </p>
                    <p className="text-sm text-slate-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </label>
                </div>
              )}
            </div>

            {/* Enhanced Markdown Guide */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold mb-6 text-slate-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📚 Markdown Guide
              </h3>
                              <div className="space-y-4 text-sm">
                  {/* Headings */}
                  <div>
                    <h4 className="font-bold text-slate-700 mb-3 text-base">📋 Headings</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <span className="font-medium text-slate-700"># Heading 1</span>
                        <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+1</kbd>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <span className="font-medium text-slate-700">## Heading 2</span>
                        <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+2</kbd>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <span className="font-medium text-slate-700">### Heading 3</span>
                        <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+3</kbd>
                      </div>
                    </div>
                  </div>

                {/* Text Formatting */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 text-base">🎨 Text Formatting</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <span className="font-bold text-slate-700">**Bold**</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+B</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <span className="italic text-slate-700">*Italic*</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+I</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <span className="line-through text-slate-700">~~Strikethrough~~</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+X</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <code className="bg-slate-200 px-2 py-1 rounded-lg text-slate-700">`Code`</code>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+`</kbd>
                    </div>
                  </div>
                </div>

                {/* Lists */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 text-base">📝 Lists</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <span className="font-medium text-slate-700">- Bullet List</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+L</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <span className="font-medium text-slate-700">1. Numbered List</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+O</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <span className="font-medium text-slate-700">- [ ] Task List</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+T</kbd>
                    </div>
                  </div>
                </div>

                {/* Links & Media */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 text-base">🔗 Links & Media</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <span className="text-blue-600 underline font-medium">[Link](url)</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+K</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <span className="font-medium text-slate-700">![Image](url)</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+I</kbd>
                    </div>
                  </div>
                </div>

                {/* Blocks */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 text-base">📦 Blocks</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                      <span className="border-l-4 border-yellow-400 pl-2 font-medium text-slate-700">&gt; Quote</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+Q</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                      <span className="font-medium text-slate-700">``` Code Block ```</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+C</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                      <span className="font-medium text-slate-700">| Table |</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+M</kbd>
                    </div>
                  </div>
                </div>

                {/* Special */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 text-base">✨ Special</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100">
                      <span className="font-medium text-slate-700">--- Horizontal Rule</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+H</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100">
                      <span className="font-medium text-slate-700">@username Mention</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+@</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100">
                      <span className="font-medium text-slate-700">😀 Emoji Picker</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Shift+E</kbd>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 text-base">⚡ Actions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">Save Draft</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+S</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">Publish</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Enter</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">Indent</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Tab</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">Outdent</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Shift+Tab</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">Undo</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Z</kbd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">Redo</span>
                      <kbd className="text-xs bg-white px-2 py-1 rounded-lg shadow-sm border">Ctrl+Y</kbd>
                    </div>
                  </div>
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
