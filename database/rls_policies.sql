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

-- PROFILES TABLE POLICIES (for user data access)

-- Users can see their own profile
CREATE POLICY "Users see own profile" ON profiles FOR SELECT 
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE 
USING (id = auth.uid());

-- CLASSROOMS TABLE POLICIES

-- Teachers can see their own classrooms
CREATE POLICY "Teachers see own classrooms" ON classrooms FOR SELECT 
USING (teacher_id = auth.uid());

-- Teachers can create/update their own classrooms
CREATE POLICY "Teachers manage own classrooms" ON classrooms FOR ALL 
USING (teacher_id = auth.uid());

-- Head teachers can see all classrooms in their school
CREATE POLICY "Head teachers see school classrooms" ON classrooms FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'head_teacher'
    AND profiles.school_id = classrooms.school_id
  )
);