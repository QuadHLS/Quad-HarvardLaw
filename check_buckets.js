import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'

const supabase = createClient(config.supabaseUrl, config.supabaseKey)

async function checkBuckets() {
  console.log('🔍 Checking available buckets...')
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error listing buckets:', error)
      return
    }
    
    console.log('📦 Available buckets:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
    })
    
    // Check if our target bucket exists
    const targetBucket = buckets.find(b => b.name === config.bucketName)
    if (targetBucket) {
      console.log(`\n✅ Found target bucket: ${config.bucketName}`)
    } else {
      console.log(`\n❌ Target bucket "${config.bucketName}" not found`)
    }
    
  } catch (error) {
    console.error('❌ General error:', error)
  }
}

checkBuckets()
