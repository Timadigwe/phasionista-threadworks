#!/usr/bin/env node

/**
 * Database Setup Script
 * This script applies the database schema to your Supabase project
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250120000000_initial_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Database Migration Script');
console.log('============================');
console.log('');
console.log('To set up your database, you have a few options:');
console.log('');
console.log('1. 🎯 SUPABASE DASHBOARD (Recommended)');
console.log('   - Go to https://supabase.com/dashboard');
console.log('   - Select your project');
console.log('   - Click "SQL Editor" in the sidebar');
console.log('   - Copy and paste the SQL below');
console.log('   - Click "Run" to execute');
console.log('');
console.log('2. 🔧 SUPABASE CLI');
console.log('   - Install: npm install -g supabase');
console.log('   - Run: supabase init');
console.log('   - Run: supabase link --project-ref YOUR_PROJECT_REF');
console.log('   - Run: supabase db push');
console.log('');
console.log('📄 SQL Migration:');
console.log('===================');
console.log('');
console.log(migrationSQL);
console.log('');
console.log('✅ After running this SQL, your database will have:');
console.log('   - profiles table (for user data)');
console.log('   - clothes table (for clothing items)');
console.log('   - favorites table (for user favorites)');
console.log('   - reviews table (for product reviews)');
console.log('   - Row Level Security (RLS) policies');
console.log('   - Automatic profile creation on signup');
console.log('');
console.log('🚀 Once the database is set up, your app should work properly!');
