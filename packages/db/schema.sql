-- ═══════════════════════════════════════════════════════════════
-- TECHub Database Schema — Sprint 0
-- All tables created empty. No data. Just structure.
-- Run this in your Neon PostgreSQL dashboard SQL editor.
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────
-- USERS
-- Core developer account. Firebase UID links to Firebase Auth.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    target_role VARCHAR(100),                    -- e.g. "Full Stack", "AI/ML Engineer"
    university VARCHAR(255),
    country VARCHAR(100) DEFAULT 'Saudi Arabia',
    open_to_work BOOLEAN DEFAULT TRUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INT DEFAULT 0,               -- Which step of the 6-step wizard
    public_profile BOOLEAN DEFAULT TRUE,
    leaderboard_opt_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- PLATFORM CONNECTIONS
-- Tracks which platforms (GitHub, HackerRank, Credly) the developer connected.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,               -- 'github' | 'hackerrank' | 'credly' | 'linkedin_import'
    platform_username VARCHAR(255),
    access_token_encrypted TEXT,                 -- OAuth token, AES-256 encrypted
    refresh_token_encrypted TEXT,
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'pending',   -- 'pending' | 'syncing' | 'success' | 'error'
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- ───────────────────────────────────────────
-- SKILLS
-- One row per skill per user. Score is 0-100.
-- Trust tier shows how the skill was proven.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    score NUMERIC(5,2) DEFAULT 0,                -- 0.00 to 100.00
    trust_tier VARCHAR(50) DEFAULT 'self_reported', -- 'platform_verified' | 'ai_verified' | 'ai_extracted' | 'self_reported'
    evidence_count INT DEFAULT 0,
    -- Evidence breakdown per source (matches scoring formula in blueprint)
    hackerrank_score NUMERIC(5,2) DEFAULT 0,     -- 40% weight
    github_score NUMERIC(5,2) DEFAULT 0,         -- 35% weight
    credly_score NUMERIC(5,2) DEFAULT 0,         -- 15% weight
    community_score NUMERIC(5,2) DEFAULT 0,      -- 10% weight
    last_recalculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- ───────────────────────────────────────────
-- WORK EXPERIENCE
-- Can be self-reported or AI-extracted from LinkedIn PDF.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,                               -- NULL = current job
    description TEXT,
    source VARCHAR(50) DEFAULT 'self_reported',  -- 'self_reported' | 'ai_extracted'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- SKILL TREE NODES
-- One row per node per user per role.
-- Auto-completes when CV evidence proves the skill.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_tree_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_role VARCHAR(100) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    node_level INT DEFAULT 0,                    -- Position in the tree (0 = root)
    prerequisites JSONB DEFAULT '[]',             -- Array of skill_names that must complete first
    status VARCHAR(50) DEFAULT 'locked',         -- 'locked' | 'available' | 'in_progress' | 'completed'
    project_description TEXT,
    suggested_courses JSONB DEFAULT '[]',        -- Array of {title, url}
    ide_project_id UUID,                         -- V2: links to IDE project (null until V2)
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_role, skill_name)
);

-- ───────────────────────────────────────────
-- OPPORTUNITIES
-- Jobs, hackathons, co-ops, GDP programs, training.
-- auto_apply_url and apply_config are used by the apply agent.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    company_or_org VARCHAR(255),
    type VARCHAR(50) NOT NULL,                   -- 'job' | 'hackathon' | 'coop' | 'gdp' | 'training'
    description TEXT,
    required_skills JSONB DEFAULT '[]',          -- Array of skill names
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,
    salary_min INT,
    salary_max INT,
    salary_currency VARCHAR(10) DEFAULT 'SAR',
    tech_domain VARCHAR(100),
    experience_level VARCHAR(50),                -- 'entry' | 'mid' | 'senior'
    source_url TEXT NOT NULL,
    source_platform VARCHAR(100),                -- 'devpost' | 'tamheer' | 'taqat' | 'scraped'
    auto_apply_url TEXT,                         -- V1: direct apply URL for agent
    apply_config JSONB DEFAULT '{}',             -- V1: field mappings for Stagehand agent
    is_active BOOLEAN DEFAULT TRUE,
    posted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- OPPORTUNITY MATCHES
-- Per-user per-opportunity match score.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunity_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    match_score NUMERIC(5,2) DEFAULT 0,          -- 0-100%
    matched_skills JSONB DEFAULT '[]',           -- Skills user has that match
    missing_skills JSONB DEFAULT '[]',           -- Skills user is missing
    pinecone_score NUMERIC(8,6),                 -- Raw vector similarity score
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, opportunity_id)
);

-- ───────────────────────────────────────────
-- APPLICATIONS
-- Tracks the full pipeline: Applied → Viewed → Interview → Offer → Rejected
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id),
    status VARCHAR(50) DEFAULT 'applied',        -- 'applied' | 'viewed' | 'interview' | 'offer' | 'rejected'
    applied_via VARCHAR(50) DEFAULT 'auto_agent',-- 'auto_agent' | 'manual'
    agent_session_id VARCHAR(255),               -- Stagehand session ID for the apply run
    agent_screenshot_url TEXT,                   -- R2 URL of final screenshot
    notes TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, opportunity_id)
);

-- ───────────────────────────────────────────
-- XP EVENTS
-- Every XP award is logged here. Source of truth for the leaderboard.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,            -- 'platform_connect' | 'node_complete' | 'application_sent' | etc.
    xp_amount INT NOT NULL,
    reference_id UUID,                           -- ID of related object (node ID, application ID, etc.)
    reference_type VARCHAR(100),                 -- 'skill_tree_node' | 'application' | 'badge' | etc.
    description TEXT,
    is_verified BOOLEAN DEFAULT TRUE,            -- XP only from verified events (NFR-11)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- BADGES
-- Milestone achievements. Earned once per event type.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(100) NOT NULL,            -- 'first_connection' | '5_skills_verified' | etc.
    badge_name VARCHAR(255) NOT NULL,
    badge_icon_url TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- ───────────────────────────────────────────
-- TOKENS
-- Daily free allocation + purchased tokens.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INT DEFAULT 10,                      -- Current token balance
    daily_free_claimed_at DATE DEFAULT CURRENT_DATE,
    total_purchased INT DEFAULT 0,
    total_spent INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- TOKEN TRANSACTIONS
-- Every token spend and earn is logged.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,                   -- 'daily_free' | 'purchase' | 'spend'
    amount INT NOT NULL,                         -- Positive = earned, Negative = spent
    action VARCHAR(100),                         -- 'cv_export' | 'opportunity_refresh' | 'auto_apply'
    stripe_payment_id VARCHAR(255),              -- Set on purchases
    balance_after INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- NOTIFICATIONS
-- In-app notification log. Push sent via Firebase FCM.
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,                  -- 'cv_updated' | 'new_match' | 'status_change' | 'low_tokens'
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- INDEXES — Speed up common queries
-- ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_skill_name ON skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_user_id ON opportunity_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_score ON opportunity_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_skill_tree_user_role ON skill_tree_nodes(user_id, target_role);

-- ═══════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- Next: Run "alembic init" in packages/db to set up migrations.
-- ═══════════════════════════════════════════════════════════════
