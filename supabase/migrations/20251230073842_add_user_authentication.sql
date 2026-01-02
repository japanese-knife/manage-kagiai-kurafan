/*
  # Add User Authentication Support

  1. Schema Changes
    - Add `user_id` column to all tables (projects, tasks, schedules, meetings, documents, design_requirements, video_requirements, returns, image_assets)
    - Set `user_id` to reference auth.users
    - Add foreign key constraints
  
  2. Security Changes
    - Update all RLS policies to check user_id ownership
    - Replace anonymous access policies with authenticated user policies
    - Ensure users can only access their own data
  
  3. Important Notes
    - All tables will now require authentication
    - Each user will only see their own projects and related data
*/

-- Add user_id column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
  END IF;
END $$;

-- Add user_id column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  END IF;
END $$;

-- Add user_id column to schedules table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE schedules ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
  END IF;
END $$;

-- Add user_id column to meetings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE meetings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
  END IF;
END $$;

-- Add user_id column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
  END IF;
END $$;

-- Add user_id column to design_requirements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'design_requirements' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE design_requirements ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_design_requirements_user_id ON design_requirements(user_id);
  END IF;
END $$;

-- Add user_id column to video_requirements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_requirements' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE video_requirements ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_video_requirements_user_id ON video_requirements(user_id);
  END IF;
END $$;

-- Add user_id column to returns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'returns' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE returns ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
  END IF;
END $$;

-- Add user_id column to image_assets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'image_assets' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE image_assets ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_image_assets_user_id ON image_assets(user_id);
  END IF;
END $$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Allow anonymous read access" ON projects;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON projects;
DROP POLICY IF EXISTS "Allow anonymous update access" ON projects;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON projects;

DROP POLICY IF EXISTS "Allow anonymous read access" ON tasks;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON tasks;
DROP POLICY IF EXISTS "Allow anonymous update access" ON tasks;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON tasks;

DROP POLICY IF EXISTS "Allow anonymous read access" ON schedules;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON schedules;
DROP POLICY IF EXISTS "Allow anonymous update access" ON schedules;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON schedules;

DROP POLICY IF EXISTS "Allow anonymous read access" ON meetings;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON meetings;
DROP POLICY IF EXISTS "Allow anonymous update access" ON meetings;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON meetings;

DROP POLICY IF EXISTS "Allow anonymous read access" ON documents;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON documents;
DROP POLICY IF EXISTS "Allow anonymous update access" ON documents;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON documents;

DROP POLICY IF EXISTS "Allow anonymous read access" ON design_requirements;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON design_requirements;
DROP POLICY IF EXISTS "Allow anonymous update access" ON design_requirements;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON design_requirements;

DROP POLICY IF EXISTS "Allow anonymous read access" ON video_requirements;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON video_requirements;
DROP POLICY IF EXISTS "Allow anonymous update access" ON video_requirements;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON video_requirements;

DROP POLICY IF EXISTS "Allow anonymous read access" ON returns;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON returns;
DROP POLICY IF EXISTS "Allow anonymous update access" ON returns;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON returns;

DROP POLICY IF EXISTS "Allow anonymous read access" ON image_assets;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON image_assets;
DROP POLICY IF EXISTS "Allow anonymous update access" ON image_assets;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON image_assets;

-- Create new RLS policies for projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for schedules
CREATE POLICY "Users can view own schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON schedules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for meetings
CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for documents
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for design_requirements
CREATE POLICY "Users can view own design requirements"
  ON design_requirements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own design requirements"
  ON design_requirements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own design requirements"
  ON design_requirements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own design requirements"
  ON design_requirements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for video_requirements
CREATE POLICY "Users can view own video requirements"
  ON video_requirements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video requirements"
  ON video_requirements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video requirements"
  ON video_requirements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own video requirements"
  ON video_requirements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for returns
CREATE POLICY "Users can view own returns"
  ON returns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own returns"
  ON returns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for image_assets
CREATE POLICY "Users can view own image assets"
  ON image_assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image assets"
  ON image_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own image assets"
  ON image_assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own image assets"
  ON image_assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);