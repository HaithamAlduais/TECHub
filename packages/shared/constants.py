# ═══════════════════════════════════════════════════════
# TECHub Shared Constants
# Import these in any service: from packages.shared.constants import *
# ═══════════════════════════════════════════════════════

# ─────────────────────────────────────────────
# XP VALUES — From Sprint 0 blueprint
# ─────────────────────────────────────────────
XP_PLATFORM_CONNECT = 50
XP_SKILL_VERIFY_MIN = 20
XP_SKILL_VERIFY_MAX = 100
XP_SKILL_TREE_NODE_COMPLETE = 150
XP_APPLICATION_SENT = 10
XP_INTERVIEW_RECEIVED = 50
XP_HIRED = 500
XP_BADGE_EARNED = 25         # Default badge XP (varies by badge)
XP_PROJECT_BUILT = 200
XP_DAILY_QUEST = 30

# ─────────────────────────────────────────────
# LEVEL THRESHOLDS
# ─────────────────────────────────────────────
LEVELS = {
    "Trainee":   {"min": 0,     "max": 499},
    "Junior":    {"min": 500,   "max": 1999},
    "Mid":       {"min": 2000,  "max": 4999},
    "Senior":    {"min": 5000,  "max": 9999},
    "Principal": {"min": 10000, "max": 19999},
    "Legend":    {"min": 20000, "max": float("inf")},
}

# ─────────────────────────────────────────────
# SKILL SCORING WEIGHTS
# ─────────────────────────────────────────────
SKILL_WEIGHT_HACKERRANK = 0.40
SKILL_WEIGHT_GITHUB     = 0.35
SKILL_WEIGHT_CREDLY     = 0.15
SKILL_WEIGHT_COMMUNITY  = 0.10

# ─────────────────────────────────────────────
# TOKEN SYSTEM
# ─────────────────────────────────────────────
DAILY_FREE_TOKENS = 10

TOKEN_PACKAGES = [
    {"tokens": 50,   "price_sar": 15,  "stripe_price_id": "price_50_tokens"},
    {"tokens": 150,  "price_sar": 35,  "stripe_price_id": "price_150_tokens"},
    {"tokens": 500,  "price_sar": 99,  "stripe_price_id": "price_500_tokens"},
    {"tokens": 2000, "price_sar": 299, "stripe_price_id": "price_2000_tokens"},
]

TOKEN_COSTS = {
    "cv_export":            1,
    "opportunity_refresh":  2,
    "auto_apply":           1,
    "smart_cv_export":      3,
}

# ─────────────────────────────────────────────
# OPPORTUNITY TYPES
# ─────────────────────────────────────────────
OPPORTUNITY_TYPES = ["job", "hackathon", "coop", "gdp", "training"]

# ─────────────────────────────────────────────
# CHARACTER CLASSES — Based on top skill cluster
# ─────────────────────────────────────────────
CHARACTER_CLASSES = [
    "Backend Engineer",
    "Frontend Engineer",
    "AI/ML Engineer",
    "Full Stack",
    "DevOps",
    "Data Engineer",
    "Mobile Developer",
    "UI/UX Engineer",
]

# ─────────────────────────────────────────────
# PLATFORM NAMES
# ─────────────────────────────────────────────
PLATFORMS = ["github", "hackerrank", "credly", "linkedin_import"]

# ─────────────────────────────────────────────
# TRUST TIERS (skill evidence quality)
# ─────────────────────────────────────────────
TRUST_TIERS = ["platform_verified", "ai_verified", "ai_extracted", "self_reported"]

# ─────────────────────────────────────────────
# BADGE TYPES
# ─────────────────────────────────────────────
BADGE_TYPES = {
    "first_connection":     "Connected your first platform",
    "5_skills_verified":    "Verified 5 skills with evidence",
    "first_application":    "Sent your first application",
    "10_applications":      "Sent 10 applications",
    "first_hire":           "Got hired through TECHub",
    "10_day_streak":        "10-day login streak",
    "legend_level":         "Reached Legend level",
    "first_node_complete":  "Completed first Skill Tree node",
}
