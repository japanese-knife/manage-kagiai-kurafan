/*
  # プロジェクトテーブルにステータスカラムを追加

  1. 変更内容
    - `projects`テーブルに`status`カラムを追加
    - デフォルト値は「進行中」
    - 可能な値: 進行中、完了、保留

  2. 注意事項
    - 既存のプロジェクトには自動的に「進行中」が設定されます
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'status'
  ) THEN
    ALTER TABLE projects ADD COLUMN status text DEFAULT '進行中';
  END IF;
END $$;