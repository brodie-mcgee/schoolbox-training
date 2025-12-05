import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Supabase client for server-side operations
 * Uses service role key for admin access (bypasses RLS)
 */
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Table names (shared with Digital-Toolbox database)
export const TABLES = {
  USERS: "users",
  TRAINING_MODULES: "training_modules",
  COURSES: "courses",
  BADGES: "badges",
  EARNED_BADGES: "earned_badges",
  MODULE_ENROLLMENTS: "_module_enrollments_actual",
  COURSE_ENROLLMENTS: "_course_enrollments_actual",
  MODULE_PROGRESS: "module_progress",
  TRAINING_REMINDERS: "training_reminders",
  TRAINING_QUIZ_ATTEMPTS: "training_quiz_attempts",
  TRAINING_EVIDENCE: "training_evidence",
  TRAINING_LOGS: "training_logs",
  AUTO_ENROLLMENT_SETTINGS: "auto_enrollment_settings",
} as const;
