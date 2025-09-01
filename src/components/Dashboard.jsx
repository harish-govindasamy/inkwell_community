import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/SupabaseAuthContext";
import { postService } from "../services/postService";
import { useToast } from "./ToastProvider";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Eye,
  Heart,
  MessageSquare,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  Plus,
  RefreshCw,
  Download,
  Bookmark,
  Share2,
  Menu,
  X,
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalBookmarks: 0,
    avgReadTime: 0,
    engagementRate: 0,
    publishingStreak: 0,
    topPerformingPost: null,
    recentActivity: [],
    chartData: {
      views: [],
      engagement: [],
      posts: [],
    },
  });
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState("views"); // views, engagement, posts

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      setLoading(true);

      // Load user's posts from Supabase
      const { data: postsData, error: postsError } =
        await postService.getUserPosts(user.id);

      if (postsError) {
        toast?.error("Failed to load posts data");
        console.error("Error loading posts:", postsError);
        return;
      }

      const userPosts = postsData || [];
      setPosts(userPosts);

      // Calculate comprehensive analytics
      const publishedPosts = userPosts.filter(
        (post) => post.status === "published"
      );
      const draftPosts = userPosts.filter((post) => post.status === "draft");

      const totalViews = publishedPosts.reduce(
        (sum, post) => sum + (post.view_count || 0),
        0
      );
      const totalLikes = publishedPosts.reduce(
        (sum, post) => sum + (post.like_count || 0),
        0
      );
      const totalComments = publishedPosts.reduce(
        (sum, post) => sum + (post.comment_count || 0),
        0
      );
      const totalBookmarks = publishedPosts.reduce(
        (sum, post) => sum + (post.bookmark_count || 0),
        0
      );

      const avgReadTime =
        publishedPosts.length > 0
          ? publishedPosts.reduce(
              (sum, post) => sum + (post.reading_time || 0),
              0
            ) / publishedPosts.length
          : 0;

      const engagementRate =
        totalViews > 0
          ? ((totalLikes + totalComments + totalBookmarks) / totalViews) * 100
          : 0;

      // Find top performing post
      const topPost = publishedPosts.reduce((top, post) => {
        const score =
          (post.view_count || 0) +
          (post.like_count || 0) * 2 +
          (post.comment_count || 0) * 3;
        const topScore =
          (top?.view_count || 0) +
          (top?.like_count || 0) * 2 +
          (top?.comment_count || 0) * 3;
        return score > topScore ? post : top;
      }, null);

      // Calculate publishing streak
      const streak = calculatePublishingStreak(publishedPosts);

      // Generate chart data
      const chartData = generateChartData(publishedPosts, timeRange);

      setAnalytics({
        totalPosts: userPosts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        totalViews,
        totalLikes,
        totalComments,
        totalBookmarks,
        avgReadTime: Math.round(avgReadTime * 10) / 10,
        engagementRate: Math.round(engagementRate * 100) / 100,
        publishingStreak: streak,
        topPerformingPost: topPost,
        chartData,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast?.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, timeRange, toast]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const generateChartData = (posts, range) => {
    const days =
      range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const labels = [];
    const viewsData = [];
    const likesData = [];
    const commentsData = [];
    const postsData = [];

    // Generate date labels
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      labels.push(format(date, "MMM dd"));

      // Calculate metrics for this date
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayPosts = posts.filter((post) => {
        const postDate = parseISO(post.published_at || post.created_at);
        return postDate >= dayStart && postDate < dayEnd;
      });

      viewsData.push(
        dayPosts.reduce((sum, post) => sum + (post.view_count || 0), 0)
      );
      likesData.push(
        dayPosts.reduce((sum, post) => sum + (post.like_count || 0), 0)
      );
      commentsData.push(
        dayPosts.reduce((sum, post) => sum + (post.comment_count || 0), 0)
      );
      postsData.push(dayPosts.length);
    }

    return {
      labels,
      views: viewsData,
      likes: likesData,
      comments: commentsData,
      posts: postsData,
    };
  };

  const calculatePublishingStreak = (posts) => {
    if (posts.length === 0) return 0;

    const sortedPosts = posts.sort(
      (a, b) =>
        new Date(b.published_at || b.created_at) -
        new Date(a.published_at || a.created_at)
    );

    let streak = 0;
    let lastPostDate = null;

    for (let post of sortedPosts) {
      const postDate = parseISO(post.published_at || post.created_at);

      if (!lastPostDate) {
        streak = 1;
        lastPostDate = postDate;
      } else {
        const daysDiff = Math.floor(
          (lastPostDate - postDate) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 7) {
          streak += 1;
          lastPostDate = postDate;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  const getReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(" ").length;
    return Math.ceil(words / wordsPerMinute);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Chart configurations
  const getViewsChartData = () => ({
    labels: analytics.chartData.labels,
    datasets: [
      {
        label: "Views",
        data: analytics.chartData.views,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  });

  const getEngagementChartData = () => ({
    labels: analytics.chartData.labels,
    datasets: [
      {
        label: "Likes",
        data: analytics.chartData.likes,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: false,
      },
      {
        label: "Comments",
        data: analytics.chartData.comments,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: false,
      },
    ],
  });

  const getPostsChartData = () => ({
    labels: analytics.chartData.labels,
    datasets: [
      {
        label: "Posts Published",
        data: analytics.chartData.posts,
        backgroundColor: "rgba(147, 51, 234, 0.8)",
        borderColor: "rgb(147, 51, 234)",
        borderWidth: 1,
      },
    ],
  });

  const getEngagementPieData = () => ({
    labels: ["Likes", "Comments", "Bookmarks", "Views"],
    datasets: [
      {
        data: [
          analytics.totalLikes,
          analytics.totalComments,
          analytics.totalBookmarks,
          analytics.totalViews,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(59, 130, 246, 0.8)",
        ],
        borderColor: [
          "rgb(239, 68, 68)",
          "rgb(34, 197, 94)",
          "rgb(251, 191, 36)",
          "rgb(59, 130, 246)",
        ],
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  // Utility components
  const Card = ({ children, className = "", hover = false, onClick }) => (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${
        hover ? "hover:shadow-md transition-shadow cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  const Button = ({
    children,
    variant = "primary",
    size = "medium",
    icon,
    as: Component = "button",
    to,
    onClick,
    disabled,
    className = "",
  }) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
      primary:
        "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-400",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
      outline:
        "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    };

    const sizes = {
      small: "px-2 py-1.5 text-sm sm:px-3",
      medium: "px-3 py-2 text-sm sm:px-4",
      large: "px-4 py-2.5 sm:px-6 sm:py-3 text-base sm:text-lg",
    };

    const classes = `${baseClasses} ${variants[variant]} ${
      sizes[size]
    } ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

    if (Component === Link) {
      return (
        <Component to={to} className={classes}>
          {icon && <span className="mr-1 sm:mr-2 flex-shrink-0">{icon}</span>}
          <span className="hidden sm:inline">{children}</span>
          <span className="sm:hidden">
            {typeof children === "string" && children.length > 10
              ? children.slice(0, 8) + "..."
              : children}
          </span>
        </Component>
      );
    }

    return (
      <Component className={classes} onClick={onClick} disabled={disabled}>
        {icon && <span className="mr-1 sm:mr-2 flex-shrink-0">{icon}</span>}
        <span className="hidden sm:inline">{children}</span>
        <span className="sm:hidden">
          {typeof children === "string" && children.length > 10
            ? children.slice(0, 8) + "..."
            : children}
        </span>
      </Component>
    );
  };

  const Badge = ({ children, variant = "default" }) => {
    const variants = {
      default: "bg-gray-100 text-gray-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}
      >
        {children}
      </span>
    );
  };

  const Skeleton = ({
    width = "100%",
    height = "16px",
    lines = 1,
    className = "",
  }) => {
    if (lines > 1) {
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 rounded"
              style={{
                width: i === lines - 1 ? "75%" : "100%",
                height: height,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{ width, height }}
      />
    );
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "blue",
    loading = false,
  }) => (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
          {loading ? (
            <>
              <Skeleton width="60px" height="14px" />
              <Skeleton width="80px" height="24px" />
            </>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {title}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {typeof value === "string" ? value : formatNumber(value)}
              </p>
            </>
          )}
          {trend && !loading && (
            <div
              className={`flex items-center text-xs sm:text-sm ${
                trend > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 flex-shrink-0" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg bg-${color}-100 flex-shrink-0`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  const QuickAction = ({
    icon: Icon,
    title,
    description,
    action,
    color = "blue",
  }) => (
    <Card hover className="cursor-pointer" onClick={action}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg bg-${color}-100 flex-shrink-0`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${color}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <Skeleton
              width="150px"
              height="24px"
              className="sm:w-200px sm:h-32px"
            />
            <Skeleton
              width="200px"
              height="14px"
              className="mt-2 sm:w-300px sm:h-16px"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton lines={3} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Welcome back,{" "}
                {profile?.full_name || user?.email?.split("@")[0] || "Writer"}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Here's what's happening with your content
              </p>
            </div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input text-sm w-full sm:w-auto"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={loadDashboardData}
                  disabled={refreshing}
                  icon={
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  }
                >
                  Refresh
                </Button>

                <Button
                  as={Link}
                  to="/create"
                  icon={<Plus className="h-4 w-4" />}
                  size="small"
                >
                  New Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Posts"
            value={analytics.totalPosts}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Total Views"
            value={analytics.totalViews}
            icon={Eye}
            trend={12.5}
            color="green"
          />
          <StatCard
            title="Engagement Rate"
            value={`${analytics.engagementRate}%`}
            icon={Activity}
            trend={-2.1}
            color="purple"
          />
          <StatCard
            title="Publishing Streak"
            value={analytics.publishingStreak}
            icon={Target}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Analytics Charts */}
            <Card>
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Performance Analytics
                </h2>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <Button
                    variant={chartType === "views" ? "primary" : "ghost"}
                    size="small"
                    onClick={() => setChartType("views")}
                    icon={<Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                  >
                    Views
                  </Button>
                  <Button
                    variant={chartType === "engagement" ? "primary" : "ghost"}
                    size="small"
                    onClick={() => setChartType("engagement")}
                    icon={<Activity className="h-3 w-3 sm:h-4 sm:w-4" />}
                  >
                    Engagement
                  </Button>
                  <Button
                    variant={chartType === "posts" ? "primary" : "ghost"}
                    size="small"
                    onClick={() => setChartType("posts")}
                    icon={<BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />}
                  >
                    Posts
                  </Button>
                </div>
              </div>

              <div className="h-64 sm:h-80">
                {chartType === "views" && (
                  <Line data={getViewsChartData()} options={chartOptions} />
                )}
                {chartType === "engagement" && (
                  <Line
                    data={getEngagementChartData()}
                    options={chartOptions}
                  />
                )}
                {chartType === "posts" && (
                  <Bar data={getPostsChartData()} options={chartOptions} />
                )}
              </div>

              <div className="mt-4 flex justify-center">
                <p className="text-xs sm:text-sm text-gray-600 text-center">
                  {chartType === "views" && "Daily views over time"}
                  {chartType === "engagement" && "Likes and comments over time"}
                  {chartType === "posts" && "Posts published over time"}
                </p>
              </div>
            </Card>

            {/* Engagement Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Engagement Breakdown
                </h3>
                <div className="h-48 sm:h-64">
                  <Doughnut
                    data={getEngagementPieData()}
                    options={pieOptions}
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Performance Metrics
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 truncate">
                        Total Likes
                      </span>
                    </div>
                    <span className="font-semibold text-sm sm:text-lg flex-shrink-0">
                      {formatNumber(analytics.totalLikes)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 truncate">
                        Total Comments
                      </span>
                    </div>
                    <span className="font-semibold text-sm sm:text-lg flex-shrink-0">
                      {formatNumber(analytics.totalComments)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 truncate">
                        Total Bookmarks
                      </span>
                    </div>
                    <span className="font-semibold text-sm sm:text-lg flex-shrink-0">
                      {formatNumber(analytics.totalBookmarks)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 truncate">
                        Avg. Read Time
                      </span>
                    </div>
                    <span className="font-semibold text-sm sm:text-lg flex-shrink-0">
                      {analytics.avgReadTime} min
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 truncate">
                        Engagement Rate
                      </span>
                    </div>
                    <span className="font-semibold text-sm sm:text-lg flex-shrink-0">
                      {analytics.engagementRate}%
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Posts */}
            <Card>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Recent Posts
                </h2>
                <Link
                  to="/posts"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium self-start"
                >
                  View all →
                </Link>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {posts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 sm:p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/post/${post.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 block truncate text-sm sm:text-base"
                      >
                        {post.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{post.views || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{post.comments || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{getReadingTime(post.content)} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 self-start sm:self-center">
                      <Badge
                        variant={
                          post.status === "published" ? "success" : "default"
                        }
                      >
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {posts.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      No posts yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                      Start writing your first post to see analytics
                    </p>
                    <Button as={Link} to="/create">
                      Create Your First Post
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <Card>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <QuickAction
                  icon={Plus}
                  title="Create New Post"
                  description="Start writing your next article"
                  action={() => (window.location.href = "/create")}
                  color="blue"
                />
                <QuickAction
                  icon={BarChart3}
                  title="View Analytics"
                  description="Deep dive into your performance"
                  action={() => {}}
                  color="green"
                />
                <QuickAction
                  icon={Download}
                  title="Export Data"
                  description="Download your content backup"
                  action={() => {}}
                  color="purple"
                />
              </div>
            </Card>

            {/* Top Performing Post */}
            {analytics.topPerformingPost && (
              <Card>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Top Performing Post
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      Best performer this period
                    </span>
                  </div>

                  <Link
                    to={`/post/${analytics.topPerformingPost.id}`}
                    className="block font-medium text-gray-900 hover:text-blue-600 text-sm sm:text-base line-clamp-2"
                  >
                    {analytics.topPerformingPost.title}
                  </Link>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Views</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatNumber(analytics.topPerformingPost.views || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Likes</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatNumber(analytics.topPerformingPost.likes || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Comments
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatNumber(
                          analytics.topPerformingPost.comments || 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Writing Goals */}
            <Card>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Writing Goals
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Monthly Posts
                    </span>
                    <span className="text-xs sm:text-sm font-medium">
                      {analytics.totalPosts}/10
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (analytics.totalPosts / 10) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Engagement Goal
                    </span>
                    <span className="text-xs sm:text-sm font-medium">
                      {analytics.engagementRate}%/5%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (analytics.engagementRate / 5) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
