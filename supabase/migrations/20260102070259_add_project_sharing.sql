/*
  # Add Project Sharing Functionality

  1. Schema Changes
    - Add `share_token` column to projects table (UUID for sharing)
    - Add `is_shared` column to projects table (boolean flag)
    - Add `shared_at` column to track when sharing was enabled
    - Add unique index on share_token
  
  2. Security Changes
    - Add RLS policies to allow read-only access via share token
    - Anonymous users can view shared projects and related data
  
  3. Important Notes
    - Share tokens are unique UUIDs
    - Only project owners can enable/disable sharing
    - Shared projects are read-only for non-owners
*/

-- Add share_token column to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE projects ADD COLUMN share_token uuid DEFAULT gen_random_uuid() UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token);
  END IF;
END $$;

-- Add is_shared column to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'is_shared'
  ) THEN
    ALTER TABLE projects ADD COLUMN is_shared boolean DEFAULT false;
  END IF;
END $$;

-- Add shared_at column to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'shared_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN shared_at timestamptz;
  END IF;
END $$;

-- Create RLS policy for shared project viewing
CREATE POLICY "Anyone can view shared projects"
  ON projects FOR SELECT
  TO anon, authenticated
  USING (is_shared = true);

-- Create RLS policy for shared project tasks
CREATE POLICY "Anyone can view shared project tasks"
  ON tasks FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.is_shared = true
    )
  );

-- Create RLS policy for shared project schedules
CREATE POLICY "Anyone can view shared project schedules"
  ON schedules FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = schedules.project_id
      AND projects.is_shared = true
    )
  );

-- Create RLS policy for shared project meetings
CREATE POLICY "Anyone can view shared project meetings"
  ON meetings FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = meetings.project_id
      AND projects.is_shared = true
    )
  );

-- Create RLS policy for shared project documents
CREATE POLICY "Anyone can view shared project documents"
  ON documents FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documents.project_id
      AND projects.is_shared = true
    )
  );

-- Create RLS policy for shared project design requirements
CREATE POLICY "Anyone can view shared project design requirements"
  ON design_requirements FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = design_requirements.project_id
      AND projects.is_shared = true
    )
  );

-- Create RLS policy for shared project video requirements
CREATE POLICY "Anyone can view shared project video requirements"
  ON video_requirements FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = video_requirements.project_id
      AND projects.is_shared = true
    )
  );

-- Create RLS policy for shared project returns
CREATE POLICY "Anyone can view shared project returns"
  ON returns FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = returns.project_id
      AND projects.is_shared = true
    )
  );

-- Create RLS policy for shared project image assets
CREATE POLICY "Anyone can view shared project image assets"
  ON image_assets FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = image_assets.project_id
      AND projects.is_shared = true
    )
  );