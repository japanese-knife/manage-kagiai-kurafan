export type ProjectStatus = '進行中' | '完了' | '保留';
export type BrandType = '海外クラファン.com' | 'BRAND-BASE';

export interface Creator {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  creator_id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSchedule {
  id: string;
  project_id: string;
  date: string;
  content: string;
  status?: string;
  background_color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  share_token?: string;
  is_shared?: boolean;
  shared_at?: string;
}

export interface Schedule {
  id: string;
  project_id: string;
  content: string;
  milestone: string;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  url: string;
  memo: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  project_id: string;
  date: string;
  participants: string;
  summary: string;
  decisions: string;
  created_at: string;
}

export interface Return {
  id: string;
  project_id: string;
  name: string;
  price_range: string;
  description: string;
  status: '案' | '確定';
  created_at: string;
}

export interface ImageAsset {
  id: string;
  project_id: string;
  name: string;
  purpose: string;
  url: string;
  status: string;
  created_at: string;
}

export interface DesignRequirement {
  id: string;
  project_id: string;
  design_tone: string;
  colors: string;
  fonts: string;
  ng_items: string;
  reference_urls: string;
  created_at: string;
  updated_at: string;
}

export interface TextContentRequirement {
  id: string;
  project_id: string;
  name: string;
  url: string;
  memo: string;
  created_at: string;
}

export interface VideoRequirement {
  id: string;
  project_id: string;
  video_type: string;
  duration: string;
  required_cuts: string;
  has_narration: boolean;
  reference_url: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  status: '未着手' | '進行中' | '完了';
  due_date: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  children?: Task[];
}

export type TabType = 'overview' | 'tasks' | 'calendar';
