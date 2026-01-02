/*
  # プロジェクト管理システムのデータベーススキーマ作成

  1. 新規テーブル
    - `projects` - プロジェクト基本情報
      - `id` (uuid, primary key)
      - `name` (text) - プロジェクト名
      - `description` (text) - 説明
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `schedules` - スケジュール情報
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `content` (text) - 自由記述
      - `milestone` (text) - マイルストーン
      - `created_at` (timestamptz)
    
    - `documents` - 資料一覧
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `name` (text) - 資料名
      - `url` (text) - URL
      - `memo` (text) - メモ
      - `created_at` (timestamptz)
    
    - `meetings` - 打ち合わせ内容
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `date` (date) - 日付
      - `participants` (text) - 参加者
      - `summary` (text) - 要点
      - `decisions` (text) - 決定事項
      - `created_at` (timestamptz)
    
    - `returns` - リターン内容
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `name` (text) - リターン名
      - `price_range` (text) - 価格帯
      - `description` (text) - 内容概要
      - `status` (text) - ステータス（案/確定）
      - `created_at` (timestamptz)
    
    - `image_assets` - 掲載画像素材
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `name` (text) - 素材名
      - `purpose` (text) - 用途
      - `url` (text) - URL
      - `status` (text) - ステータス
      - `created_at` (timestamptz)
    
    - `design_requirements` - ページデザイン要項
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `design_tone` (text) - デザイントーン
      - `colors` (text) - 使用カラー
      - `fonts` (text) - フォント
      - `ng_items` (text) - NG事項
      - `reference_urls` (text) - 参考URL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `video_requirements` - 掲載動画要項
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `video_type` (text) - 動画種類
      - `duration` (text) - 長さ目安
      - `required_cuts` (text) - 必須カット
      - `has_narration` (boolean) - ナレーション有無
      - `reference_url` (text) - 参考動画URL
      - `created_at` (timestamptz)
    
    - `tasks` - タスク管理（多階層対応）
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `parent_id` (uuid, foreign key, nullable) - 親タスクID
      - `title` (text) - タスク名
      - `description` (text) - 説明
      - `status` (text) - ステータス（未着手/進行中/完了）
      - `due_date` (date, nullable) - 期限
      - `order_index` (integer) - 並び順
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. セキュリティ
    - 全テーブルでRLSを有効化
    - 認証済みユーザーが全データを読み取り・操作可能なポリシーを設定
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content text DEFAULT '',
  milestone text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete schedules"
  ON schedules FOR DELETE
  TO authenticated
  USING (true);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text DEFAULT '',
  memo text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (true);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  participants text DEFAULT '',
  summary text DEFAULT '',
  decisions text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (true);

-- Returns table
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_range text DEFAULT '',
  description text DEFAULT '',
  status text DEFAULT '案',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view returns"
  ON returns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete returns"
  ON returns FOR DELETE
  TO authenticated
  USING (true);

-- Image assets table
CREATE TABLE IF NOT EXISTS image_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text DEFAULT '',
  url text DEFAULT '',
  status text DEFAULT '準備中',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE image_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view image_assets"
  ON image_assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert image_assets"
  ON image_assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update image_assets"
  ON image_assets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete image_assets"
  ON image_assets FOR DELETE
  TO authenticated
  USING (true);

-- Design requirements table
CREATE TABLE IF NOT EXISTS design_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  design_tone text DEFAULT '',
  colors text DEFAULT '',
  fonts text DEFAULT '',
  ng_items text DEFAULT '',
  reference_urls text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE design_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view design_requirements"
  ON design_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert design_requirements"
  ON design_requirements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update design_requirements"
  ON design_requirements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete design_requirements"
  ON design_requirements FOR DELETE
  TO authenticated
  USING (true);

-- Video requirements table
CREATE TABLE IF NOT EXISTS video_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  video_type text DEFAULT '',
  duration text DEFAULT '',
  required_cuts text DEFAULT '',
  has_narration boolean DEFAULT false,
  reference_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE video_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view video_requirements"
  ON video_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert video_requirements"
  ON video_requirements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update video_requirements"
  ON video_requirements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete video_requirements"
  ON video_requirements FOR DELETE
  TO authenticated
  USING (true);

-- Tasks table (hierarchical support)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT '未着手',
  due_date date,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schedules_project_id ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_returns_project_id ON returns(project_id);
CREATE INDEX IF NOT EXISTS idx_image_assets_project_id ON image_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_design_requirements_project_id ON design_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_video_requirements_project_id ON video_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);