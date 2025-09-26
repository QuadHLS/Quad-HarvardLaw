import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'

const supabase = createClient(config.supabaseUrl, config.supabaseKey)

async function testBucket() {
  console.log('🔍 Testing bucket access...')
  
  try {
    // Test 1: List root of bucket
    console.log('\n📁 Root of bucket:')
    const { data: rootData, error: rootError } = await supabase.storage
      .from(config.bucketName)
      .list('', { limit: 10 })
    
    if (rootError) {
      console.error('❌ Error accessing bucket root:', rootError)
      return
    }
    
    console.log('Root contents:', rootData)
    
    // Test 2: List 'out' folder
    console.log('\n📁 Contents of "out" folder:')
    const { data: outData, error: outError } = await supabase.storage
      .from(config.bucketName)
      .list(config.bucketFolder, { limit: 10 })
    
    if (outError) {
      console.error('❌ Error accessing "out" folder:', outError)
      return
    }
    
    console.log('Out folder contents:', outData)
    
    // Test 3: Try to list a specific path if we find folders
    if (outData && outData.length > 0) {
      const firstFolder = outData[0]
      if (firstFolder.name !== '.emptyFolderPlaceholder') {
        console.log(`\n📁 Contents of "${firstFolder.name}" folder:`)
        const { data: classData, error: classError } = await supabase.storage
          .from(config.bucketName)
          .list(`${config.bucketFolder}/${firstFolder.name}`, { limit: 10 })
        
        if (classError) {
          console.error('❌ Error accessing class folder:', classError)
        } else {
          console.log('Class folder contents:', classData)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error)
  }
}

testBucket()
