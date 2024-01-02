// supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vjbmkzimaoubfteyjzfi.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYm1remltYW91YmZ0ZXlqemZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzk0OTY2MjMsImV4cCI6MTk5NTA3MjYyM30.mN6FL0KefdMjp5ShwvsCPHv0vwRoJLwb7VWWW2gDuVA'
export const supabase = createClient(supabaseUrl, supabaseKey)
