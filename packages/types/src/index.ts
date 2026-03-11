// ============================================
// TECHub Shared Types
// ============================================

// --- User & Auth ---
export interface User {
  id: string;
  email: string;
  firebase_uid: string;
  username: string;
  created_at: string;
  updated_at: string;
}

// --- Developer Profile ---
export type CharacterClass =
  | "full_stack"
  | "backend"
  | "ai_ml"
  | "mobile"
  | "devops";

export type LevelName =
  | "Trainee"
  | "Junior"
  | "Mid"
  | "Senior"
  | "Principal"
  | "Legend";

export interface DeveloperProfile {
  id: string;
  user_id: string;
  target_role: CharacterClass;
  level: LevelName;
  xp: number;
  character_class: CharacterClass;
  is_open_to_work: boolean;
  created_at: string;
}

// --- Skills ---
export type TrustTier =
  | "platform_verified"
  | "ai_verified"
  | "ai_extracted"
  | "self_reported";

export interface Skill {
  id: string;
  developer_id: string;
  skill_name: string;
  score: number;
  evidence_count: number;
  trust_tier: TrustTier;
  last_updated: string;
}

// --- Platform Connections ---
export type PlatformName = "github" | "hackerrank" | "credly";

export interface PlatformConnection {
  id: string;
  developer_id: string;
  platform_name: PlatformName;
  connected_at: string;
  last_synced_at: string;
  is_active: boolean;
}

// --- Skill Tree ---
export type NodeStatus = "locked" | "available" | "in_progress" | "completed";

export interface SkillTreeNode {
  id: string;
  developer_id: string;
  node_name: string;
  status: NodeStatus;
  xp_reward: number;
  prerequisite_node_id: string | null;
  completed_at: string | null;
}

// --- Opportunities ---
export type OpportunityType =
  | "job"
  | "hackathon"
  | "co_op"
  | "gdp"
  | "training";

export interface Opportunity {
  id: string;
  title: string;
  type: OpportunityType;
  source_url: string;
  company_name: string;
  location: string;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  required_skills: string[];
  scraped_at: string;
  is_active: boolean;
}

// --- Applications ---
export type ApplicationStatus =
  | "applied"
  | "viewed"
  | "interview"
  | "offer"
  | "rejected";

export interface DeveloperOpportunity {
  id: string;
  developer_id: string;
  opportunity_id: string;
  match_score: number;
  applied_at: string;
  status: ApplicationStatus;
  last_status_updated: string;
}

// --- Gamification ---
export type XPEventType =
  | "connect_platform"
  | "verify_skill"
  | "complete_node"
  | "apply_opportunity"
  | "get_interview"
  | "get_hired"
  | "earn_badge"
  | "daily_quest";

export interface XPEvent {
  id: string;
  developer_id: string;
  event_type: XPEventType;
  xp_awarded: number;
  source_description: string;
  created_at: string;
}

export interface Badge {
  id: string;
  developer_id: string;
  badge_name: string;
  badge_type: string;
  earned_at: string;
  is_visible: boolean;
}

// --- Tokens ---
export type TokenDirection = "credit" | "debit";

export interface TokenBalance {
  id: string;
  developer_id: string;
  balance: number;
  last_daily_reset: string;
  created_at: string;
}

export interface TokenTransaction {
  id: string;
  developer_id: string;
  amount: number;
  direction: TokenDirection;
  reason: string;
  created_at: string;
}

// --- Notifications ---
export interface Notification {
  id: string;
  developer_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

// --- API Responses ---
export interface HealthResponse {
  status: "healthy" | "unhealthy";
  service: string;
  db: "connected" | "disconnected";
  redis: "connected" | "disconnected";
  timestamp: string;
}

export interface CVResponse {
  developer: DeveloperProfile;
  skills: Skill[];
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  start_date: string;
  end_date: string | null;
  description: string;
  trust_tier: TrustTier;
}

export interface Education {
  id: string;
  university: string;
  degree: string;
  start_date: string;
  end_date: string | null;
  trust_tier: TrustTier;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issued_date: string;
  trust_tier: TrustTier;
}

// --- Leaderboard ---
export type LeaderboardType =
  | "global"
  | "country"
  | "university"
  | "skill"
  | "weekly";

export interface LeaderboardEntry {
  rank: number;
  developer_id: string;
  username: string;
  avatar_url: string | null;
  level: LevelName;
  character_class: CharacterClass;
  composite_score: number;
  top_skills: string[];
}
