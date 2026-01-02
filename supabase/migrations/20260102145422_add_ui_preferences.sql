/*
  # Add UI Preferences Table

  1. New Tables
    - `ui_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - NULL for anonymous shared viewers
      - `project_id` (uuid, references projects)
      - `section_name` (text) - Name of the accordion section
      - `is_expanded` (boolean) - Whether the section is expanded
      - `session_id` (text) - For anonymous users to persist preferences
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ui_preferences` table
    - Add policy for authenticated users to manage their own preferences
    - Add policy for anonymous users to manage preferences by session_id

  3. Indexes
    - Add index on (user_id, project_id, section_name) for fast lookups
    - Add index on (session_id, project_id, section_name) for anonymous users
*/

CREATE TABLE IF NOT EXISTS ui_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  section_name text NOT NULL,
  is_expanded boolean DEFAULT true,
  session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id, section_name),
  UNIQUE(session_id, project_id, section_name)
);

ALTER TABLE ui_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage own preferences"
  ON ui_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can manage session preferences"
  ON ui_preferences
  FOR ALL
  TO anon
  USING (session_id IS NOT NULL)
  WITH CHECK (session_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_ui_preferences_user_project 
  ON ui_preferences(user_id, project_id, section_name);

CREATE INDEX IF NOT EXISTS idx_ui_preferences_session_project 
  ON ui_preferences(session_id, project_id, section_name);