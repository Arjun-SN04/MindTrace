// Shared types used by the client and the server.
// Everything here describes authoritative case data or persisted progress.

export type Vec3 = [number, number, number];

export type CharacterId = 'daniel_reed' | 'maya_chen' | 'inspector_rao' | 'elias_moreau' | 'unknown';

export type LocationId =
  | 'calloway_street'
  | 'halvorsen_lobby'
  | 'unit_1c'
  | 'noctua_alley'
  | 'alex_phone';

export type EvidenceType = 'message' | 'digital' | 'physical' | 'document' | 'footage' | 'photograph';

/** How the evidence should be treated in deduction. */
export type EvidenceStatus = 'confirmed' | 'claim' | 'hypothesis' | 'disproven';

export type Reliability = 'verified' | 'unverified' | 'questionable';

export interface TimelineEntry {
  /** 24h clock time on the night of the disappearance, "HH:MM". */
  time: string;
  label: string;
}

export interface ClueDefinition {
  id: string;
  name: string;
  /** One-line summary for lists. */
  summary: string;
  /** What the clue says, as recorded in the case file. */
  description: string;
  location: LocationId;
  type: EvidenceType;
  status: EvidenceStatus;
  reliability: Reliability;
  relatedCharacters: CharacterId[];
  timestamps: TimelineEntry[];
  /** Other clue IDs this clue relates to. */
  links: string[];
  /** Clue IDs that must already be discovered before this one can be. */
  requires: string[];
  /** Present when the clue has a deeper reading the player can unlock. */
  interpretation?: {
    action: string;
    insight: string;
    timestamps?: TimelineEntry[];
  };
}

export interface CharacterDossier {
  id: CharacterId;
  name: string;
  role: string;
  /** Public background that Alex knows or can easily look up. No secrets. */
  publicBio: string;
}

export interface Contradiction {
  id: string;
  title: string;
  description: string;
  /** All of these clues must be discovered. */
  clueIds: string[];
  /** These clues must also be interpreted. */
  requiresInterpreted: string[];
}

export type Condition =
  | { type: 'flag'; flag: string }
  | { type: 'discovered'; ids: string[]; min?: number }
  | { type: 'interpreted'; id: string }
  | { type: 'all'; conditions: Condition[] };

export interface ObjectiveDefinition {
  id: string;
  text: string;
  /** Optional detail line shown under the objective. */
  hint?: string;
  condition: Condition;
}

export interface DiscoveredClue {
  id: string;
  /** Epoch ms. */
  discoveredAt: number;
  interpreted: boolean;
}

export interface ProgressSnapshot {
  discovered: DiscoveredClue[];
  flags: string[];
}

export const SAVE_VERSION = 1;

export interface SaveGame {
  version: typeof SAVE_VERSION;
  savedAt: number;
  district: string;
  position: Vec3;
  yaw: number;
  discovered: DiscoveredClue[];
  flags: string[];
  /** Derived from progress. The server recomputes this and never trusts the client copy. */
  completedObjectives: string[];
}
