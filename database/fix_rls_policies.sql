-- Fix RLS policies for signup functionality
-- These policies are missing from the original RLS setup

-- PROFILES TABLE - Missing INSERT policy for signup
CREATE POLICY "Users can insert their own profile during signup" ON profiles FOR INSERT 
WITH CHECK (id = auth.uid());

-- SCHOOLS TABLE - Missing policies for school access and creation
CREATE POLICY "Users can read schools" ON schools FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create schools during signup" ON schools FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- ADDITIONAL POLICIES FOR BETTER FUNCTIONALITY

-- Allow teachers to see students in their school/grade for matching
CREATE POLICY "Teachers see students in same school/grade" ON profiles FOR SELECT 
USING (
  role = 'student' 
  AND EXISTS (
    SELECT 1 FROM profiles teacher_profile 
    WHERE teacher_profile.id = auth.uid() 
    AND teacher_profile.role IN ('teacher', 'head_teacher')
    AND teacher_profile.school_id = profiles.school_id
    AND (
      teacher_profile.role = 'head_teacher' 
      OR teacher_profile.grade = profiles.grade
    )
  )
);

-- Allow head teachers to see all profiles in their school
CREATE POLICY "Head teachers see all school profiles" ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles head_profile 
    WHERE head_profile.id = auth.uid() 
    AND head_profile.role = 'head_teacher'
    AND head_profile.school_id = profiles.school_id
  )
);

-- Allow teachers to create classrooms
CREATE POLICY "Teachers can create classrooms" ON classrooms FOR INSERT 
WITH CHECK (teacher_id = auth.uid());

-- Allow teachers to create progress records
CREATE POLICY "Teachers can insert progress" ON progress FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = progress.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);