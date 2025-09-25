import { supabase } from '../lib/supabase';

export async function testStorageAccess(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    console.log('Testing storage bucket access...');
    
    // First, let's check what buckets exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return { 
        success: false, 
        message: `Error listing buckets: ${bucketsError.message}` 
      };
    }

    console.log('Available buckets:', buckets);
    const bucketNames = buckets?.map(b => b.name) || [];
    
    // Try to list the root of the Outlines bucket
    const { data, error } = await supabase.storage
      .from('Outlines')
      .list('', {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('Storage access error:', error);
      return { 
        success: false, 
        message: `Storage access error: ${error.message}. Available buckets: ${bucketNames.join(', ')}` 
      };
    }

    console.log('Storage access successful. Found items:', data);
    
    // If no items in root, let's check if there are any files at all
    let totalFiles = 0;
    if (data && data.length > 0) {
      // Check if any of these are folders and count files recursively
      for (const item of data) {
        if (!item.metadata?.mimetype) {
          // This is likely a folder, let's check it
          const { data: subItems } = await supabase.storage
            .from('Outlines')
            .list(item.name, { limit: 100 });
          
          if (subItems) {
            totalFiles += subItems.length;
            console.log(`Found ${subItems.length} items in folder: ${item.name}`);
          }
        } else {
          totalFiles++;
        }
      }
    }
    
    return { 
      success: true, 
      message: `Successfully accessed storage bucket. Found ${data?.length || 0} items in root folder. Available buckets: ${bucketNames.join(', ')}. Total files found: ${totalFiles}`,
      data: data
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
