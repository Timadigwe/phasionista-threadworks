# Database Setup Instructions

## Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the migration script**
   - Copy the contents of `supabase/migrations/20250120000000_initial_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

## Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase in your project**:
   ```bash
   cd /home/tim/PHASION/phasionista-threadworks
   supabase init
   ```

3. **Link to your remote project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Apply the migration**:
   ```bash
   supabase db push
   ```

## Option 3: Manual SQL Execution

If you have direct database access, you can run the SQL commands directly in your database.

## Verification

After applying the migration, you should see these tables in your Supabase dashboard:
- `profiles`
- `clothes` 
- `favorites`
- `reviews`

## Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
