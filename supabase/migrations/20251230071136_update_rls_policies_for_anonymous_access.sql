/*
  # RLSポリシーの更新 - 匿名アクセスを許可

  1. 変更内容
    - 全テーブルのRLSポリシーを更新
    - 認証済み(authenticated)ユーザーに加えて、匿名(anon)ユーザーもアクセス可能に変更
    - これにより、認証なしでアプリを使用できるようになります

  2. 対象テーブル
    - projects
    - schedules
    - documents
    - meetings
    - returns
    - image_assets
    - design_requirements
    - video_requirements
    - tasks
*/

-- Projects table policies
DROP POLICY IF EXISTS "Authenticated users can view all projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert projects"
  ON projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update projects"
  ON projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete projects"
  ON projects FOR DELETE
  USING (true);

-- Schedules table policies
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON schedules;
DROP POLICY IF EXISTS "Authenticated users can insert schedules" ON schedules;
DROP POLICY IF EXISTS "Authenticated users can update schedules" ON schedules;
DROP POLICY IF EXISTS "Authenticated users can delete schedules" ON schedules;

CREATE POLICY "Anyone can view schedules"
  ON schedules FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert schedules"
  ON schedules FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update schedules"
  ON schedules FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete schedules"
  ON schedules FOR DELETE
  USING (true);

-- Documents table policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;

CREATE POLICY "Anyone can view documents"
  ON documents FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert documents"
  ON documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update documents"
  ON documents FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete documents"
  ON documents FOR DELETE
  USING (true);

-- Meetings table policies
DROP POLICY IF EXISTS "Authenticated users can view meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can insert meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can update meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can delete meetings" ON meetings;

CREATE POLICY "Anyone can view meetings"
  ON meetings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert meetings"
  ON meetings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update meetings"
  ON meetings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete meetings"
  ON meetings FOR DELETE
  USING (true);

-- Returns table policies
DROP POLICY IF EXISTS "Authenticated users can view returns" ON returns;
DROP POLICY IF EXISTS "Authenticated users can insert returns" ON returns;
DROP POLICY IF EXISTS "Authenticated users can update returns" ON returns;
DROP POLICY IF EXISTS "Authenticated users can delete returns" ON returns;

CREATE POLICY "Anyone can view returns"
  ON returns FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert returns"
  ON returns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update returns"
  ON returns FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete returns"
  ON returns FOR DELETE
  USING (true);

-- Image assets table policies
DROP POLICY IF EXISTS "Authenticated users can view image_assets" ON image_assets;
DROP POLICY IF EXISTS "Authenticated users can insert image_assets" ON image_assets;
DROP POLICY IF EXISTS "Authenticated users can update image_assets" ON image_assets;
DROP POLICY IF EXISTS "Authenticated users can delete image_assets" ON image_assets;

CREATE POLICY "Anyone can view image_assets"
  ON image_assets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert image_assets"
  ON image_assets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update image_assets"
  ON image_assets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete image_assets"
  ON image_assets FOR DELETE
  USING (true);

-- Design requirements table policies
DROP POLICY IF EXISTS "Authenticated users can view design_requirements" ON design_requirements;
DROP POLICY IF EXISTS "Authenticated users can insert design_requirements" ON design_requirements;
DROP POLICY IF EXISTS "Authenticated users can update design_requirements" ON design_requirements;
DROP POLICY IF EXISTS "Authenticated users can delete design_requirements" ON design_requirements;

CREATE POLICY "Anyone can view design_requirements"
  ON design_requirements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert design_requirements"
  ON design_requirements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update design_requirements"
  ON design_requirements FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete design_requirements"
  ON design_requirements FOR DELETE
  USING (true);

-- Video requirements table policies
DROP POLICY IF EXISTS "Authenticated users can view video_requirements" ON video_requirements;
DROP POLICY IF EXISTS "Authenticated users can insert video_requirements" ON video_requirements;
DROP POLICY IF EXISTS "Authenticated users can update video_requirements" ON video_requirements;
DROP POLICY IF EXISTS "Authenticated users can delete video_requirements" ON video_requirements;

CREATE POLICY "Anyone can view video_requirements"
  ON video_requirements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert video_requirements"
  ON video_requirements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update video_requirements"
  ON video_requirements FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete video_requirements"
  ON video_requirements FOR DELETE
  USING (true);

-- Tasks table policies
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

CREATE POLICY "Anyone can view tasks"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
  ON tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete tasks"
  ON tasks FOR DELETE
  USING (true);