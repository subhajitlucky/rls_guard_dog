import { NextRequest, NextResponse } from 'next/server';
import { createClient, createBearerClient } from '@/lib/supabase/server';

interface CreateProgressRequest {
  student_id: string;
  subject: string;
  score: number;
  classroom_id: string;
}

interface UpdateProgressRequest {
  id: string;
  score?: number;
  subject?: string;
}

export async function GET(request: NextRequest) {
  try {
    const authz = request.headers.get('authorization') || ''
    const token = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7) : null
    const supabase = token ? createBearerClient(token) : await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id, classroom_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch progress records based on role
    let query = supabase.from('progress').select('*');

    if (profile.role === 'student') {
      // Students see only their own records
      query = query.eq('student_id', user.id);
    } else if (profile.role === 'teacher' && profile.classroom_id) {
      // Teachers see records from their classroom
      query = query.eq('classroom_id', profile.classroom_id);
    } else if (profile.role === 'head_teacher' && profile.school_id) {
      // Head teachers see all records from their school
      query = query.eq('school_id', profile.school_id);
    }

    const { data: progress, error: progressError } = await query;

    if (progressError) {
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authz = request.headers.get('authorization') || ''
    const token = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7) : null
    const supabase = token ? createBearerClient(token) : await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a teacher or head_teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, classroom_id')
      .eq('id', user.id)
      .single();

    if (!profile || !['teacher', 'head_teacher'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

  const body: CreateProgressRequest = await request.json();
  const { student_id, subject, score, classroom_id } = body;

    if (!student_id || !subject || score === undefined || !classroom_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine school_id from classroom
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, school_id, teacher_id')
      .eq('id', classroom_id)
      .single()

    if (classroomError || !classroom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 400 }
      );
    }

    // Create progress record
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .insert({
        student_id,
        subject,
        score,
        classroom_id,
        school_id: classroom.school_id,
      })
      .select()
      .single();

    if (progressError) {
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Progress record created successfully',
      progress 
    });
  } catch (error) {
    console.error('Progress creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authz = request.headers.get('authorization') || ''
    const token = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7) : null
    const supabase = token ? createBearerClient(token) : await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a teacher or head_teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['teacher', 'head_teacher'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body: UpdateProgressRequest = await request.json();
    const { id, score, subject } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Progress record ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string | number> = {};
    if (score !== undefined) updateData.score = score;
    if (subject !== undefined) updateData.subject = subject;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (progressError) {
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Progress record updated successfully',
      progress 
    });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}