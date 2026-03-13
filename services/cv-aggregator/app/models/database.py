from datetime import datetime, timezone
import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    supabase_uid = Column(String(128), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Added by migration 007 for local auth.
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    target_role = Column(String(100), nullable=True)
    university = Column(String(255), nullable=True)
    country = Column(String(100), nullable=True)
    open_to_work = Column(Boolean, default=True, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    onboarding_step = Column(Integer, default=1, nullable=False)
    public_profile = Column(Boolean, default=True, nullable=False)
    leaderboard_opt_out = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class PlatformConnection(Base):
    __tablename__ = "platform_connections"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)
    platform_username = Column(String(255), nullable=True)
    access_token_encrypted = Column(Text, nullable=True)
    refresh_token_encrypted = Column(Text, nullable=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    sync_status = Column(String(50), nullable=True)
    sync_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    score = Column(Numeric, default=0, nullable=False)
    trust_tier = Column(String(50), nullable=False, default="self_reported")
    evidence_count = Column(Integer, default=0, nullable=False)
    hackerrank_score = Column(Numeric, nullable=True)
    github_score = Column(Numeric, nullable=True)
    credly_score = Column(Numeric, nullable=True)
    community_score = Column(Numeric, nullable=True)
    last_recalculated_at = Column(DateTime(timezone=True), default=utcnow, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    repo_url = Column(Text, nullable=True)
    demo_url = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class SkillEvidence(Base):
    __tablename__ = "skill_evidence"

    id = Column(String, primary_key=True, default=gen_uuid)
    skill_id = Column(String, nullable=False, index=True)
    source_type = Column(String(50), nullable=False)
    source_ref = Column(String(255), nullable=True)
    confidence_score = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_current = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    file_url = Column(String(1024), nullable=True)
    title = Column(String(255), nullable=False)
    issuer = Column(String(255), nullable=True)
    issue_date = Column(Date, nullable=True)
    ai_verified = Column(Boolean, default=False, nullable=False)
    ai_verified_at = Column(DateTime(timezone=True), nullable=True)
    skills_extracted = Column(JSON, default=list, nullable=True)
    raw_text = Column(Text, nullable=True)


class Competition(Base):
    __tablename__ = "competitions"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    platform = Column(String(100), nullable=True)
    rank = Column(String(50), nullable=True)
    achievement = Column(Text, nullable=True)
    achieved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class SkillTagCatalog(Base):
    __tablename__ = "skill_tags_catalog"

    id = Column(String, primary_key=True, default=gen_uuid)
    tag_name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class UserSkillTag(Base):
    __tablename__ = "user_skill_tags"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    tag_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
