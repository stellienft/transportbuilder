import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://elmxkhzqptuxhekywlzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsbXhraHpxcHR1eGhla3l3bHp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE2NDAxNSwiZXhwIjoyMDk0NzQwMDE1fQ.tJRHbnsiC-jQI7QL4Di7T5HU35QX_c18jranUkZB7ZE'
);

// List existing policies on the bucket
const { data, error } = await supabase.storage.listPolicies('site-assets');
console.log('Existing policies:', JSON.stringify(data, null, 2));
if (error) console.log('Error listing policies:', error);
