"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nabu-rewards-state-v1";
const STARTER_POINTS = 650;

export type Profile = {
  name: string;
  partnerName: string;
  avatar?: string;
};

type WeeklyRecord = {
  challengeId: string;
  completedAt: string;
  pointsAwarded: number;
};

type DailyRecord = {
  questionId: string;
  answer: string;
  answeredAt: string;
  pointsAwarded: number;
  partnerAnswer?: string;
  partnerRevealed: boolean;
  partnerPointsAwarded: number;
};

type RewardsState = {
  profile?: Profile;
  points: number;
  ownedFurniture: string[];
  weekly: Record<string, WeeklyRecord>;
  daily: Record<string, DailyRecord>;
  starterGranted: boolean;
};

type RewardsContextValue = {
  state: RewardsState;
  hydrated: boolean;
  updateProfile: (profile: Profile) => void;
  awardPoints: (amount: number) => number;
  spendPoints: (amount: number) => { ok: boolean; newBalance: number };
  completeWeeklyChallenge: (input: {
    weekId: string;
    challengeId: string;
    reward: number;
  }) => { awarded: boolean; newBalance: number };
  answerDailyQuestion: (input: {
    dateId: string;
    questionId: string;
    answer: string;
    reward: number;
  }) => { awarded: boolean; newBalance: number };
  revealPartnerDailyAnswer: (input: {
    dateId: string;
    partnerAnswer: string;
    bonus: number;
  }) => { awarded: boolean; newBalance: number };
  purchaseFurniture: (input: { assetPath: string; price: number }) => {
    purchased: boolean;
    newBalance: number;
  };
  ownedFurnitureSet: Set<string>;
};

const defaultState: RewardsState = {
  points: 0,
  ownedFurniture: [],
  weekly: {},
  daily: {},
  starterGranted: false,
};

const RewardsContext = createContext<RewardsContextValue | null>(null);

function readStoredState(): RewardsState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<RewardsState>;
    return {
      ...defaultState,
      ...parsed,
      ownedFurniture: parsed.ownedFurniture ?? [],
      weekly: parsed.weekly ?? {},
      daily: parsed.daily ?? {},
      starterGranted: parsed.starterGranted ?? false,
    };
  } catch (error) {
    console.error("Failed to load rewards state", error);
    return defaultState;
  }
}

export function RewardsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RewardsState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredState();
    setState((current) => ({ ...current, ...stored }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to persist rewards state", error);
    }
  }, [state, hydrated]);

  const updateProfile = (profile: Profile) => {
    setState((prev) => {
      const nextPoints = prev.starterGranted
        ? prev.points
        : Math.max(prev.points, STARTER_POINTS);
      return {
        ...prev,
        profile,
        points: nextPoints,
        starterGranted: true,
      };
    });
  };

  const awardPoints = (amount: number) => {
    let newBalance = state.points;
    setState((prev) => {
      newBalance = prev.points + amount;
      return { ...prev, points: newBalance };
    });
    return newBalance;
  };

  const spendPoints = (amount: number) => {
    let ok = false;
    let newBalance = state.points;
    setState((prev) => {
      if (prev.points < amount) {
        newBalance = prev.points;
        return prev;
      }
      ok = true;
      newBalance = prev.points - amount;
      return { ...prev, points: newBalance };
    });
    return { ok, newBalance };
  };

  const completeWeeklyChallenge: RewardsContextValue["completeWeeklyChallenge"] =
    ({ weekId, challengeId, reward }) => {
      let awarded = false;
      let newBalance = state.points;
      setState((prev) => {
        const existing = prev.weekly[weekId];
        if (existing?.pointsAwarded) {
          newBalance = prev.points;
          return prev;
        }
        awarded = true;
        newBalance = prev.points + reward;
        return {
          ...prev,
          points: newBalance,
          weekly: {
            ...prev.weekly,
            [weekId]: {
              challengeId,
              completedAt: new Date().toISOString(),
              pointsAwarded: reward,
            },
          },
        };
      });
      return { awarded, newBalance };
    };

  const answerDailyQuestion: RewardsContextValue["answerDailyQuestion"] = ({
    dateId,
    questionId,
    answer,
    reward,
  }) => {
    let awarded = false;
    let newBalance = state.points;
    setState((prev) => {
      const existing = prev.daily[dateId];
      if (existing?.pointsAwarded) {
        newBalance = prev.points;
        return prev;
      }
      awarded = true;
      newBalance = prev.points + reward;
      return {
        ...prev,
        points: newBalance,
        daily: {
          ...prev.daily,
          [dateId]: {
            questionId,
            answer,
            answeredAt: new Date().toISOString(),
            pointsAwarded: reward,
            partnerAnswer: existing?.partnerAnswer,
            partnerRevealed: existing?.partnerRevealed ?? false,
            partnerPointsAwarded: existing?.partnerPointsAwarded ?? 0,
          },
        },
      };
    });
    return { awarded, newBalance };
  };

  const revealPartnerDailyAnswer: RewardsContextValue["revealPartnerDailyAnswer"] =
    ({ dateId, partnerAnswer, bonus }) => {
      let awarded = false;
      let newBalance = state.points;
      setState((prev) => {
        const existing = prev.daily[dateId];
        if (!existing) {
          newBalance = prev.points;
          return prev;
        }
        if (existing.partnerPointsAwarded) {
          newBalance = prev.points;
          return {
            ...prev,
            daily: {
              ...prev.daily,
              [dateId]: { ...existing, partnerAnswer, partnerRevealed: true },
            },
          };
        }
        awarded = true;
        newBalance = prev.points + bonus;
        return {
          ...prev,
          points: newBalance,
          daily: {
            ...prev.daily,
            [dateId]: {
              ...existing,
              partnerAnswer,
              partnerRevealed: true,
              partnerPointsAwarded: bonus,
            },
          },
        };
      });
      return { awarded, newBalance };
    };

  const purchaseFurniture: RewardsContextValue["purchaseFurniture"] = ({
    assetPath,
    price,
  }) => {
    let purchased = false;
    let newBalance = state.points;
    setState((prev) => {
      if (prev.ownedFurniture.includes(assetPath)) {
        newBalance = prev.points;
        return prev;
      }
      if (prev.points < price) {
        newBalance = prev.points;
        return prev;
      }
      purchased = true;
      newBalance = prev.points - price;
      return {
        ...prev,
        points: newBalance,
        ownedFurniture: [...prev.ownedFurniture, assetPath],
      };
    });
    return { purchased, newBalance };
  };

  const ownedFurnitureSet = useMemo(
    () => new Set(state.ownedFurniture),
    [state.ownedFurniture],
  );

  const value: RewardsContextValue = {
    state,
    hydrated,
    updateProfile,
    awardPoints,
    spendPoints,
    completeWeeklyChallenge,
    answerDailyQuestion,
    revealPartnerDailyAnswer,
    purchaseFurniture,
    ownedFurnitureSet,
  };

  if (!hydrated) {
    return (
      <RewardsContext.Provider value={value}>
        <div className="min-h-dvh bg-[#13111C]" />
      </RewardsContext.Provider>
    );
  }

  return (
    <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>
  );
}

export function useRewards() {
  const ctx = useContext(RewardsContext);
  if (!ctx) {
    throw new Error("useRewards must be used within a RewardsProvider");
  }
  return ctx;
}
