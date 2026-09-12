import type { Card, CardSRSStage, ReviewRating, SRSResult, SRSCardState } from "@nipponic/shared";
import { calculateNextReview } from "@nipponic/shared";

export type { CardSRSStage, SRSResult, SRSCardState };
export { calculateNextReview };

/**
 * Formats a predicted interval preview (e.g. "<10m", "1d", "3d", "2mo")
 */
export function formatIntervalPreview(
  card: SRSCardState,
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
