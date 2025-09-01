# Supabase Setup Guide for InkWell

## Current Issue
The application is failing to connect to Supabase because the project URL `lziarqkobgwrzejpzlcj.supabase.co` cannot be resolved. This indicates that either:
- The Supabase project doesn't exist
- The project has been deleted or suspended
- The project ID is incorrect

## Solution Steps

### Option 1: Create a New Supabase Project (Recommended)

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Sign in or create an account**
3. **Click "New Project"**
4. **Choose your organization**
5. **Enter project details:**
   - Name: `inkwell` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
6. **Click "Create new project"**
7. **Wait for the project to be created (usually 1-2 minutes)**

### Option 2: Get Project Credentials

1. **In your Supabase dashboard, go to your project**
2. **Navigate to Settings → API**
3. **Copy the following values:**
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Option 3: Update Environment Variables

1. **Create a `.env` file in your project root** (if it doesn't exist)
2. **Add your Supabase credentials:**

```env
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Option 4: Set Up Database Schema

1. **In your Supabase dashboard, go to SQL Editor**
2. **Run the schema from `supabase/schema.sql`**
3. **Run the functions from `supabase/functions.sql`**

### Option 5: Configure Storage (Optional)

1. **Go to Storage in your Supabase dashboard**
2. **Create a new bucket called `avatars`**
3. **Set the bucket to public**
4. **Configure RLS policies if needed**

## Testing the Connection

After setting up, test your connection:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Try to sign up or sign in**
3. **Check the browser console for any errors**

## Troubleshooting

### If you still get connection errors:

1. **Check your internet connection**
2. **Verify the Supabase URL is correct**
3. **Ensure the anon key is correct**
4. **Check if your Supabase project is active**
5. **Try accessing the Supabase dashboard directly**

### Common Issues:

- **CORS errors**: Make sure your domain is allowed in Supabase settings
- **RLS errors**: Check that your Row Level Security policies are set up correctly
- **Auth errors**: Verify that email confirmation is configured properly

## Alternative: Use Local Development

If you want to develop without Supabase temporarily:

1. **Comment out Supabase-related code**
2. **Use localStorage for data persistence**
3. **Implement mock authentication**

## Need Help?

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Community**: https://github.com/supabase/supabase/discussions
- **Create an issue** in this repository if you need assistance

---

**Note**: The current Supabase project (`lziarqkobgwrzejpzlcj`) appears to be invalid or inactive. You'll need to create a new project to use the full functionality of InkWell.
