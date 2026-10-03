/* =====================================
   CẤU HÌNH
===================================== */

// Supabase
export const SUPABASE_URL = 'https://yiawgxxdnzmxhxwsqlhs.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYXdneHhkbnpteGh4d3NxbGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5ODQwNTAsImV4cCI6MjEwNjU2MDA1MH0.VlEu0NnjfdKCqQK_F-smLWeuIPcG7NfCiOj7w-HgKW0';

// Khởi tạo Supabase client
export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Local storage keys
export const LEARNED_KEY = "ykhoahub_learned";
export const DASHBOARD_KEY = "ykhoahub_dashboard_subjects";