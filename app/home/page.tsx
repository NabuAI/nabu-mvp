"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  Gift,
  Home,
  House,
  MessageCircle,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { useRewards } from "@/app/providers/rewards-context";

type TabId = "home" | "house" | "shop";

type WeeklyChallenge = {
  id: string;
  title: string;
  description: string;
  vibe: string;
};

type DailyQuestion = {
  id: string;
  prompt: string;
  tone: string;
};

const WEEKLY_REWARD = 400;
const DAILY_REWARD = 150;
const PARTNER_BONUS = 90;

const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: "sunset-walk",
    title: "Golden Hour Walk",
    description:
      "Pick a new park, leave phones at home, and trade songs you love while you wander.",
    vibe: "grounding",
  },
  {
    id: "cinema-night",
    title: "Neon Movie Night",
    description:
      "Queue a movie neither of you has seen, build a snack board, and rate it together afterward.",
    vibe: "cozy",
  },
  {
    id: "kitchen-team",
    title: "Co-op Cook",
    description:
      "Cook one new dish together. Assign roles, plate it pretty, and snap a photo for your house.",
    vibe: "playful",
  },
  {
    id: "mini-retreat",
    title: "Micro Retreat",
    description:
      "Create a 90-minute retreat at home: stretch, tea, candles, and a 10-minute gratitude swap.",
    vibe: "restorative",
  },
];

const DAILY_QUESTIONS: DailyQuestion[] = [
  {
    id: "favorite-thing",
    prompt: "What is one thing you really liked about your partner this week?",
    tone: "warm",
  },
  {
    id: "stressor",
    prompt:
      "What has been stressing you lately, and how could your partner lighten it for you?",
    tone: "honest",
  },
  {
    id: "micro-joy",
    prompt:
      "Share a tiny joy from today that you want to do together more often.",
    tone: "light",
  },
  {
    id: "appreciation",
    prompt:
      "Name one moment you felt seen by your partner recently. What made it special?",
    tone: "grateful",
  },
  {
    id: "support",
    prompt:
      "If the next week had one theme, what support would feel amazing from your partner?",
    tone: "future",
  },
];

const PARTNER_PRESETS: string[] = [
  "I loved how you slowed down with me yesterday. Felt really cared for.",
  "My stress melted when you asked about my day first. Thank you for that.",
  "I want more of our silly kitchen dances. They reset my brain in the best way.",
  "I felt seen when you defended my idea. It mattered a lot.",
  "Let's protect a tech-free hour this week. I miss our focus time.",
];

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "house", label: "House", icon: House },
  { id: "home", label: "Home", icon: Home },
  { id: "shop", label: "Shop", icon: ShoppingBag },
];

function isoDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekKey(date: Date) {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = target.getUTCDay();
  const dayNumber = day === 0 ? 7 : day;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((Number(target) - Number(yearStart)) / 86400000 + 1) / 7,
  );
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function pickIndex(key: string, listLength: number) {
  if (listLength === 0) return 0;
  const hash = key
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0) * 13 + 7, 0);
  return Math.abs(hash) % listLength;
}

function formatWeekLabel(keyString: string) {
  const parts = keyString.split("-W");
  if (parts.length !== 2) return keyString;
  return `Week ${parts[1]}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    state,
    updateProfile,
    completeWeeklyChallenge,
    answerDailyQuestion,
    revealPartnerDailyAnswer,
  } = useRewards();

  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [dailyInput, setDailyInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState(state.profile?.name ?? "");
  const [partnerDraft, setPartnerDraft] = useState(
    state.profile?.partnerName ?? "",
  );

  const todayKey = useMemo(() => isoDateKey(new Date()), []);
  const week = useMemo(() => weekKey(new Date()), []);

  const weeklyChallenge =
    WEEKLY_CHALLENGES[pickIndex(week, WEEKLY_CHALLENGES.length)];
  const dailyQuestion =
    DAILY_QUESTIONS[pickIndex(todayKey, DAILY_QUESTIONS.length)];

  const weeklyRecord = state.weekly[week];
  const weeklyDone =
    weeklyRecord?.challengeId === weeklyChallenge.id &&
    weeklyRecord.pointsAwarded > 0;

  const dailyRecord = state.daily[todayKey];
  const dailyAnswered =
    dailyRecord?.questionId === dailyQuestion.id &&
    dailyRecord.pointsAwarded > 0;
  const partnerRevealed = dailyRecord?.partnerRevealed ?? false;

  useEffect(() => {
    if (dailyRecord?.answer) {
      setDailyInput(dailyRecord.answer);
    } else {
      setDailyInput("");
    }
  }, [dailyRecord?.answer, todayKey]);

  useEffect(() => {
    if (pathname.includes("/house")) {
      setActiveTab("house");
    } else if (pathname.includes("/shop")) {
      setActiveTab("shop");
    } else {
      setActiveTab("home");
    }
  }, [pathname]);

  const handleCompleteChallenge = () => {
    const { awarded } = completeWeeklyChallenge({
      weekId: week,
      challengeId: weeklyChallenge.id,
      reward: WEEKLY_REWARD,
    });
    if (awarded) {
      setToast(`+${WEEKLY_REWARD} pts — weekly complete`);
    } else {
      setToast("Already completed this week");
    }
  };

  const handleSubmitAnswer = () => {
    const trimmed = dailyInput.trim();
    if (!trimmed) return;
    const { awarded } = answerDailyQuestion({
      dateId: todayKey,
      questionId: dailyQuestion.id,
      answer: trimmed,
      reward: DAILY_REWARD,
    });
    if (awarded) {
      setToast(`+${DAILY_REWARD} pts — answer saved`);
    } else {
      setToast("Already logged for today");
    }
  };

  const handleRevealPartner = () => {
    const preset =
      PARTNER_PRESETS[pickIndex(dailyQuestion.id, PARTNER_PRESETS.length)];
    const { awarded } = revealPartnerDailyAnswer({
      dateId: todayKey,
      partnerAnswer: preset,
      bonus: PARTNER_BONUS,
    });
    if (awarded) {
      setToast(`+${PARTNER_BONUS} pts — both answered`);
    }
  };

  const requiresProfile = !state.profile;

  const handleTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "house") router.push("/house");
    if (tab === "home") router.push("/home");
    if (tab === "shop") router.push("/shop");
  };

  const heroName = state.profile?.name || "There";

  const vibeColor = useMemo(() => {
    switch (weeklyChallenge.vibe) {
      case "cozy":
        return "from-[#9D84FF] to-[#FF84E8]";
      case "playful":
        return "from-[#84F3FF] to-[#9D84FF]";
      case "restorative":
        return "from-[#6CE5B1] to-[#9D84FF]";
      default:
        return "from-[#FF9F7C] to-[#9D84FF]";
    }
  }, [weeklyChallenge.vibe]);

  return (
    <div className="min-h-dvh bg-[#13111C] text-white">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pb-[calc(var(--safe-bottom)+6rem)] pt-[calc(var(--safe-top)+1.5rem)] overflow-x-hidden">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(157,132,255,0.2),transparent_70%)] pointer-events-none" />
        <div className="absolute -left-24 top-16 w-52 h-52 rounded-full bg-[#9D84FF]/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 top-48 w-48 h-48 rounded-full bg-[#FF84E8]/10 blur-3xl pointer-events-none" />

        <header className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              Nabu · Rituals
            </p>
            <h1 className="text-[2.05rem] leading-tight font-semibold mt-2">
              Hey {heroName}
            </h1>
            <p className="text-white/60 mt-2 max-w-72 leading-relaxed text-[0.97rem]">
              Earn points together, buy new furniture, and decorate your shared
              house.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-2xl border border-white/12 bg-white/10 px-3 py-2 text-right shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                Points
              </p>
              <div className="text-xl font-semibold flex items-center gap-2">
                <Gift size={16} className="text-[#FF84E8]" />
                {state.points}
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/90 hover:bg-white/16 transition"
            >
              Open Shop →
            </button>
          </div>
        </header>

        <div className="relative mt-7 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="rounded-[28px] border border-white/12 bg-gradient-to-br from-[#1B1527] to-[#0F0C18] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/55">
              <Flame size={14} className="text-[#FF9F7C]" />
              Weekly Challenge · {formatWeekLabel(week)}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[12px] text-white/80">
                  <Shield size={14} />
                  {weeklyChallenge.vibe}
                </div>
                <h2 className="text-xl font-semibold">
                  {weeklyChallenge.title}
                </h2>
                <p className="text-sm text-white/70 leading-relaxed max-w-[260px]">
                  {weeklyChallenge.description}
                </p>
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <Star size={16} className="text-[#FFDF7C]" />
                  {WEEKLY_REWARD} pts when you mark it done
                </div>
              </div>
              <div
                className={`rounded-2xl bg-gradient-to-br ${vibeColor} px-3 py-2 text-right text-[12px] font-semibold text-[#0F0C18] shadow-[0_14px_40px_rgba(157,132,255,0.45)]`}
              >
                <p>+{WEEKLY_REWARD} pts</p>
                <p className="text-[#0F0C18]/75">this week</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleCompleteChallenge}
                disabled={weeklyDone}
                className={`flex-1 rounded-2xl py-3 font-semibold transition ${
                  weeklyDone
                    ? "bg-white/6 text-white/60 border border-white/12"
                    : "bg-gradient-to-r from-[#9D84FF] to-[#FF84E8] text-[#0F0C18] shadow-[0_12px_32px_rgba(157,132,255,0.35)]"
                }`}
              >
                {weeklyDone ? "Completed" : "Mark completed"}
              </button>
              <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/70">
                Resets each Monday
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-[28px] border border-white/12 bg-gradient-to-br from-[#171325] via-[#13111C] to-[#0B0A12] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/55">
              <MessageCircle size={14} className="text-[#84F3FF]" />
              Daily Question
            </div>
            <div className="mt-3 space-y-3">
              <h2 className="text-lg font-semibold leading-snug">
                {dailyQuestion.prompt}
              </h2>
              <p className="text-sm text-white/60">
                Tone: {dailyQuestion.tone}
              </p>
              <textarea
                value={dailyInput}
                onChange={(event) => setDailyInput(event.target.value)}
                placeholder="Write a short, honest answer for your partner..."
                className="mt-1 w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#9D84FF] focus:outline-none"
                rows={4}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={dailyAnswered || !dailyInput.trim()}
                  className={`flex-1 rounded-2xl py-3 font-semibold transition ${
                    dailyAnswered
                      ? "bg-white/6 text-white/60 border border-white/12"
                      : "bg-gradient-to-r from-[#9D84FF] to-[#84F3FF] text-[#0F0C18] shadow-[0_12px_32px_rgba(132,243,255,0.35)]"
                  }`}
                >
                  {dailyAnswered ? "Answer saved" : "Submit + earn"}
                </button>
                <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/70">
                  +{DAILY_REWARD} pts
                </div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 p-3 text-sm text-white/75">
                {dailyAnswered
                  ? "Waiting on partner — tap reveal after they answer"
                  : "Both partners answer to unlock a bonus and see their response."}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRevealPartner}
                  disabled={!dailyAnswered || partnerRevealed}
                  className={`flex-1 rounded-2xl py-3 font-semibold transition ${
                    partnerRevealed
                      ? "bg-white/6 text-white/60 border border-white/12"
                      : "bg-gradient-to-r from-[#FF84E8] to-[#9D84FF] text-[#0F0C18] shadow-[0_12px_32px_rgba(255,132,232,0.35)]"
                  }`}
                >
                  {partnerRevealed
                    ? "Partner answer revealed"
                    : "Reveal partner answer"}
                </button>
                <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/70">
                  +{PARTNER_BONUS} pts
                </div>
              </div>
              {partnerRevealed && dailyRecord?.partnerAnswer ? (
                <div className="rounded-2xl border border-[#9D84FF]/35 bg-[#9D84FF]/10 p-3 text-sm text-white">
                  <p className="text-xs uppercase tracking-[0.15em] text-white/65 mb-1">
                    Partner said
                  </p>
                  {dailyRecord.partnerAnswer}
                </div>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="rounded-[24px] border border-white/10 bg-white/4 p-4 shadow-[0_16px_38px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  Shop Preview
                </p>
                <h3 className="text-lg font-semibold mt-1">
                  Spend your points
                </h3>
                <p className="text-sm text-white/65">
                  Unlock furniture and take it to your house.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/shop")}
                className="rounded-full bg-gradient-to-r from-[#9D84FF] to-[#FF84E8] px-3 py-2 text-xs font-semibold text-[#0F0C18] shadow-[0_10px_26px_rgba(157,132,255,0.35)]"
              >
                Go to Shop
              </button>
            </div>
          </motion.div>
        </div>

        <div className="sticky bottom-0 z-30 mt-4">
          <div className="mx-auto w-full max-w-md px-2 pb-[calc(var(--safe-bottom)+0.75rem)]">
            <div className="flex items-center gap-1 rounded-3xl border border-white/12 bg-white/5 px-2 py-2.5 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTab(tab.id)}
                    className={`flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-white/10 text-white shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                        : "text-white/60 hover:text-white/85"
                    }`}
                    aria-label={tab.label}
                  >
                    <Icon size={22} strokeWidth={2.1} />
                    <span className="mt-1 text-[12px] leading-none">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {requiresProfile ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0b0911]/90 backdrop-blur-xl px-6">
            <div className="w-full max-w-md rounded-3xl border border-white/12 bg-[#13111C] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                <Sparkles size={14} className="text-[#9D84FF]" />
                Create your duo
              </div>
              <h2 className="mt-3 text-xl font-semibold">
                Who&apos;s playing?
              </h2>
              <p className="text-sm text-white/65 mt-1">
                Name yourselves to start earning and saving progress.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#9D84FF] focus:outline-none"
                />
                <input
                  value={partnerDraft}
                  onChange={(event) => setPartnerDraft(event.target.value)}
                  placeholder="Partner name"
                  className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#9D84FF] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!nameDraft.trim() || !partnerDraft.trim()}
                  onClick={() =>
                    updateProfile({
                      name: nameDraft.trim(),
                      partnerName: partnerDraft.trim(),
                    })
                  }
                  className={`w-full rounded-2xl py-3 font-semibold transition ${
                    !nameDraft.trim() || !partnerDraft.trim()
                      ? "bg-white/6 text-white/60 border border-white/12"
                      : "bg-gradient-to-r from-[#9D84FF] to-[#FF84E8] text-[#0F0C18] shadow-[0_12px_32px_rgba(157,132,255,0.35)]"
                  }`}
                >
                  Save & start
                </button>
              </div>
              <p className="mt-3 text-xs text-white/55">
                We seed your wallet with starter points once you confirm.
              </p>
            </div>
          </div>
        ) : null}

        <AnimatePresence>
          {toast ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 -translate-x-1/2 bottom-28 z-50 rounded-2xl border border-white/12 bg-[#0F0C18]/95 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,0,0,0.45)]"
              onAnimationComplete={() => {
                setTimeout(() => setToast(null), 1600);
              }}
            >
              {toast}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
