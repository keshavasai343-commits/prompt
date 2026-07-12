export type PromptCategory =
  | 'coding'
  | 'ui_ux'
  | 'writing'
  | 'marketing'
  | 'business'
  | 'image_generation'
  | 'data_science'
  | 'devops'
  | 'general'

export type TargetAI =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'cursor'
  | 'copilot'
  | 'midjourney'
  | 'stable_diffusion'
  | 'grok'
  | 'general'

export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  bio?: string
  is_active: boolean
  is_verified: boolean
  preferred_model: string
  theme: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface Prompt {
  id: number
  user_id: number
  title: string
  original_input: string
  enhanced_prompt: string
  category: PromptCategory
  target_ai: TargetAI
  ai_model_used?: string
  is_favorite: boolean
  is_public: boolean
  tags?: string
  copy_count: number
  created_at: string
  updated_at: string
}

export interface PromptGenerateRequest {
  input_text: string
  category: PromptCategory
  target_ai: TargetAI
  ai_model: string
  save_to_history?: boolean
}

export interface PromptVariants {
  standard: string
  advanced: string
  expert: string
}

export interface PromptAnalysis {
  detected_intent: string
  assigned_role: string
  quality_score: number
  suggested_improvements: string[]
  missing_information: string[]
  follow_up_questions: string[]
}

export interface PromptGenerateResponse {
  enhanced_prompt: string
  category: PromptCategory
  target_ai: TargetAI
  ai_model_used: string
  tokens_used?: number
  generation_time_ms?: number
  variants?: PromptVariants
  analysis?: PromptAnalysis
}

// SSE streaming event types
export interface StreamTokenEvent {
  type: 'token'
  text: string
}

export interface StreamCompleteEvent {
  type: 'complete'
  data: {
    enhanced_prompt: string
    standard_prompt: string
    advanced_prompt: string
    expert_prompt: string
    detected_intent: string
    assigned_role: string
    quality_score: number
    suggested_improvements: string[]
    missing_information: string[]
    follow_up_questions: string[]
    tokens_used: number | null
    model_used: string
    generation_time_ms: number
    category: string
    target_ai: string
    ai_model_used: string
  }
}

export interface StreamErrorEvent {
  type: 'error'
  message: string
}

export type StreamEvent = StreamTokenEvent | StreamCompleteEvent | StreamErrorEvent

export interface PromptListResponse {
  items: Prompt[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface Template {
  id: number
  user_id?: number
  name: string
  description?: string
  template_text: string
  category: PromptCategory
  target_ai: TargetAI
  is_system: boolean
  is_public: boolean
  use_count: number
  tags?: string
  created_at: string
}

export interface HistoryItem {
  id: number
  original_input: string
  enhanced_prompt: string
  category: PromptCategory
  target_ai: TargetAI
  ai_model_used?: string
  tokens_used?: number
  generation_time_ms?: number
  created_at: string
}

export interface HistoryListResponse {
  items: HistoryItem[]
  total: number
  page: number
  page_size: number
}

export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  badge?: string
}

export const AI_MODELS: AIModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Latest & fast', badge: 'Default' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Most capable Gemini' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'Google', description: 'Ultra-fast Gemini', badge: 'New' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', description: 'Stable Gemini' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable OpenAI model' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast & efficient' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Best for reasoning' },
  { id: 'grok-2', name: 'Grok 2', provider: 'xAI', description: 'Real-time knowledge' },
]

export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  coding: 'Coding',
  ui_ux: 'UI/UX',
  writing: 'Writing',
  marketing: 'Marketing',
  business: 'Business',
  image_generation: 'Image Gen',
  data_science: 'Data Science',
  devops: 'DevOps',
  general: 'General',
}

export const TARGET_AI_LABELS: Record<TargetAI, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  cursor: 'Cursor',
  copilot: 'Copilot',
  midjourney: 'Midjourney',
  stable_diffusion: 'Stable Diffusion',
  grok: 'Grok',
  general: 'General',
}

export const CATEGORY_ICONS: Record<PromptCategory, string> = {
  coding: '💻',
  ui_ux: '🎨',
  writing: '✍️',
  marketing: '📈',
  business: '💼',
  image_generation: '🖼️',
  data_science: '📊',
  devops: '⚙️',
  general: '✨',
}
