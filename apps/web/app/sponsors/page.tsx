"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Users,
  Code2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupporterBadge } from "@/components/supporter-badge";
import { getPublicSponsorsAction, mockSponsorAction, clearMockSponsorsAction } from "@/actions/sponsors";
import type { Sponsor } from "@nipponic/shared";

const GITHUB_SPONSORS_URL = "https://github.com/sponsors/WeltonSantosFr";

interface TierCardProps {
  icon: string;
  name: string;
  price: string;
  period: string;
  description: string;
  impact: string;
  url: string;
}

const TIERS: TierCardProps[] = [
  {
    icon: "🌱",
    name: "Green Tea (Sencha)",
    price: "$1",
    period: "/ month",
    description: "A cup of coffee or green tea for the developers.",
    impact: "Helps cover basic server costs and keeps background services running smoothly.",
    url: `${GITHUB_SPONSORS_URL}/sponsorships?tier_id=658971`,
  },
  {
    icon: "🍱",
    name: "Bento Box",
    price: "$3",
    period: "/ month",
    description: "A light meal fueling everyday study.",
    impact: "Helps maintain high availability for databases, dictionary caches, and fast APIs.",
    url: `${GITHUB_SPONSORS_URL}/sponsorships?tier_id=658972`,
  },
  {
    icon: "🍜",
    name: "Ramen",
    price: "$5",
    period: "/ month",
    description: "A hearty bowl of energy!",
    impact: "Drives the development of new features, advanced SRS algorithms, and curated decks.",
    url: `${GITHUB_SPONSORS_URL}/sponsorships?tier_id=658966`,
  },
  {
    icon: "✨",
    name: "One-Time Donation",
    price: "Custom",
    period: "one-time payment",
    description: "A one-time contribution of any amount.",
    impact: "Choose any custom amount on GitHub Sponsors to give a boost to the project whenever you wish.",
    url: `${GITHUB_SPONSORS_URL}?frequency=one-time`,
  },
];

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockUsername, setMockUsername] = useState("");
  const [mockTier, setMockTier] = useState("🌱 Green Tea");
  const [mockSuccess, setMockSuccess] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [isDev, setIsDev] = useState(false);

  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const data = await getPublicSponsorsAction();
      setSponsors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
    if (process.env.NODE_ENV === "development") {
      setIsDev(true);
    }
  }, []);

  const handleClearMock = async () => {
    if (!confirm("Are you sure you want to clear all mock sponsors?")) return;
    setMockLoading(true);
    setMockError(null);
    try {
      const res = await clearMockSponsorsAction();
      if (!res.success) {
        setMockError(res.message || "Failed to clear mock sponsors");
        return;
      }
      await fetchSponsors();
    } catch (err: any) {
      setMockError(err?.message || "Failed to clear mock sponsors");
    } finally {
      setMockLoading(false);
    }
  };

  const handleMockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = mockUsername.trim();
    if (!cleanUsername) return;

    setMockLoading(true);
    setMockError(null);
    setMockSuccess(false);

    try {
      const res = await mockSponsorAction({
        githubUsername: cleanUsername,
        name: cleanUsername,
        tierName: mockTier,
        monthlyPriceInCents: mockTier.includes("$5") ? 500 : mockTier.includes("$3") ? 300 : 100,
        isOneTime: mockTier.includes("One-Time"),
        isActive: true,
      });

      if (!res.success) {
        setMockError(res.message || "Failed to simulate sponsorship");
        return;
      }

      setMockSuccess(true);
      setMockUsername("");
      setTimeout(() => setMockSuccess(false), 4000);
      await fetchSponsors();
    } catch (err: any) {
      setMockError(err?.message || "An unexpected error occurred while simulating sponsorship");
    } finally {
      setMockLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Navigation */}
      <header className="border-b border-border/60 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Nipponic
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-0.5 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5">
              <Heart size={12} className="fill-rose-500 text-rose-500" />
              Sustainable Open Source
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider">
            <span>🇯🇵 Nipponic Community</span>
            <span className="text-muted-foreground">•</span>
            <span>100% Free For Everyone</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Support the{" "}
            <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
              Nipponic
            </span>{" "}
            Ecosystem
          </h1>

          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Nipponic is and will always remain <strong>100% free and open-source</strong>. There are no premium plans or features
            locked behind paywalls. Your support helps keep servers and databases running and fuels continuous development
            of new learning tools.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={GITHUB_SPONSORS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                size: "lg",
                className:
                  "gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-md",
              })}
            >
              <Heart size={16} className="fill-white" />
              Support on GitHub Sponsors
              <ExternalLink size={14} />
            </a>
            <a
              href="#mural"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              View Wall of Sponsors
            </a>
          </div>
        </section>

        {/* Pillars / Manifesto */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl border border-border/80 bg-card/60 flex flex-col gap-2">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <h3 className="font-semibold text-base">Zero Paywalled Features</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All features — dictionaries, kanji breakdown, SRS flashcards, and notes editor — are completely free forever.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border/80 bg-card/60 flex flex-col gap-2">
            <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart size={22} />
            </div>
            <h3 className="font-semibold text-base">Heartfelt Recognition</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Supporters receive a commemorative badge on their profile and an honorable spot on the project&apos;s Wall of Sponsors.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border/80 bg-card/60 flex flex-col gap-2">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap size={22} />
            </div>
            <h3 className="font-semibold text-base">0% Platform Fees (GitHub)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              GitHub Sponsors covers payment processing fees for individuals, ensuring 100% of your contribution reaches the project.
            </p>
          </div>
        </section>

        {/* Tiers Grid */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Symbolic Support Tiers
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose the option that fits your budget — every single dollar makes a genuine impact!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier) => (
              <Card
                key={tier.name}
                className="relative flex flex-col justify-between transition-all hover:shadow-lg border-border/80"
              >
                <CardHeader className="space-y-2 pb-4">
                  <div className="text-3xl">{tier.icon}</div>
                  <div>
                    <CardTitle className="text-lg font-bold">{tier.name}</CardTitle>
                    <CardDescription className="text-xs">{tier.description}</CardDescription>
                  </div>
                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">{tier.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="text-xs text-muted-foreground space-y-3 flex-1">
                  <p className="border-t border-border/60 pt-3">{tier.impact}</p>
                  <ul className="space-y-1.5 text-foreground/90 font-medium">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      Commemorative profile badge
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      Avatar on the Wall of Sponsors
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      Eternal community gratitude
                    </li>
                  </ul>
                </CardContent>

                <CardFooter className="pt-2">
                  <a
                    href={tier.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      className: "w-full gap-1.5 text-xs font-semibold",
                    })}
                  >
                    {tier.price === "Custom" ? "Donate Any Amount" : `Support with ${tier.price}`}
                    <ExternalLink size={13} />
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* How confirmation works */}
        <section className="rounded-2xl border border-border/80 bg-muted/20 p-6 md:p-8 space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} />
              How to activate your badge and appear on the Wall?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              The process is 100% automated and respects your privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                1
              </div>
              <h4 className="font-semibold text-foreground">Sponsor on GitHub</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose any tier or custom amount on GitHub Sponsors using your GitHub account.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                2
              </div>
              <h4 className="font-semibold text-foreground">Link Your Profile</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                In Nipponic, open your Account Profile and enter your <span className="font-mono">@username</span> in the GitHub field.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                3
              </div>
              <h4 className="font-semibold text-foreground">Instant Recognition</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The system verifies your sponsorship, activates your profile badge, and showcases your avatar on the Wall below!
              </p>
            </div>
          </div>
        </section>

        {/* Wall of Supporters / Mural de Apoiadores */}
        <section id="mural" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="text-rose-500" size={22} />
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Wall of Sponsors
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Incredible people helping keep Nipponic alive and accessible to learners worldwide.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchSponsors}
              disabled={loading}
              className="gap-1.5 text-xs w-fit"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh Wall
            </Button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-muted-foreground text-sm">
              <RefreshCw size={18} className="animate-spin mr-2" />
              Loading sponsors...
            </div>
          ) : sponsors.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-3">
              <div className="text-4xl">⛩️</div>
              <h3 className="font-semibold text-base">Be the First Patron of Nipponic!</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No sponsors recorded in this environment yet. Support on GitHub Sponsors and be the pioneer on our wall.
              </p>
              <a
                href={GITHUB_SPONSORS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm", className: "mt-2" })}
              >
                Support Now 💖
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card hover:border-border transition-all shadow-2xs group"
                >
                  <img
                    src={sponsor.avatarUrl || `https://github.com/${sponsor.githubUsername}.png`}
                    alt={sponsor.name || sponsor.githubUsername}
                    className="h-11 w-11 rounded-full border border-border/80 object-cover bg-muted shrink-0 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${sponsor.githubUsername}`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <a
                      href={`https://github.com/${sponsor.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm hover:underline hover:text-primary truncate block"
                    >
                      {sponsor.name || sponsor.githubUsername}
                    </a>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      @{sponsor.githubUsername}
                    </p>
                    <div className="mt-1">
                      <SupporterBadge
                        isSupporter={true}
                        isActiveSupporter={sponsor.isActive}
                        tierName={sponsor.tierName}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Developer Sandbox for Local Testing */}
        {isDev && (
          <section className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
              <Code2 size={16} />
              <span>Local Testing Sandbox (Dev Mock)</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Since you are in a local development environment, use this form to simulate sponsorships and test the wall and badges without needing real GitHub webhooks:
            </p>

            <form onSubmit={handleMockSubmit} className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="github-username"
                value={mockUsername}
                onChange={(e) => setMockUsername(e.target.value)}
                className="h-8 px-3 text-xs rounded-md border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary w-44"
              />
              <select
                value={mockTier}
                onChange={(e) => setMockTier(e.target.value)}
                className="h-8 px-2 text-xs rounded-md border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="🌱 Green Tea">🌱 Green Tea ($1)</option>
                <option value="🍱 Bento Box">🍱 Bento Box ($3)</option>
                <option value="🍜 Ramen">🍜 Ramen ($5)</option>
                <option value="✨ One-Time Donation">✨ One-Time Donation</option>
              </select>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={mockLoading || !mockUsername.trim()}
                className="h-8 text-xs"
              >
                {mockLoading ? "Simulating..." : "Simulate Sponsorship"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleClearMock}
                disabled={mockLoading}
                className="h-8 text-xs text-destructive hover:text-destructive gap-1"
              >
                <Trash2 size={13} />
                Clear Test Sponsors
              </Button>
              {mockSuccess && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium animate-fade-in">
                  ✓ Mock sponsor created successfully!
                </span>
              )}
              {mockError && (
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium animate-fade-in">
                  ✗ {mockError}
                </span>
              )}
            </form>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 mt-12 bg-muted/20 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-medium text-foreground">
            🇯🇵 Nipponic — Complete Platform for Self-Taught Japanese Learning
          </p>
          <p>
            Crafted with care under the MIT License. Sustained with community support on GitHub.
          </p>
        </div>
      </footer>
    </div>
  );
}
