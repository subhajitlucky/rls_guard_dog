import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { email, password, full_name, school_name, role } = await request.json();

    // Validate role
    if (!['student', 'teacher', 'head_teacher'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Find or create school
    let schoolData: { id: string; name: string } | null = null;
    
    if (role === 'head_teacher') {
      // Check if school already exists
      const { data: existingSchool } = await supabase
        .from('schools')
        .select('*')
        .eq('name', school_name)
        .single();

      if (existingSchool) {
        return NextResponse.json({ error: 'School already exists with a head teacher' }, { status: 400 });
      }

      // Create new school
      const { data: newSchool, error: schoolError } = await supabase
        .from('schools')
        .insert({ name: school_name })
        .select()
        .single();

      if (schoolError) {
        return NextResponse.json({ error: schoolError.message }, { status: 400 });
      }
      schoolData = newSchool;
    } else {
      // For student/teacher, school must exist
      const { data: existingSchool, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('name', school_name)
        .single();

      if (schoolError || !existingSchool) {
        return NextResponse.json({ error: 'School not found' }, { status: 400 });
      }
      schoolData = existingSchool;
    }

    if (!schoolData) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 });
    }

    // Create profile in the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        role,
        school_id: schoolData.id
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: userId,
        email,
        role,
        school_id: schoolData.id,
        school_name: schoolData.name
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}