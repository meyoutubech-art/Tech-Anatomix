export type GameSuitabilityTier =
  | 'dedicated_game'
  | 'reusable_challenge'
  | 'knowledge_quiz_only'
  | 'not_suitable';

export type HybridGameMode =
  | 'science_mission'
  | 'interactive_experiment'
  | 'prediction_challenge'
  | 'science_puzzle'
  | 'dedicated_game'
  | 'mixed_mission';

export type DifficultyTier = 'Beginner' | 'Intermediate' | 'Advanced';

export interface MissionCompletionRecord {
  missionId: string;
  modelId: string;
  bestScore: number;
  maxPossibleScore: number;
  stars: 1 | 2 | 3;
  xpEarned: number;
  hintsUsed: number;
  completedAt: number;
  attemptsCount: number;
  predictionCorrect: boolean;
}

export interface RecentGameEntry {
  missionId: string;
  modelId: string;
  title: string;
  category: string;
  lastPlayedAt: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: 'mastery' | 'physics' | 'chemistry' | 'biology' | 'inquiry';
  xpBonus: number;
  requirementText: string;
}

export interface PlayerArenaProfile {
  version: number;
  xp: number;
  level: number;
  rankTitle: string;
  totalScore: number;
  completedMissions: Record<string, MissionCompletionRecord>;
  unlockedBadgeIds: string[];
  recentlyPlayed: RecentGameEntry[];
  predictionsAttempted: number;
  predictionsCorrect: number;
  experimentsVerified: number;
  puzzlesSolved: number;
  updatedAt: number;
}

export const ARENA_STORAGE_KEY = 'tech_anatomix_science_arena_progress_v1';
const CURRENT_SCHEMA_VERSION = 1;

export const ARENA_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 'first_empirical_proof',
    title: 'First Empirical Proof',
    description: 'Complete your first interactive 3D science mission in the Gaming Arena.',
    category: 'mastery',
    xpBonus: 100,
    requirementText: 'Complete 1 mission',
  },
  {
    id: 'hypothesis_validator',
    title: 'Hypothesis Validator',
    description: 'Correctly predict the scientific outcome before running an experiment 3 times.',
    category: 'inquiry',
    xpBonus: 150,
    requirementText: '3 correct scientific predictions',
  },
  {
    id: 'harmonic_physicist',
    title: 'Harmonic & Mechanics Scholar',
    description: 'Master a Physics mechanics, wave, or electromagnetism mission.',
    category: 'physics',
    xpBonus: 150,
    requirementText: 'Complete a Physics mission with at least 2 stars',
  },
  {
    id: 'stoichiometry_alchemist',
    title: 'Analytical Chemist',
    description: 'Synthesize a verified chemical reaction in the 3D Beaker Reaction Quest.',
    category: 'chemistry',
    xpBonus: 175,
    requirementText: 'Complete a Chemistry mission',
  },
  {
    id: 'biosystems_navigator',
    title: 'Bio-Systems Navigator',
    description: 'Complete a Biology or Anatomy structure-and-function mission.',
    category: 'biology',
    xpBonus: 150,
    requirementText: 'Complete a Biology or Anatomy mission',
  },
  {
    id: 'zero_hint_theorist',
    title: 'Zero-Hint Theorist',
    description: 'Complete any mission with a 3-star rating and zero hints used.',
    category: 'inquiry',
    xpBonus: 200,
    requirementText: 'Earn 3 stars on any mission without using hints',
  },
  {
    id: 'polymath_explorer',
    title: 'Cross-Disciplinary Polymath',
    description: 'Complete at least 5 distinct science missions across multiple disciplines.',
    category: 'mastery',
    xpBonus: 300,
    requirementText: 'Complete 5 distinct missions',
  },
  {
    id: 'precision_experimentalist',
    title: 'Precision Experimentalist',
    description: 'Calibrate and verify 5 live 3D simulation parameter targets.',
    category: 'inquiry',
    xpBonus: 200,
    requirementText: 'Verify 5 interactive 3D simulation experiments',
  },
];

export function calculateLevelFromXp(xp: number): {
  level: number;
  rankTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  // Every level requires progressively more XP: Level 1 = 0..299, Level 2 = 300..699, etc.
  const level = Math.floor(Math.sqrt(safeXp / 150)) + 1;
  const currentThreshold = 150 * Math.pow(level - 1, 2);
  const nextThreshold = 150 * Math.pow(level, 2);
  const span = Math.max(1, nextThreshold - currentThreshold);
  const intoLevel = Math.max(0, safeXp - currentThreshold);
  const progressPercent = Math.min(100, Math.round((intoLevel / span) * 100));

  const ranks = [
    'Lab Apprentice',
    'Junior Experimentalist',
    'Simulation Specialist',
    'Systems Investigator',
    'Theoretical Analyst',
    'Principal Research Fellow',
    'Chief Science Architect',
  ];
  const rankTitle = ranks[Math.min(ranks.length - 1, level - 1)];

  return {
    level,
    rankTitle,
    currentLevelXp: intoLevel,
    nextLevelXp: span,
    progressPercent,
  };
}

export function createDefaultArenaProfile(): PlayerArenaProfile {
  const lvl = calculateLevelFromXp(0);
  return {
    version: CURRENT_SCHEMA_VERSION,
    xp: 0,
    level: lvl.level,
    rankTitle: lvl.rankTitle,
    totalScore: 0,
    completedMissions: {},
    unlockedBadgeIds: [],
    recentlyPlayed: [],
    predictionsAttempted: 0,
    predictionsCorrect: 0,
    experimentsVerified: 0,
    puzzlesSolved: 0,
    updatedAt: Date.now(),
  };
}

export function loadArenaProfile(): PlayerArenaProfile {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultArenaProfile();
  }
  try {
    const raw = window.localStorage.getItem(ARENA_STORAGE_KEY);
    if (!raw) return createDefaultArenaProfile();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== CURRENT_SCHEMA_VERSION) {
      return createDefaultArenaProfile();
    }
    const safeXp = typeof parsed.xp === 'number' && Number.isFinite(parsed.xp) ? Math.max(0, parsed.xp) : 0;
    const lvl = calculateLevelFromXp(safeXp);
    return {
      version: CURRENT_SCHEMA_VERSION,
      xp: safeXp,
      level: lvl.level,
      rankTitle: lvl.rankTitle,
      totalScore: typeof parsed.totalScore === 'number' ? Math.max(0, parsed.totalScore) : 0,
      completedMissions:
        parsed.completedMissions && typeof parsed.completedMissions === 'object'
          ? parsed.completedMissions
          : {},
      unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds) ? parsed.unlockedBadgeIds : [],
      recentlyPlayed: Array.isArray(parsed.recentlyPlayed) ? parsed.recentlyPlayed.slice(0, 8) : [],
      predictionsAttempted: Number(parsed.predictionsAttempted) || 0,
      predictionsCorrect: Number(parsed.predictionsCorrect) || 0,
      experimentsVerified: Number(parsed.experimentsVerified) || 0,
      puzzlesSolved: Number(parsed.puzzlesSolved) || 0,
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
  } catch {
    return createDefaultArenaProfile();
  }
}

export function saveArenaProfile(profile: PlayerArenaProfile): PlayerArenaProfile {
  const lvl = calculateLevelFromXp(profile.xp);
  const normalized: PlayerArenaProfile = {
    ...profile,
    version: CURRENT_SCHEMA_VERSION,
    level: lvl.level,
    rankTitle: lvl.rankTitle,
    updatedAt: Date.now(),
  };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(ARENA_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore quota errors gracefully
    }
  }
  return normalized;
}

export function resetArenaProfile(): PlayerArenaProfile {
  const fresh = createDefaultArenaProfile();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(ARENA_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
  }
  return fresh;
}

export function recordRecentlyPlayed(
  profile: PlayerArenaProfile,
  entry: Omit<RecentGameEntry, 'lastPlayedAt'>
): PlayerArenaProfile {
  const filtered = profile.recentlyPlayed.filter((r) => r.missionId !== entry.missionId);
  const updated: RecentGameEntry[] = [
    { ...entry, lastPlayedAt: Date.now() },
    ...filtered,
  ].slice(0, 8);

  return saveArenaProfile({
    ...profile,
    recentlyPlayed: updated,
  });
}

export interface MissionCompletionOutcome {
  updatedProfile: PlayerArenaProfile;
  newlyUnlockedBadges: AchievementBadge[];
  xpGained: number;
  starsEarned: 1 | 2 | 3;
  leveledUp: boolean;
}

export function recordMissionCompletion(
  currentProfile: PlayerArenaProfile,
  params: {
    missionId: string;
    modelId: string;
    category: 'Physics' | 'Chemistry' | 'Biology' | 'Anatomy' | 'Cross-Disciplinary';
    score: number;
    maxScore: number;
    baseXpReward: number;
    hintsUsed: number;
    predictionCorrect: boolean;
    experimentVerified: boolean;
    puzzleSolved: boolean;
  }
): MissionCompletionOutcome {
  const prevLevel = currentProfile.level;
  const ratio = params.maxScore > 0 ? params.score / params.maxScore : 1;
  const starsEarned: 1 | 2 | 3 = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;

  const existing = currentProfile.completedMissions[params.missionId];
  const isFirstCompletion = !existing;
  const isHigherScore = existing ? params.score > existing.bestScore : true;

  // Award full XP on first completion, or delta XP if improving score, plus replay practice XP (25%)
  const rawXpEarned = Math.round(params.baseXpReward * (0.5 + 0.5 * ratio));
  const xpFromMission = isFirstCompletion
    ? rawXpEarned
    : isHigherScore
    ? Math.max(25, rawXpEarned - existing.xpEarned)
    : 25;

  const updatedMissions: Record<string, MissionCompletionRecord> = {
    ...currentProfile.completedMissions,
    [params.missionId]: {
      missionId: params.missionId,
      modelId: params.modelId,
      bestScore: existing ? Math.max(existing.bestScore, params.score) : params.score,
      maxPossibleScore: params.maxScore,
      stars: existing ? (Math.max(existing.stars, starsEarned) as 1 | 2 | 3) : starsEarned,
      xpEarned: existing ? Math.max(existing.xpEarned, rawXpEarned) : rawXpEarned,
      hintsUsed: existing ? Math.min(existing.hintsUsed, params.hintsUsed) : params.hintsUsed,
      completedAt: Date.now(),
      attemptsCount: (existing?.attemptsCount || 0) + 1,
      predictionCorrect: Boolean(existing?.predictionCorrect || params.predictionCorrect),
    },
  };

  const nextPredictionsAttempted = currentProfile.predictionsAttempted + 1;
  const nextPredictionsCorrect =
    currentProfile.predictionsCorrect + (params.predictionCorrect ? 1 : 0);
  const nextExperimentsVerified =
    currentProfile.experimentsVerified + (params.experimentVerified ? 1 : 0);
  const nextPuzzlesSolved = currentProfile.puzzlesSolved + (params.puzzleSolved ? 1 : 0);

  const unlockedSet = new Set<string>(currentProfile.unlockedBadgeIds);
  const newlyUnlockedBadges: AchievementBadge[] = [];

  const tryUnlock = (badgeId: string, condition: boolean) => {
    if (!condition || unlockedSet.has(badgeId)) return;
    const badge = ARENA_ACHIEVEMENTS.find((b) => b.id === badgeId);
    if (badge) {
      unlockedSet.add(badgeId);
      newlyUnlockedBadges.push(badge);
    }
  };

  const completedCount = Object.keys(updatedMissions).length;

  tryUnlock('first_empirical_proof', completedCount >= 1);
  tryUnlock('hypothesis_validator', nextPredictionsCorrect >= 3);
  tryUnlock(
    'harmonic_physicist',
    params.category === 'Physics' && starsEarned >= 2
  );
  tryUnlock('stoichiometry_alchemist', params.category === 'Chemistry');
  tryUnlock(
    'biosystems_navigator',
    params.category === 'Biology' || params.category === 'Anatomy'
  );
  tryUnlock('zero_hint_theorist', starsEarned === 3 && params.hintsUsed === 0);
  tryUnlock('polymath_explorer', completedCount >= 5);
  tryUnlock('precision_experimentalist', nextExperimentsVerified >= 5);

  const badgeXpBonus = newlyUnlockedBadges.reduce((sum, b) => sum + b.xpBonus, 0);
  const totalXpGained = xpFromMission + badgeXpBonus;
  const nextXp = currentProfile.xp + totalXpGained;

  const totalScoreSum = Object.values(updatedMissions).reduce(
    (sum, rec) => sum + rec.bestScore,
    0
  );

  const saved = saveArenaProfile({
    ...currentProfile,
    xp: nextXp,
    totalScore: totalScoreSum,
    completedMissions: updatedMissions,
    unlockedBadgeIds: Array.from(unlockedSet),
    predictionsAttempted: nextPredictionsAttempted,
    predictionsCorrect: nextPredictionsCorrect,
    experimentsVerified: nextExperimentsVerified,
    puzzlesSolved: nextPuzzlesSolved,
  });

  return {
    updatedProfile: saved,
    newlyUnlockedBadges,
    xpGained: totalXpGained,
    starsEarned,
    leveledUp: saved.level > prevLevel,
  };
}
