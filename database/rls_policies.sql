-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- PROGRESS TABLE POLICIES (Main requirement!)

-- 1. Students see only their own progress
CREATE POLICY "Students see own progress" ON progress FOR SELECT 
USING (
  student_id = auth.uid()
);

-- 2. Teachers see progress for their classrooms
CREATE POLICY "Teachers see their classroom progress" ON progress FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = progress.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);

-- 3. Head teachers see all progress in their school
CREATE POLICY "Head teachers see school progress" ON progress FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'head_teacher'
    AND profiles.school_id = progress.school_id
  )
);

-- Teachers can also INSERT/UPDATE progress for their classrooms
CREATE POLICY "Teachers can edit their classroom progress" ON progress FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = progress.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);