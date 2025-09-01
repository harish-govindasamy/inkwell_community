import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Bookmark,
  Tag,
  Calendar,
  Star,
  Coffee,
  Zap
} from 'lucide-react';

const Sidebar = () => {
  const [trendingTags, setTrendingTags] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 1,
    totalPosts: 0,
    totalReactions: 0
  });

  useEffect(() => {
    // Generate trending tags based on posts
    const savedPosts = localStorage.getItem('inkwell_posts');
    if (savedPosts) {
      const posts = JSON.parse(savedPosts);
      const tagCount = {};
      
      posts.forEach(post => {
        if (post.tags) {
          post.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      });
      
      const trending = Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
      
      setTrendingTags(trending);
      
      // Calculate community stats
      const totalReactions = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
      setCommunityStats({
        totalMembers: 1, // For demo, could expand with actual user count
        totalPosts: posts.filter(p => p.status === 'published').length,
        totalReactions
      });
    }
  }, []);

  const communityLinks = [
    { title: 'Code of Conduct', icon: Star },
    { title: 'Privacy Policy', icon: Users },
    { title: 'Terms of Use', icon: MessageSquare },
    { title: 'Contact', icon: Coffee },
  ];

  return (
    <div className="space-y-6">
      {/* InkWell Community Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg font-bold">I</span>
          </div>
          <h3 className="font-semibold text-gray-900">InkWell Community</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          A place where developers share knowledge, stay up-to-date, and grow their careers.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Members</span>
            <span className="font-medium">{communityStats.totalMembers.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Posts published</span>
            <span className="font-medium">{communityStats.totalPosts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Reactions</span>
            <span className="font-medium">{communityStats.totalReactions}</span>
          </div>
        </div>
      </div>

      {/* Trending Tags */}
      {trendingTags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="font-semibold text-gray-900">Trending Tags</h3>
          </div>
          <div className="space-y-2">
            {trendingTags.map(({ tag, count }) => (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                  #{tag}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center">
              <Bookmark className="h-4 w-4 mr-3 text-yellow-500" />
              <span>Reading List</span>
            </div>
            <span className="text-xs text-gray-500">0</span>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-3 text-blue-500" />
              <span>Tags Following</span>
            </div>
            <span className="text-xs text-gray-500">0</span>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-3 text-green-500" />
              <span>Following</span>
            </div>
            <span className="text-xs text-gray-500">0</span>
          </button>
        </div>
      </div>

      {/* Community Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Community</h3>
        <div className="space-y-2">
          {communityLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.title}
                className="w-full flex items-center p-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-left"
              >
                <Icon className="h-4 w-4 mr-3" />
                {link.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="h-6 w-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">I</span>
            </div>
            <span className="text-sm font-medium text-gray-900">InkWell</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Made with ❤️ by developers, for developers
          </p>
          <p className="text-xs text-gray-400">
            © 2025 InkWell Community
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
