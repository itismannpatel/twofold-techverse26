import type { Category, Skill } from './types'

export interface CategoryMeta {
  id: Category
  label: string
  /** Single glyph used in compact UI (not emoji — keeps the visual system typographic). */
  glyph: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'Programming', label: 'Programming', glyph: '{ }' },
  { id: 'Design', label: 'Design', glyph: '◑' },
  { id: 'Music', label: 'Music', glyph: '♪' },
  { id: 'Languages', label: 'Languages', glyph: '文' },
  { id: 'Academics', label: 'Academics', glyph: '∑' },
  { id: 'Fitness', label: 'Fitness', glyph: '◎' },
  { id: 'Business', label: 'Business', glyph: '▲' },
  { id: 'Arts', label: 'Arts', glyph: '✦' },
]

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category, CategoryMeta>

export const SKILLS: Skill[] = [
  // Programming
  { id: 'sk_python', name: 'Python', category: 'Programming' },
  { id: 'sk_js', name: 'JavaScript', category: 'Programming' },
  { id: 'sk_react', name: 'React', category: 'Programming' },
  { id: 'sk_rust', name: 'Rust', category: 'Programming' },
  { id: 'sk_cpp', name: 'C++', category: 'Programming' },
  { id: 'sk_ml', name: 'Machine Learning', category: 'Programming' },
  { id: 'sk_sql', name: 'SQL', category: 'Programming' },
  { id: 'sk_dsa', name: 'Data Structures', category: 'Programming' },

  // Design
  { id: 'sk_figma', name: 'Figma', category: 'Design' },
  { id: 'sk_uiux', name: 'UI/UX Design', category: 'Design' },
  { id: 'sk_motion', name: 'Motion Design', category: 'Design' },
  { id: 'sk_illustration', name: 'Illustration', category: 'Design' },
  { id: 'sk_blender', name: 'Blender 3D', category: 'Design' },

  // Music
  { id: 'sk_guitar', name: 'Guitar', category: 'Music' },
  { id: 'sk_piano', name: 'Piano', category: 'Music' },
  { id: 'sk_production', name: 'Music Production', category: 'Music' },
  { id: 'sk_singing', name: 'Singing', category: 'Music' },
  { id: 'sk_tabla', name: 'Tabla', category: 'Music' },

  // Languages
  { id: 'sk_spanish', name: 'Spanish', category: 'Languages' },
  { id: 'sk_japanese', name: 'Japanese', category: 'Languages' },
  { id: 'sk_german', name: 'German', category: 'Languages' },
  { id: 'sk_french', name: 'French', category: 'Languages' },
  { id: 'sk_speaking', name: 'Public Speaking', category: 'Languages' },

  // Academics
  { id: 'sk_calculus', name: 'Calculus', category: 'Academics' },
  { id: 'sk_linalg', name: 'Linear Algebra', category: 'Academics' },
  { id: 'sk_physics', name: 'Physics', category: 'Academics' },
  { id: 'sk_chem', name: 'Organic Chemistry', category: 'Academics' },
  { id: 'sk_writing', name: 'Technical Writing', category: 'Academics' },

  // Fitness
  { id: 'sk_calisthenics', name: 'Calisthenics', category: 'Fitness' },
  { id: 'sk_yoga', name: 'Yoga', category: 'Fitness' },
  { id: 'sk_running', name: 'Running', category: 'Fitness' },
  { id: 'sk_swimming', name: 'Swimming', category: 'Fitness' },

  // Business
  { id: 'sk_pm', name: 'Product Management', category: 'Business' },
  { id: 'sk_marketing', name: 'Marketing', category: 'Business' },
  { id: 'sk_finance', name: 'Finance', category: 'Business' },
  { id: 'sk_pitching', name: 'Pitching', category: 'Business' },
  { id: 'sk_excel', name: 'Excel Modelling', category: 'Business' },

  // Arts
  { id: 'sk_photo', name: 'Photography', category: 'Arts' },
  { id: 'sk_film', name: 'Film Editing', category: 'Arts' },
  { id: 'sk_ceramics', name: 'Ceramics', category: 'Arts' },
  { id: 'sk_sketching', name: 'Sketching', category: 'Arts' },
]

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
)
