import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'

const supabase = createClient(config.supabaseUrl, config.supabaseKey)

async function debugBucket() {
  console.log('🔍 Debugging bucket access...')
  console.log('Config:', {
    supabaseUrl: config.supabaseUrl,
    bucketName: config.bucketName,
    bucketFolder: config.bucketFolder
  })
  
  try {
    // Try to list buckets with more details
    console.log('\n📦 Listing all buckets:')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError)
      console.error('Error details:', bucketError.message)
    } else {
      console.log('Buckets found:', buckets.length)
      buckets.forEach((bucket, index) => {
        console.log(`  ${index + 1}. ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })
    }
    
    // Try to access the Outlines bucket directly
    console.log('\n📁 Trying to access Outlines bucket directly:')
    const { data: directData, error: directError } = await supabase.storage
      .from('Outlines')
      .list('', { limit: 5 })
    
    if (directError) {
      console.error('❌ Error accessing Outlines bucket:', directError)
      console.error('Error details:', directError.message)
    } else {
      console.log('✅ Successfully accessed Outlines bucket')
      console.log('Contents:', directData)
    }
    
    // Try to access the 'out' folder
    console.log('\n📁 Trying to access "out" folder:')
    const { data: outData, error: outError } = await supabase.storage
      .from('Outlines')
      .list('out', { limit: 5 })
    
    if (outError) {
      console.error('❌ Error accessing "out" folder:', outError)
      console.error('Error details:', outError.message)
    } else {
      console.log('✅ Successfully accessed "out" folder')
      console.log('Contents:', outData)
    }
    
  } catch (error) {
    console.error('❌ General error:', error)
    console.error('Error stack:', error.stack)
  }
}

debugBucket()
