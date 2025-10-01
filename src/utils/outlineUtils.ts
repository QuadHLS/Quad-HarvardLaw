import { supabase } from '../lib/supabase';
import type { Outline } from '../types';

/**
 * Fetches all outlines from the database
 */
export async function fetchOutlines(): Promise<Outline[]> {
  try {
    const { data, error } = await supabase
      .from('outlines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outlines:', error);
      return [];
    }

    // Transform database data to Outline interface
    return (data || []).map((item: any): Outline => ({
      id: item.id,
      title: item.title,
      year: item.year,
      grade: item.grade || 'P', // Map grade field
      type: item.pages <= 25 ? 'Attack' : 'Outline', // Determine type based on pages
      rating: item.rating || 0,
      ratingCount: item.rating_count || 0,
      course: item.course,
      instructor: item.instructor,
      fileType: item.file_type === 'pdf' ? 'PDF' : 'DOC',
      fileUrl: '', // Will be generated when needed
      pages: item.pages || 0
    }));
  } catch (error) {
    console.error('Error fetching outlines:', error);
    return [];
  }
}