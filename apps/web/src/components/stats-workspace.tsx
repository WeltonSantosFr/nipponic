"use client";

import { useMemo, useState, useCallback } from "react";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  CheckCircle2,
  Calendar,
  BarChart3,
  TrendingUp,
  RotateCcw,
  Clock,
  Award,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Deck, StudyStats } from "@nipponic/shared";
import { isCardDue } from "@/lib/srs";

export function StatsWorkspace() {
  const { isAuthenticated } = useAuth();
  const {
    cards,
    decks,
    studyStats,
    refreshStats,
    startPlayingDeck,
    getDueCards,
  } = useFlashCards();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!refreshStats) return;
    setIsRefreshing(true);
    try {
      await refreshStats();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshStats]);

  // Compute local fallback cards breakdown if offline or unauthenticated
  const localBreakdown = useMemo(() => {
    let newCards = 0;
    let learning = 0;
    let mature = 0;
    let dueToday = 0;

    const hasDecksWithCards = (decks || []).some(
      (d) => (d.cards || []).length > 0
    );
    const activeCards = hasDecksWithCards
      ? Array.from(
          new Map(
            (decks || []).flatMap((d) => (d.cards || []).map((c) => [c.id, c]))
          ).values()
        )
      : cards;

    for (const card of activeCards) {
      if (isCardDue(card)) dueToday++;
      const reps = card.repetitions ?? 0;
      const interval = card.interval ?? 0;
      if (reps === 0) {
        newCards++;
      } else if (interval < 21) {
        learning++;
      } else {
        mature++;
      }
    }

    return {
      total: activeCards.length,
      newCards,
      learning,
      mature,
      dueToday,
    };
  }, [cards, decks]);

  const stats: StudyStats = useMemo(() => {
    if (studyStats) return studyStats;

    // Fallback default state
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      streak: {
        current: 0,
        longest: 0,
        lastStudiedAt: null,
        isActiveToday: false,
      },
      today: {
        reviewsCount: 0,
        targetReviews: 20,
        retentionRate: 100,
      },
      cardsBreakdown: localBreakdown,
      ratingsDistribution: {
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
        totalReviews: 0,
      },
      heatmap: Array.from({ length: 364 }, (_, i) => {
        const d = new Date(Date.now() - (363 - i) * 24 * 60 * 60 * 1000);
        return {
          date: d.toISOString().slice(0, 10),
          count: 0,
        };
      }),
      forecast: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        return {
          date: d.toISOString().slice(0, 10),
          dayLabel: i === 0 ? "Today" : dayNames[d.getUTCDay()] ?? "Day",
          count: i === 0 ? localBreakdown.dueToday : 0,
        };
      }),
    };
  }, [studyStats, localBreakdown]);

  const dueCardsList = useMemo(() => {
    return getDueCards ? getDueCards() : cards.filter(isCardDue);
  }, [getDueCards, cards]);

  const handleStartDueReview = useCallback(() => {
    if (dueCardsList.length === 0) return;
    const reviewDeck: Deck = {
      id: "all-due",
      name: `Daily Due Review (${dueCardsList.length})`,
      cards: dueCardsList,
      isPublic: false,
    };
    startPlayingDeck(reviewDeck);
  }, [dueCardsList, startPlayingDeck]);

  // Heatmap: 52 columns of 7 days
  const heatmapColumns = useMemo(() => {
    const cols: Array<Array<{ date: string; count: number }>> = [];
    for (let c = 0; c < 52; c++) {
      cols.push(stats.heatmap.slice(c * 7, (c + 1) * 7));
    }
    return cols;
  }, [stats.heatmap]);

  const maxForecastCount = useMemo(() => {
    const counts = stats.forecast.map((f) => f.count);
    return Math.max(...counts, 1);
  }, [stats.forecast]);

  const targetPercentage = Math.min(
    100,
    Math.round((stats.today.reviewsCount / stats.today.targetReviews) * 100)
  );

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 flex flex-col gap-5 sm:gap-6 pb-safe">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0 border-b border-border/60 pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              Study Statistics & Progress
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            Track your daily streak, spaced repetition retention, and upcoming study workload.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
          >
            <RotateCcw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {!isAuthenticated && (
        <Card className="border-amber-500/30 bg-amber-500/5 text-foreground shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert className="text-amber-500 shrink-0 h-5 w-5" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium">Guest Mode Active</p>
                <p className="text-xs text-muted-foreground break-words">
                  Sign in to sync your study streaks, view your activity heatmap, and save review history across devices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Hero Cards: Streak, Today's Goal, Due Action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0">
        {/* Card 1: Streak */}
        <Card className="shadow-xs border-border/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Flame size={72} className="text-amber-500" />
          </div>
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Study Streak
              </span>
              <Badge
                variant={stats.streak.isActiveToday ? "default" : "secondary"}
                className={`text-[11px] font-semibold gap-1 ${
                  stats.streak.isActiveToday
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "text-muted-foreground"
                }`}
              >
                <Flame size={12} className={stats.streak.isActiveToday ? "fill-white" : ""} />
                {stats.streak.isActiveToday ? "Active Today" : "Resting"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {stats.streak.current}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {stats.streak.current === 1 ? "day" : "days"} streak
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.streak.longest > 0 ? (
                <>Best record: <strong className="text-foreground">{stats.streak.longest}</strong> consecutive days</>
              ) : (
                "Review cards daily to build your streak!"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Today's Target */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Today&apos;s Reviews
              </span>
              <span className="text-xs font-bold text-primary">
                {stats.today.reviewsCount} / {stats.today.targetReviews}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
            <div className="space-y-1.5">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${targetPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{targetPercentage}% of daily goal</span>
                <span>
                  {stats.today.reviewsCount >= stats.today.targetReviews
                    ? "Goal Reached! 🎉"
                    : `${stats.today.targetReviews - stats.today.reviewsCount} cards left`}
                </span>
              </div>
            </div>
            <div className="pt-1 flex items-center justify-between text-xs border-t border-border/50">
              <span className="text-muted-foreground">Today&apos;s Retention:</span>
              <span className="font-semibold text-foreground">
                {stats.today.retentionRate}% correct
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Due Cards Quick Review */}
        <Card className="shadow-xs border-border/80 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cards Due Now
              </span>
              <Clock size={16} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {dueCardsList.length}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {dueCardsList.length === 1 ? "card ready" : "cards ready"}
              </span>
            </div>

            {dueCardsList.length > 0 ? (
              <Button
                onClick={handleStartDueReview}
                className="w-full gap-2 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Flame size={14} className="fill-current" />
                <span>Review Due Cards Now</span>
                <ArrowRight size={14} />
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 py-1.5">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>All caught up! No reviews due right now.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SRS Memory Stage Breakdown */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="space-y-0.5 min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold">
                Spaced Repetition Memory Stages
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribution of your {stats.cardsBreakdown.total} cards across SRS learning phases.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              {stats.cardsBreakdown.total} Total Cards
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {/* Proportional Segmented Progress Bar */}
          {stats.cardsBreakdown.total > 0 ? (
            <div className="w-full bg-muted rounded-full h-3 flex overflow-hidden">
              <div
                title={`New: ${stats.cardsBreakdown.newCards} cards`}
                style={{
                  width: `${(stats.cardsBreakdown.newCards / stats.cardsBreakdown.total) * 100}%`,
                }}
                className="bg-sky-500 transition-all duration-300"
              />
              <div
                title={`Learning: ${stats.cardsBreakdown.learning} cards`}
                style={{
                  width: `${(stats.cardsBreakdown.learning / stats.cardsBreakdown.total) * 100}%`,
                }}
                className="bg-amber-500 transition-all duration-300"
              />
              <div
                title={`Mature: ${stats.cardsBreakdown.mature} cards`}
                style={{
                  width: `${(stats.cardsBreakdown.mature / stats.cardsBreakdown.total) * 100}%`,
                }}
                className="bg-emerald-500 transition-all duration-300"
              />
            </div>
          ) : (
            <div className="w-full bg-muted rounded-full h-3" />
          )}

          {/* Breakdown Stage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full min-w-0">
            {/* New */}
            <div className="p-3.5 rounded-lg border border-sky-500/20 bg-sky-500/5 flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                  New Cards
                </span>
                <span className="h-2 w-2 rounded-full bg-sky-500" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {stats.cardsBreakdown.newCards}
              </span>
              <p className="text-[11px] text-muted-foreground break-words">
                Never reviewed yet. Will enter SRS queue on first play.
              </p>
            </div>

            {/* Learning */}
            <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Learning
                </span>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {stats.cardsBreakdown.learning}
              </span>
              <p className="text-[11px] text-muted-foreground break-words">
                Interval &lt; 21 days. Being reinforced into long-term memory.
              </p>
            </div>

            {/* Mature */}
            <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Mature
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {stats.cardsBreakdown.mature}
              </span>
              <p className="text-[11px] text-muted-foreground break-words">
                Interval &ge; 21 days. Solidified in long-term memory.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consistency Heatmap (52-week calendar grid) */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5 min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <span>Annual Study Consistency</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                52-week activity calendar showing review frequency over the past year.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-[2px] bg-muted/60" />
              <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500/35" />
              <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500/60" />
              <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500/80" />
              <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500" />
              <span>More</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          {/* Isolated horizontal scroll container strictly compliant with mobile-first standards */}
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card p-3 sm:p-4 min-w-0 max-w-full">
            <div className="inline-flex flex-col gap-1 min-w-max">
              <div className="flex gap-1">
                {heatmapColumns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1">
                    {col.map((day, dayIdx) => {
                      let colorClass = "bg-muted/40 dark:bg-muted/20";
                      if (day.count >= 20) {
                        colorClass = "bg-emerald-500";
                      } else if (day.count >= 10) {
                        colorClass = "bg-emerald-500/80";
                      } else if (day.count >= 5) {
                        colorClass = "bg-emerald-500/60";
                      } else if (day.count >= 1) {
                        colorClass = "bg-emerald-500/35";
                      }

                      return (
                        <div
                          key={`${day.date}-${dayIdx}`}
                          title={`${day.count} review${day.count === 1 ? "" : "s"} on ${day.date}`}
                          className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${colorClass}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Scroll horizontally to view past weeks. Tap any square to view daily review counts.
          </p>
        </CardContent>
      </Card>

      {/* Grid: 7-Day Forecast & Feedback Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
        {/* 7-Day Review Forecast */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 size={17} className="text-primary" />
              <span>7-Day Review Forecast</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Projected cards scheduled for review over the coming week.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="h-44 flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-border/60">
              {stats.forecast.map((day, idx) => {
                const heightPct = Math.max(
                  12,
                  Math.round((day.count / maxForecastCount) * 100)
                );

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-0"
                  >
                    <span className="text-[10px] font-semibold text-foreground">
                      {day.count}
                    </span>
                    <div className="w-full max-w-[28px] bg-muted/60 rounded-t-md h-full flex items-end justify-center overflow-hidden">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          idx === 0
                            ? "bg-primary"
                            : day.count > 0
                            ? "bg-primary/70"
                            : "bg-muted"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground truncate w-full text-center">
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Reviews dynamically adjust based on your daily recall ratings and spaced repetition intervals.
            </p>
          </CardContent>
        </Card>

        {/* Ratings Feedback Distribution */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award size={17} className="text-primary" />
              <span>Retention & Recall Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown of your review responses across all sessions ({stats.ratingsDistribution.totalReviews} total).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Again */}
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <span>Again (1)</span>
                  <span>
                    {stats.ratingsDistribution.totalReviews > 0
                      ? Math.round((stats.ratingsDistribution.again / stats.ratingsDistribution.totalReviews) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {stats.ratingsDistribution.again}
                </div>
                <p className="text-[10px] text-muted-foreground">Forgot / Reset</p>
              </div>

              {/* Hard */}
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Hard (2)</span>
                  <span>
                    {stats.ratingsDistribution.totalReviews > 0
                      ? Math.round((stats.ratingsDistribution.hard / stats.ratingsDistribution.totalReviews) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {stats.ratingsDistribution.hard}
                </div>
                <p className="text-[10px] text-muted-foreground">Struggled to recall</p>
              </div>

              {/* Good */}
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Good (3)</span>
                  <span>
                    {stats.ratingsDistribution.totalReviews > 0
                      ? Math.round((stats.ratingsDistribution.good / stats.ratingsDistribution.totalReviews) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {stats.ratingsDistribution.good}
                </div>
                <p className="text-[10px] text-muted-foreground">Recalled with effort</p>
              </div>

              {/* Easy */}
              <div className="p-3 rounded-lg border border-sky-500/20 bg-sky-500/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                  <span>Easy (4)</span>
                  <span>
                    {stats.ratingsDistribution.totalReviews > 0
                      ? Math.round((stats.ratingsDistribution.easy / stats.ratingsDistribution.totalReviews) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {stats.ratingsDistribution.easy}
                </div>
                <p className="text-[10px] text-muted-foreground">Immediate recall</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Overall Retention Rate:</span>
              <span className="font-bold text-foreground text-sm">
                {stats.today.retentionRate}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
