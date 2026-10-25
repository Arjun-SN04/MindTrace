// Pure progress logic shared by the client (for UI) and the server (for validation).

import { CLUES, CONTRADICTIONS, KNOWN_FLAGS, OBJECTIVES } from './case01';
import type {
  ClueDefinition,
  Condition,
  Contradiction,
  ObjectiveDefinition,
  ProgressSnapshot,
} from './types';

const clueIndex = new Map(CLUES.map((c) => [c.id, c]));

export function getClue(id: string): ClueDefinition | undefined {
  return clueIndex.get(id);
}

export function evaluateCondition(condition: Condition, progress: ProgressSnapshot): boolean {
  switch (condition.type) {
    case 'flag':
      return progress.flags.includes(condition.flag);
    case 'discovered': {
      const found = condition.ids.filter((id) => progress.discovered.some((d) => d.id === id)).length;
      return found >= (condition.min ?? condition.ids.length);
    }
    case 'interpreted':
      return progress.discovered.some((d) => d.id === condition.id && d.interpreted);
    case 'all':
      return condition.conditions.every((c) => evaluateCondition(c, progress));
  }
}

export function computeCompletedObjectives(progress: ProgressSnapshot): string[] {
  return OBJECTIVES.filter((o) => evaluateCondition(o.condition, progress)).map((o) => o.id);
}

/** The first objective that is not yet complete, or null when the slice is finished. */
export function currentObjective(progress: ProgressSnapshot): ObjectiveDefinition | null {
  return OBJECTIVES.find((o) => !evaluateCondition(o.condition, progress)) ?? null;
}

export function activeContradictions(progress: ProgressSnapshot): Contradiction[] {
  return CONTRADICTIONS.filter(
    (c) =>
      c.clueIds.every((id) => progress.discovered.some((d) => d.id === id)) &&
      c.requiresInterpreted.every((id) => progress.discovered.some((d) => d.id === id && d.interpreted)),
  );
}

export function canDiscover(clueId: string, progress: ProgressSnapshot): boolean {
  const clue = clueIndex.get(clueId);
  if (!clue) return false;
  return clue.requires.every((req) => progress.discovered.some((d) => d.id === req));
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Checks that a progress snapshot could have been reached by actually playing.
 * Used by the server before persisting a save.
 */
export function validateProgress(progress: ProgressSnapshot, now = Date.now()): ValidationResult {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const d of progress.discovered) {
    const clue = clueIndex.get(d.id);
    if (!clue) {
      errors.push(`Unknown clue "${d.id}"`);
      continue;
    }
    if (seen.has(d.id)) errors.push(`Duplicate clue "${d.id}"`);
    seen.add(d.id);
    if (d.interpreted && !clue.interpretation) errors.push(`Clue "${d.id}" has no interpretation`);
    if (d.discoveredAt > now + 60_000) errors.push(`Clue "${d.id}" discovered in the future`);
    for (const req of clue.requires) {
      const prereq = progress.discovered.find((p) => p.id === req);
      if (!prereq) errors.push(`Clue "${d.id}" requires "${req}"`);
      else if (prereq.discoveredAt > d.discoveredAt) errors.push(`Clue "${d.id}" found before its prerequisite "${req}"`);
    }
  }

  const known = new Set<string>(KNOWN_FLAGS);
  for (const f of progress.flags) {
    if (!known.has(f)) errors.push(`Unknown flag "${f}"`);
  }
  if (progress.flags.includes('reviewed_contradiction') && activeContradictions(progress).length === 0) {
    errors.push('Cannot have reviewed a contradiction before finding one');
  }
  if (progress.flags.includes('entered_apartment') && !progress.flags.includes('entered_building')) {
    errors.push('Cannot enter the apartment without entering the building');
  }

  return { ok: errors.length === 0, errors };
}
