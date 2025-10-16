-- Simple KYC Storage Setup (No RLS modifications)
-- This approach works with standard Supabase permissions

-- Create kyc-documents storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: RLS policies for storage.objects are typically managed through the Supabase Dashboard
-- Go to Authentication > Policies > storage.objects to set up policies manually
