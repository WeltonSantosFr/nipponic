import type { Card, CardSRSStage, ReviewRating, SRSResult } from "@nipponic/shared";

export type { CardSRSStage, SRSResult };

/**
 * Calculates next review parameters based on the SuperMemo-2 (SM-2) algorithm.
 */
export function calculateNextReview(
  card: Pick<Card, "interval" | "easeFactor" | "repetitions" | "lapses">,
  rating: ReviewRating
): SRSResult {
  const currentEase = card.easeFactor ?? 2.5;
  const currentReps = card.repetitions ?? 0;
  const currentInterval = card.interval ?? 0;
  const currentLapses = card.lapses ?? 0;

  let newInterval = 1;
  let newEase = currentEase;
  let newReps = currentReps;
  let newLapses = currentLapses;
  let nextReviewDate: Date;

  const now = new Date();

  switch (rating) {
    case 1: // Again (Forgot)
      newReps = 0;
      newInterval = 0; // Due immediately / in 10 minutes
      newLapses = currentLapses + 1;
      newEase = Math.max(1.3, currentEase - 0.2);
      nextReviewDate = new Date(now.getTime() + 10 * 60 * 1000); // in 10 min
      break;

    case 2: // Hard (Difficult recall)
      newReps = currentReps + 1;
      newInterval = currentInterval <= 1 ? 1 : Math.max(1, Math.round(currentInterval * 1.2));
      newEase = Math.max(1.3, currentEase - 0.15);
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
      break;

    case 3: // Good (Standard correct recall)
      if (currentReps === 0) {
        newInterval = 1;
      } else if (currentReps === 1) {
        newInterval = 3;
      } else {
        newInterval = Math.max(1, Math.round((currentInterval || 1) * currentEase));
      }
      newReps = currentReps + 1;
      newEase = currentEase;
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
      break;

    case 4: // Easy (Instant effortless recall)
      if (currentReps === 0) {
        newInterval = 4;
      } else if (currentReps === 1) {
        newInterval = 7;
      } else {
        newInterval = Math.max(1, Math.round((currentInterval || 1) * currentEase * 1.3));
      }
      newReps = currentReps + 1;
      newEase = currentEase + 0.15;
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
      break;
  }

  return {
    interval: newInterval,
    easeFactor: Math.round(newEase * 100) / 100,
    repetitions: newReps,
    lapses: newLapses,
    nextReviewAt: nextReviewDate.toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}

/**
 * Formats a predicted interval preview (e.g. "<10m", "1d", "3d", "2mo")
 */
export function formatIntervalPreview(
  card: Pick<Card, "interval" | "easeFactor" | "repetitions" | "lapses">,
  rating: ReviewRating
): string {
  const result = calculateNextReview(card, rating);
  if (result.interval === 0) return "<10m";
  if (result.interval === 1) return "1d";
  if (result.interval < 30) return `${result.interval}d`;
  const months = Math.round(result.interval / 30);
  if (months < 12) return `${months}mo`;
  const years = (result.interval / 365).toFixed(1);
  return `${years}y`;
}

/**
 * Checks if a card is currently due for review
 */
export function isCardDue(card: Card): boolean {
  if (!card.nextReviewAt) return true; // Unreviewed/new card is due
  const reviewTime = new Date(card.nextReviewAt).getTime();
  return reviewTime <= Date.now();
}

/**
 * Returns human-readable SRS stage for UI badges
 */
export function getCardSRSStage(card: Card): CardSRSStage {
  if (!card.lastReviewedAt && (!card.repetitions || card.repetitions === 0)) {
    return "new";
  }
  if ((card.repetitions ?? 0) < 2) {
    return "learning";
  }
  if ((card.interval ?? 0) >= 21) {
    return "mastered";
  }
  return "review";
}

/**
 * Returns a friendly label for when a card is due
 */
export function formatDueTime(nextReviewAt?: string | Date | null): string {
  if (!nextReviewAt) return "New (Due now)";
  const diffMs = new Date(nextReviewAt).getTime() - Date.now();
  if (diffMs <= 0) return "Due today";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    if (diffHours <= 1) return "Due in <1h";
    return `Due in ${diffHours}h`;
  }

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `Due in ${diffDays}d`;
}
