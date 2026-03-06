// User types
export interface User {
    id: string;
    firebaseUid: string;
    email: string;
    name: string;
    photoUrl?: string;
    bio?: string;
    targetRole?: string;
    tokenBalance: number;
    openToWork: boolean;
    onboardingDone: boolean;
  }
  
  // Trust tier
  export type TrustTier =
    | "platform_verified"
    | "ai_verified"
    | "ai_extracted"
    | "self_reported";
  
  // Skill
  export interface Skill {
    id: string;
    userId: string;
    name: string;
    score: number;
    trustTier: TrustTier;
    evidenceCount: number;
  }
  
  // Opportunity
  export type OpportunityType =
    | "job"
    | "hackathon"
    | "coop"
    | "gdp"
    | "bootcamp"
    | "course"
    | "workshop";
  
  export interface Opportunity {
    id: string;
    type: OpportunityType;
    title: string;
    organization: string;
    description: string;
    applyUrl: string;
    matchScore?: number;
    missingSkills?: string[];
  }
  
  // Token actions
  export type TokenAction =
    | "refresh_all"
    | "refresh_one"
    | "ai_chat"
    | "export_cv"
    | "smart_export"
    | "verify_cert";