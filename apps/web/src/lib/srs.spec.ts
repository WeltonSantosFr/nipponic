import { describe, expect, it } from "vitest";
import { formatDueTime, formatIntervalPreview, getCardSRSStage, isCardDue } from "./srs";

describe("srs lib", () => {
  describe("formatIntervalPreview", () => {
    it("should return <10m when rating is 1 (Again)", () => {
      // Arrange
      const card = {
        interval: 5,
        easeFactor: 2.5,
        repetitions: 2,
        lapses: 0,
      };

      // Act
      const preview = formatIntervalPreview(card, 1);

      // Assert
      expect(preview).toBe("<10m");
    });

    it("should return 1d when predicted interval is 1 day", () => {
      // Arrange
      const card = {
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      // Act
      const preview = formatIntervalPreview(card, 3);

      // Assert
      expect(preview).toBe("1d");
    });

    it("should return format in days when predicted interval is less than 30 days", () => {
      // Arrange
      const card = {
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        lapses: 0,
      };

      // Act
      const preview = formatIntervalPreview(card, 3);

      // Assert
      expect(preview).toBe("3d");
    });

    it("should return format in months when predicted interval is between 30 and 365 days", () => {
      // Arrange
      const card = {
        interval: 30,
        easeFactor: 2.0,
        repetitions: 2,
        lapses: 0,
      };

      // Act
      const preview = formatIntervalPreview(card, 3);

      // Assert
      expect(preview).toBe("2mo");
    });

    it("should return format in years when predicted interval is 12 months or greater", () => {
      // Arrange
      const card = {
        interval: 365,
        easeFactor: 2.0,
        repetitions: 2,
        lapses: 0,
      };

      // Act
      const preview = formatIntervalPreview(card, 3);

      // Assert
      expect(preview).toBe("2.0y");
    });
  });

  describe("isCardDue", () => {
    it("should return true when card has no nextReviewAt date (new card)", () => {
      // Arrange
      const card = {
        id: "card-1",
        jpText: "食べる",
        enText: "to eat",
        nextReviewAt: null,
      } as any;

      // Act
      const due = isCardDue(card);

      // Assert
      expect(due).toBe(true);
    });

    it("should return true when review time is in the past", () => {
      // Arrange
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const card = {
        id: "card-1",
        jpText: "食べる",
        enText: "to eat",
        nextReviewAt: pastDate,
      } as any;

      // Act
      const due = isCardDue(card);

      // Assert
      expect(due).toBe(true);
    });

    it("should return false when review time is in the future", () => {
      // Arrange
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const card = {
        id: "card-1",
        jpText: "食べる",
        enText: "to eat",
        nextReviewAt: futureDate,
      } as any;

      // Act
      const due = isCardDue(card);

      // Assert
      expect(due).toBe(false);
    });
  });

  describe("getCardSRSStage", () => {
    it("should return 'new' when card has not been reviewed and has 0 repetitions", () => {
      // Arrange
      const card = {
        id: "card-1",
        jpText: "食べる",
        enText: "to eat",
        lastReviewedAt: null,
        repetitions: 0,
      } as any;

      // Act
      const stage = getCardSRSStage(card);

      // Assert
      expect(stage).toBe("new");
    });

    it("should return 'learning' when card has fewer than 2 repetitions", () => {
      // Arrange
      const card = {
        id: "card-1",
        jpText: "食べる",
        enText: "to eat",
        lastReviewedAt: new Date().toISOString(),
        repetitions: 1,
      } as any;

      // Act
      const stage = getCardSRSStage(card);

      // Assert
      expect(stage).toBe("learning");
    });

    it("should return 'mastered' when card interval is 21 days or more", () => {
      // Arrange
      const card = {
        id: "card-1",
        jpText: "食べる",
        enText: "to eat",
        lastReviewedAt: new Date().toISOString(),
        repetitions: 3,
        interval: 25,
      } as any;

      // Act
      const stage = getCardSRSStage(card);

      // Assert
      expect(stage).toBe("mastered");
    });

    it("should return 'review' when card is reviewed, repetitions >= 2, but interval < 21", () => {
      // Arrange
      const card = {
        id: "card-1",
        jpText: "食べる",
        enText: "to eat",
        lastReviewedAt: new Date().toISOString(),
        repetitions: 2,
        interval: 10,
      } as any;

      // Act
      const stage = getCardSRSStage(card);

      // Assert
      expect(stage).toBe("review");
    });
  });

  describe("formatDueTime", () => {
    it("should return 'New (Due now)' when nextReviewAt is null or undefined", () => {
      // Arrange & Act
      const label = formatDueTime(null);

      // Assert
      expect(label).toBe("New (Due now)");
    });

    it("should return 'Due today' when nextReviewAt is in the past or now", () => {
      // Arrange
      const pastDate = new Date(Date.now() - 5000);

      // Act
      const label = formatDueTime(pastDate);

      // Assert
      expect(label).toBe("Due today");
    });

    it("should return 'Due in <1h' when due in less than or equal to 1 hour", () => {
      // Arrange
      const futureDate = new Date(Date.now() + 30 * 60 * 1000);

      // Act
      const label = formatDueTime(futureDate);

      // Assert
      expect(label).toBe("Due in <1h");
    });

    it("should return format in hours when due between 2 and 23 hours", () => {
      // Arrange
      const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000);

      // Act
      const label = formatDueTime(futureDate);

      // Assert
      expect(label).toBe("Due in 5h");
    });

    it("should return format in days when due in 24 hours or more", () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // Act
      const label = formatDueTime(futureDate);

      // Assert
      expect(label).toBe("Due in 2d");
    });
  });
});
