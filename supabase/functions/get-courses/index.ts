import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Course {
  id: string;
  name: string;
  code: string;
  year_level: string;
  is_required: boolean;
  is_elective: boolean;
  professors: Professor[];
}

interface Professor {
  id: string;
  name: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get query parameters
    const url = new URL(req.url);
    const yearLevel = url.searchParams.get('year_level');

    // Build the query
    let query = supabaseClient
      .from('courses')
      .select(
        `
        id,
        name,
        code,
        year_level,
        is_required,
        is_elective,
        course_professors!inner(
          professor:professors(
            id,
            name
          )
        )
      `
      )
      .order('name');

    // Filter by year level if provided
    if (yearLevel) {
      query = query.or(`year_level.eq.${yearLevel},year_level.eq.ALL`);
    }

    const { data: courses, error } = await query;

    if (error) throw error;

    // Transform the data to match the expected format
    const transformedCourses =
      courses?.map((course: any) => ({
        id: course.id,
        name: course.name,
        code: course.code,
        year_level: course.year_level,
        is_required: course.is_required,
        is_elective: course.is_elective,
        professors: course.course_professors.map((cp: any) => ({
          id: cp.professor.id,
          name: cp.professor.name,
        })),
      })) || [];

    return new Response(JSON.stringify({ courses: transformedCourses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
