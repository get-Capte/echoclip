import { promises as fs } from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vjbmkzimaoubfteyjzfi.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYm1remltYW91YmZ0ZXlqemZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3OTQ5NjYyMywiZXhwIjoxOTk1MDcyNjIzfQ.2IfpavrCX1ItCEBicweDxOW-SeR1pTnPyF5d5Z6_AoM'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function addVideoEntry(videoUrl, srtFilePath, influencerId) {
  try {
    // Lire le contenu du fichier SRT
    const srtContent = await fs.readFile(srtFilePath, 'utf-8')

    // Ajouter une entrée dans la table 'videos'
    const { data, error } = await supabase
      .from('videos')
      .insert([{ url: videoUrl, srt: srtContent, influencerID: influencerId }])

    if (error) {
      throw error
    }

    console.log('Row added:', data)
  } catch (err) {
    console.error('Error while adding rows:', err)
  }
}

// Exemple d'utilisation
addVideoEntry(
  'https://storage.googleapis.com/echoclip/Pourquoi%20Stripe%20fait%20sauter%20ton%20compte%20%20%23tuganbara%20%23stripe%20%23marketing.mp4',
  '/Users/gabrieldelattre/Downloads/Pourquoi Stripe fait sauter ton compte  -tuganbara -stripe -marketing.fr-FR.srt',
  123
)
