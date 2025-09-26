import { createClient } from '@supabase/supabase-js'

// Try with service role key (more permissions)
const supabaseUrl = 'https://ujsnnvdbujguiejhxuds.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqc25udmRidWpndWllamh4dWRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkwNjMyOSwiZXhwIjoyMDczNDgyMzI5fQ.A8HKj1JrItYPxOiufvtdqr1U_MATQF1clYZGvF63oKY'

const supabase = createClient(supabaseUrl, serviceKey)

async function testWithServiceKey() {
  console.log('🔍 Testing with service role key...')
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error:', error)
    } else {
      console.log('📦 Buckets found:', buckets.length)
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name}`)
      })
    }
    
    // Try to list Outlines bucket contents
    const { data: contents, error: contentsError } = await supabase.storage
      .from('Outlines')
      .list('', { limit: 100 })
    
    if (contentsError) {
      console.error('❌ Error listing contents:', contentsError)
    } else {
      console.log('📁 Contents found:', contents?.length || 0)
      if (contents && contents.length > 0) {
        contents.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.name}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error)
  }
}

console.log('⚠️  This script needs your SERVICE ROLE KEY to run')
console.log('Go to Supabase Dashboard → Settings → API → service_role key')
testWithServiceKey()
