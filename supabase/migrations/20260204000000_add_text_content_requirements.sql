/*
  # Add Text Content Requirements Table

  1. New Table
    - `text_content_requirements` - 掲載文章要項
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `name` (text) - 名前
      - `url` (text) - URL
      - `memo` (text) - メモ
      - `user_id` (uuid, nullable) - 作成ユーザーID
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `text_content_requirements` table
    - Add policies for all users to manage data
    - Add policies for anonymous users to view shared project data

  3. Indexes
    - Add index on project_id for better query performance
*/

-- Create text_content_requirements table
CREATE TABLE IF NOT EXISTS text_content_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text DEFAULT '',
  memo text DEFAULT '',
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE text_content_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies for all users (matching other tables' patterns)
CREATE POLICY "Anyone can view text_content_requirements"
  ON text_content_requirements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert text_content_requirements"
  ON text_content_requirements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update text_content_requirements"
  ON text_content_requirements FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete text_content_requirements"
  ON text_content_requirements FOR DELETE
  USING (true);

-- Create policy for shared project viewing
CREATE POLICY "Anyone can view shared project text_content_requirements"
  ON text_content_requirements FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = text_content_requirements.project_id
      AND projects.is_shared = true
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_text_content_requirements_project_id
  ON text_content_requirements(project_id);
