# 🚀 InkWell Setup Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd inkWell
npm install
```

### 2. Set up Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your credentials** from Settings > API:
   - Project URL
   - Anon Key

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Database

1. Go to your Supabase SQL Editor
2. Run the schema from `supabase/schema.sql`
3. Run the functions from `supabase/functions.sql`

### 5. Start Development

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── Home.jsx        # Main feed
│   ├── CreatePost.jsx  # Post creation
│   ├── Dashboard.jsx   # User dashboard
│   └── PostView.jsx    # Individual post view
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── services/           # API services
├── lib/                # Utility libraries
└── routes/             # Routing configuration
```

## 🔧 Configuration

### Supabase Setup

1. **Enable Row Level Security (RLS)** on all tables
2. **Set up storage buckets** for avatars and post images
3. **Configure authentication** settings in Supabase dashboard

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |

## 🚨 Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure `.env` file is in the root directory
   - Restart the development server

2. **Supabase connection errors**
   - Verify your credentials in `.env`
   - Check if your Supabase project is active

3. **Database schema errors**
   - Run the schema files in the correct order
   - Check Supabase logs for detailed errors

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [React documentation](https://react.dev)
- Open an issue in the repository

## 🎯 Next Steps

After setup, you can:

1. **Customize the UI** - Modify components in `src/components/`
2. **Add features** - Extend the functionality
3. **Deploy** - Use Vercel, Netlify, or your preferred platform
4. **Scale** - Upgrade your Supabase plan as needed

## 📝 License

This project is open source and available under the MIT License.
