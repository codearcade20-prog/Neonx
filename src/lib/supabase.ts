import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kothodgkhclbqezzrjdo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdGhvZGdraGNsYnFlenpyamRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDkxNzksImV4cCI6MjEwNDA4NTE3OX0.0oV-26MjQV9cHrD9-sEaPPFAnl1tLIHEuUKh4TYyNAI';

export const supabase = createClient(supabaseUrl, supabaseKey);
