import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'

const supabase = createClient(config.supabaseUrl, config.supabaseKey)

async function debugPermissions() {
  console.log('🔍 Debugging permissions and access...')
  
  try {
    // Test 1: Try to get a signed URL for a file (this tests read permissions)
    console.log('\n🔐 Testing read permissions...')
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('Outlines')
      .createSignedUrl('test-file.pdf', 60)
    
    if (urlError) {
      console.log('❌ Cannot create signed URL (expected if file doesn\'t exist):', urlError.message)
    } else {
      console.log('✅ Can create signed URLs')
    }
    
    // Test 2: Try different listing approaches
    console.log('\n📁 Testing different listing approaches...')
    
    // Approach 1: List with no limit
    const { data: data1, error: error1 } = await supabase.storage
      .from('Outlines')
      .list('', { limit: 1000 })
    console.log('List with limit 1000:', data1?.length || 0, 'items')
    
    // Approach 2: List with offset
    const { data: data2, error: error2 } = await supabase.storage
      .from('Outlines')
      .list('', { limit: 100, offset: 0 })
    console.log('List with offset 0:', data2?.length || 0, 'items')
    
    // Approach 3: Try to list with different options
    const { data: data3, error: error3 } = await supabase.storage
      .from('Outlines')
      .list('', { 
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })
    console.log('List with sort:', data3?.length || 0, 'items')
    
    // Test 3: Try to access common folder names
    console.log('\n📁 Testing common folder names...')
    const commonFolders = ['out', 'Out', 'OUT', 'files', 'documents', 'outlines']
    
    for (const folder of commonFolders) {
      const { data: folderData, error: folderError } = await supabase.storage
        .from('Outlines')
        .list(folder, { limit: 5 })
      
      if (!folderError && folderData && folderData.length > 0) {
        console.log(`✅ Found folder "${folder}" with ${folderData.length} items:`, folderData.map(item => item.name))
      } else {
        console.log(`❌ Folder "${folder}" not found or empty`)
      }
    }
    
    // Test 4: Check if we can see any files at all
    console.log('\n📄 Looking for any files in root...')
    if (data1 && data1.length > 0) {
      console.log('Files found in root:')
      data1.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} (${item.metadata?.size || 'unknown size'})`)
      })
    } else {
      console.log('No files found in root')
    }
    
  } catch (error) {
    console.error('❌ General error:', error)
  }
}

debugPermissions()
