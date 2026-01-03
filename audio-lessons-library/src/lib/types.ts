export type Lesson = {
  id: string;
  module: string;
  module_slug: string;
  week: number;
  title: string;
  tags: string[];
  audio_path: string;
  duration_seconds: number | null;
  created_at: string;
};

export type UserProgress = {
  user_id: string;
  lesson_id: string;
  position_seconds: number;
  completed: boolean;
  updated_at: string;
};

export type ModuleSummary = {
  id: string;
  name: string;
  slug: string;
  weeks_count: number;
  lessons_count: number;
};

export type LessonWithProgress = {
  id: string;
  module_name: string | null;
  module_slug: string;
  week_number: number;
  title: string;
  audio_path: string;
  tags?: string[] | null;
  duration_seconds: number | null;
  resume_seconds: number | null;
};
