"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Copy,
  Check,
  Sparkles,
  Heart,
  ArrowRight,
  Share2,
  User,
  Users,
  Zap,
  MessageCircle,
  Coffee,
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---
type Gender =
  | "Woman"
  | "Man"
  | "Non-binary"
  | "Prefer to self-describe"
  | "Prefer not to say"
  | "";
type RelationshipStatus =
  | "I’m in a relationship"
  | "We just started dating"
  | "Long-term relationship"
  | "Married"
  | "It’s complicated"
  | "Just exploring for now"
  | "";
type ConnectionStatus = "invite_now" | "explore_first" | "checking_out" | "";

interface OnboardingData {
  name: string;
  gender: Gender;
  customGender?: string;
  relationshipStatus: RelationshipStatus;
  mainReason: string;
  conflictStyle: number; // 1 to 5 scale
  preferredVibes: string[];
  dailyHabit: string;
  activityStyle: string;
  connectionStatus: ConnectionStatus;
}

const INITIAL_DATA: OnboardingData = {
  name: "",
  gender: "",
  relationshipStatus: "",
  mainReason: "",
  conflictStyle: 3,
  preferredVibes: [],
  dailyHabit: "",
  activityStyle: "",
  connectionStatus: "",
};

// --- Reusable UI Components ---

const ProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const progress = Math.max(0, Math.min(100, (current / total) * 100));
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
      <motion.div
        className="h-full bg-[#9D84FF] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </div>
  );
};

const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}: any) => {
  const baseStyles =
    "w-full min-h-13 py-3.5 px-6 rounded-full font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]";
  const variants = {
    primary:
      "bg-[#9D84FF] text-[#13111C] hover:bg-[#B39DFF] disabled:bg-[#9D84FF]/30 disabled:text-white/30",
    secondary: "bg-white/10 text-white hover:bg-white/20 disabled:opacity-50",
    outline:
      "border-2 border-white/20 text-white hover:bg-white/5 disabled:opacity-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

const OptionCard = ({
  title,
  icon: Icon,
  selected,
  onClick,
  description,
}: any) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4
      ${
        selected
          ? "border-[#9D84FF] bg-[#9D84FF]/10"
          : "border-white/5 bg-white/5 hover:bg-white/10"
      }`}
  >
    {Icon && (
      <div
        className={`p-3 rounded-xl ${selected ? "bg-[#9D84FF] text-[#13111C]" : "bg-white/10 text-white"}`}
      >
        <Icon size={24} />
      </div>
    )}
    <div>
      <h3
        className={`font-medium text-lg ${selected ? "text-white" : "text-white/90"}`}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm text-white/50 mt-1">{description}</p>
      )}
    </div>
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="ml-auto text-[#9D84FF]"
      >
        <Check size={24} />
      </motion.div>
    )}
  </motion.button>
);

// --- Main Component ---

export default function NabuOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const totalSteps = 14;

  const nextStep = () => {
    if (step < totalSteps) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const updateData = (fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const handleComplete = () => {
    console.log("ONBOARDING COMPLETE. DATA TO SAVE:", data);
    router.push("/home");
  };

  // Animation variants for screen transitions
  const screenVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  // --- Screen Renderers ---

  const renderScreen = () => {
    switch (step) {
      case 1: // Welcome
        return (
          <div className="flex flex-col h-full justify-between pt-12 pb-8">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 bg-gradient-to-br from-[#9D84FF] to-[#FF84E8] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(157,132,255,0.3)]"
              >
                <Heart size={48} className="text-[#13111C] fill-current" />
              </motion.div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
                  A better way to <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9D84FF] to-[#FF84E8]">
                    grow together.
                  </span>
                </h1>
                <p className="text-lg text-white/60 max-w-[280px] mx-auto">
                  Daily questions and mini-games to spark joy and deepen your
                  connection.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <Button onClick={nextStep}>Get Started</Button>
              <p className="text-center text-sm text-white/40">
                Takes about 1 minute
              </p>
            </div>
          </div>
        );

      case 2: // Name
        return (
          <div className="flex flex-col h-full justify-between py-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  What should we call you?
                </h2>
                <p className="text-white/60">
                  Your partner will see this name.
                </p>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Your name or nickname"
                value={data.name}
                onChange={(e) => updateData({ name: e.target.value })}
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#9D84FF] transition-colors"
              />
            </div>
            <Button disabled={!data.name.trim()} onClick={nextStep}>
              Continue
            </Button>
          </div>
        );

      case 3: // Gender
        const genders: Gender[] = [
          "Woman",
          "Man",
          "Non-binary",
          "Prefer to self-describe",
          "Prefer not to say",
        ];
        return (
          <div className="flex flex-col h-full py-8 min-h-0">
            <div className="space-y-8 flex-1 min-h-0">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  How do you identify?
                </h2>
                <p className="text-white/60">
                  This helps us tailor your experience.
                </p>
              </div>
              <div className="space-y-3 overflow-y-auto pb-4 max-h-full">
                {genders.map((g) => (
                  <OptionCard
                    key={g}
                    title={g}
                    selected={data.gender === g}
                    onClick={() => updateData({ gender: g })}
                  />
                ))}
                {data.gender === "Prefer to self-describe" && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    type="text"
                    placeholder="Describe your gender"
                    value={data.customGender || ""}
                    onChange={(e) =>
                      updateData({ customGender: e.target.value })
                    }
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#9D84FF] mt-2"
                  />
                )}
              </div>
            </div>
            <Button
              className="mt-4 shrink-0"
              disabled={
                !data.gender ||
                (data.gender === "Prefer to self-describe" &&
                  !data.customGender?.trim())
              }
              onClick={nextStep}
            >
              Continue
            </Button>
          </div>
        );

      case 4: // Relationship Situation
        const situations: RelationshipStatus[] = [
          "I’m in a relationship",
          "We just started dating",
          "Long-term relationship",
          "Married",
          "It’s complicated",
          "Just exploring for now",
        ];
        return (
          <div className="flex flex-col h-full py-8 min-h-0">
            <div className="space-y-8 flex-1 min-h-0">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  What's your relationship status?
                </h2>
                <p className="text-white/60">
                  We'll adapt our questions to fit your vibe.
                </p>
              </div>
              <div className="space-y-3 overflow-y-auto pb-4 max-h-full">
                {situations.map((s) => (
                  <OptionCard
                    key={s}
                    title={s}
                    selected={data.relationshipStatus === s}
                    onClick={() => updateData({ relationshipStatus: s })}
                  />
                ))}
              </div>
            </div>
            <Button
              className="mt-4 shrink-0"
              disabled={!data.relationshipStatus}
              onClick={nextStep}
            >
              Continue
            </Button>
          </div>
        );

      case 5: // Main Reason
        const reasons = [
          { title: "Feel closer day to day", icon: Heart },
          { title: "Communicate better", icon: MessageCircle },
          { title: "Make quality time easier", icon: Coffee },
          { title: "Bring back fun and spark", icon: Sparkles },
          { title: "Understand each other", icon: Users },
          { title: "Handle tension better", icon: Zap },
        ];
        return (
          <div className="flex flex-col h-full py-8 min-h-0">
            <div className="space-y-6 flex-1 min-h-0">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  What do you hope to improve?
                </h2>
                <p className="text-white/60">
                  Pick the most important one for you right now.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 overflow-y-auto pb-4 max-h-full">
                {reasons.map((r) => (
                  <OptionCard
                    key={r.title}
                    title={r.title}
                    icon={r.icon}
                    selected={data.mainReason === r.title}
                    onClick={() => updateData({ mainReason: r.title })}
                  />
                ))}
              </div>
            </div>
            <Button
              className="mt-4 shrink-0"
              disabled={!data.mainReason}
              onClick={nextStep}
            >
              Continue
            </Button>
          </div>
        );

      case 6: // Conflict Style (Custom Slider)
        return (
          <div className="flex flex-col h-full justify-between py-8">
            <div className="space-y-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  How do you typically behave in arguments?
                </h2>
                <p className="text-white/60">
                  Be honest, we all have our moments.
                </p>
              </div>

              <div className="relative pt-10 pb-8 px-4">
                {/* Custom Slider Track */}
                <div className="h-4 bg-white/10 rounded-full relative flex items-center">
                  {/* Active Track */}
                  <div
                    className="absolute h-full bg-[#9D84FF] rounded-full transition-all duration-300"
                    style={{
                      width: `${((data.conflictStyle - 1) / 4) * 100}%`,
                    }}
                  />

                  {/* Clickable Segments & Dots */}
                  {[1, 2, 3, 4, 5].map((val) => (
                    <div
                      key={val}
                      onClick={() => updateData({ conflictStyle: val })}
                      className="absolute w-12 h-12 -ml-6 flex items-center justify-center cursor-pointer z-10"
                      style={{ left: `${((val - 1) / 4) * 100}%` }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full transition-all duration-300 shadow-lg
                        ${
                          data.conflictStyle === val
                            ? "bg-white scale-125 border-4 border-[#9D84FF]"
                            : "bg-[#231F33] border-2 border-white/20 hover:border-white/50"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-8 text-sm font-medium">
                  <span className="text-white/70 max-w-[100px] text-left">
                    I get hot like a jalapeño
                  </span>
                  <span className="text-white/70 max-w-[100px] text-right">
                    I stay cool as a cucumber
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={nextStep}>Continue</Button>
          </div>
        );

      case 7: // Preferred Vibe (Multi-select)
        const vibes = [
          "Deep talks",
          "More fun",
          "More romance",
          "Better teamwork",
          "Better intimacy",
          "More appreciation",
        ];
        const toggleVibe = (vibe: string) => {
          const current = data.preferredVibes;
          if (current.includes(vibe)) {
            updateData({ preferredVibes: current.filter((v) => v !== vibe) });
          } else if (current.length < 3) {
            updateData({ preferredVibes: [...current, vibe] });
          }
        };
        const isValidVibes =
          data.preferredVibes.length >= 2 && data.preferredVibes.length <= 3;

        return (
          <div className="flex flex-col h-full justify-between py-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  What vibe do you want more of?
                </h2>
                <p className="text-white/60">Choose 2-3 that sound best.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {vibes.map((v) => (
                  <motion.button
                    key={v}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleVibe(v)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 h-28
                      ${
                        data.preferredVibes.includes(v)
                          ? "border-[#9D84FF] bg-[#9D84FF]/10 text-white"
                          : "border-white/5 bg-white/5 text-white/70 hover:bg-white/10"
                      }
                      ${!data.preferredVibes.includes(v) && data.preferredVibes.length >= 3 ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <span className="font-medium">{v}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            <Button disabled={!isValidVibes} onClick={nextStep}>
              {data.preferredVibes.length < 2
                ? `Select ${2 - data.preferredVibes.length} more`
                : "Continue"}
            </Button>
          </div>
        );

      case 8: // Daily Habit
        const habits = ["1 minute", "3 minutes", "5 minutes", "Flexible"];
        return (
          <div className="flex flex-col h-full justify-between py-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  How much time feels realistic daily?
                </h2>
                <p className="text-white/60">
                  Small habits build strong bonds.
                </p>
              </div>
              <div className="space-y-3">
                {habits.map((h) => (
                  <OptionCard
                    key={h}
                    title={h}
                    selected={data.dailyHabit === h}
                    onClick={() => updateData({ dailyHabit: h })}
                  />
                ))}
              </div>
            </div>
            <Button disabled={!data.dailyHabit} onClick={nextStep}>
              Continue
            </Button>
          </div>
        );

      case 9: // Activity Style
        const activities = [
          { title: "Mostly quick questions", desc: "Easy to answer on the go" },
          {
            title: "Small real-life challenges",
            desc: "Actions speak louder than words",
          },
          { title: "A mix of both", desc: "Keep it unpredictable" },
          { title: "Depends on the day", desc: "I like to choose" },
        ];
        return (
          <div className="flex flex-col h-full justify-between py-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  What sounds most fun?
                </h2>
                <p className="text-white/60">
                  We'll prioritize these in your feed.
                </p>
              </div>
              <div className="space-y-3">
                {activities.map((a) => (
                  <OptionCard
                    key={a.title}
                    title={a.title}
                    description={a.desc}
                    selected={data.activityStyle === a.title}
                    onClick={() => updateData({ activityStyle: a.title })}
                  />
                ))}
              </div>
            </div>
            <Button disabled={!data.activityStyle} onClick={nextStep}>
              Continue
            </Button>
          </div>
        );

      case 10: // Partner Connection Status
        const statuses: {
          id: ConnectionStatus;
          title: string;
          desc: string;
        }[] = [
          {
            id: "invite_now",
            title: "My partner is ready",
            desc: "Invite them right now",
          },
          {
            id: "explore_first",
            title: "I want to explore first",
            desc: "I'll invite them later",
          },
          {
            id: "checking_out",
            title: "I’m just checking it out",
            desc: "Flying solo for a bit",
          },
        ];
        return (
          <div className="flex flex-col h-full justify-between py-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  Ready to invite your partner?
                </h2>
                <p className="text-white/60">
                  Nabu works best when you play together.
                </p>
              </div>
              <div className="space-y-3">
                {statuses.map((s) => (
                  <OptionCard
                    key={s.id}
                    title={s.title}
                    description={s.desc}
                    selected={data.connectionStatus === s.id}
                    onClick={() => updateData({ connectionStatus: s.id })}
                  />
                ))}
              </div>
            </div>
            <Button disabled={!data.connectionStatus} onClick={nextStep}>
              Continue
            </Button>
          </div>
        );

      case 11: // Loading / Analyzing
        return <LoadingScreen onComplete={nextStep} />;

      case 12: // Personalized Results
        return (
          <div className="flex flex-col h-full justify-between py-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9D84FF]/20 text-[#9D84FF] text-sm font-medium">
                  <Sparkles size={16} />
                  <span>Your Nabu Style</span>
                </div>
                <h2 className="text-3xl font-bold text-white">
                  You want a{" "}
                  {data.preferredVibes[0]?.toLowerCase() || "lighter"}, more
                  connected way to grow.
                </h2>
                <p className="text-lg text-white/70 leading-relaxed">
                  Based on your answers, we've crafted a journey focused on{" "}
                  <span className="text-white font-medium">
                    {data.mainReason.toLowerCase()}
                  </span>
                  , fitting perfectly into your{" "}
                  <span className="text-white font-medium">
                    {data.dailyHabit.toLowerCase()}
                  </span>{" "}
                  routine.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="font-semibold text-white">
                  What's coming up first:
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-white/80">
                    <Check className="text-[#9D84FF] shrink-0" />
                    <span>
                      A fun icebreaker question to share with your partner.
                    </span>
                  </li>
                  <li className="flex gap-3 text-white/80">
                    <Check className="text-[#9D84FF] shrink-0" />
                    <span>Your first mini-challenge based on your style.</span>
                  </li>
                </ul>
              </div>
            </div>
            <Button onClick={nextStep}>Sounds Good</Button>
          </div>
        );

      case 13: // Connect with Partner
        if (data.connectionStatus !== "invite_now") {
          return (
            <div className="flex flex-col h-full justify-center items-center text-center py-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  You're all set
                </h2>
                <p className="text-white/60">
                  You can invite your partner later from inside the app.
                </p>
              </div>
              <div className="w-full mt-8">
                <Button onClick={nextStep}>Continue</Button>
              </div>
            </div>
          );
        }
        return <InviteScreen onNext={nextStep} />;

      case 14: // Final Start
        return (
          <div className="flex flex-col h-full justify-between py-8">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-24 h-24 bg-[#9D84FF] rounded-full flex items-center justify-center"
              >
                <Check size={48} className="text-[#13111C]" />
              </motion.div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-white">
                  You're all set, {data.name || "friend"}!
                </h2>
                <p className="text-lg text-white/60 max-w-[280px] mx-auto">
                  Your personalized journey is ready. Let's dive into your first
                  question.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <Button onClick={handleComplete}>Start My Journey</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-[#13111C] text-white font-sans selection:bg-[#9D84FF]/30 flex justify-center overflow-hidden">
      <div className="w-full max-w-md h-dvh flex flex-col relative shadow-2xl bg-[#13111C]">
        {/* Header / Progress */}
        <div className="px-6 pt-[max(1.5rem,var(--safe-top))] pb-4 flex items-center justify-between z-10">
          {step > 1 && step < 14 && step !== 11 ? (
            <button
              onClick={prevStep}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}

          {step > 1 && step < 11 && (
            <div className="flex-1 max-w-[120px] mx-4">
              <ProgressBar current={step - 1} total={9} />
            </div>
          )}

          <div className="w-10 h-10 flex items-center justify-end">
            {step > 1 && step < 11 && (
              <span className="text-sm font-medium text-white/40">
                {step - 1}/9
              </span>
            )}
          </div>
        </div>

        {/* Main Content Area with Animations */}
        <div className="flex-1 px-6 relative overflow-hidden min-h-0 pb-[max(0.75rem,var(--safe-bottom))]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="absolute inset-0 px-6 h-full overflow-y-auto"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponents for complex screens ---

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const texts = [
    "Learning your style...",
    "Shaping your daily journey...",
    "Preparing your first connection path...",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev === texts.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 800); // Wait a bit after last text
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col h-full items-center justify-center text-center space-y-8">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-20 h-20 bg-[#9D84FF]/20 rounded-full flex items-center justify-center"
      >
        <Sparkles size={40} className="text-[#9D84FF]" />
      </motion.div>

      <div className="h-8 relative w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl font-medium text-white/90 absolute inset-0"
          >
            {texts[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

const InviteScreen = ({ onNext }: { onNext: () => void }) => {
  const [copied, setCopied] = useState(false);
  const inviteCode = "NABU-4821";
  const inviteLink = `nabu.app/invite/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full justify-between py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">Invite your partner</h2>
          <p className="text-white/60">
            When they join, your daily questions and shared progress unlock
            together.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider">
              Your Invite Link
            </p>
            <div className="flex items-center gap-3 bg-[#13111C] p-4 rounded-2xl border border-white/10">
              <span className="flex-1 text-white truncate font-medium">
                {inviteLink}
              </span>
              <button
                onClick={handleCopy}
                className="w-10 h-10 rounded-xl bg-[#9D84FF]/20 text-[#9D84FF] flex items-center justify-center hover:bg-[#9D84FF]/30 transition-colors shrink-0"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-white/30 text-sm">
              OR USE CODE
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="text-center">
            <p className="text-3xl font-mono font-bold tracking-widest text-white">
              {inviteCode}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleCopy}
          className="bg-white text-[#13111C] hover:bg-white/90"
        >
          <Share2 size={20} />
          Share Invite Link
        </Button>
        <Button variant="secondary" onClick={onNext}>
          I'll do this later
        </Button>
      </div>
    </div>
  );
};

/*
=============================================================================
BACKEND INTEGRATION GUIDE
=============================================================================

1. WHAT TO CONNECT TO BACKEND LATER:
   The `data` state object (type OnboardingData) holds all collected answers.
   When the user clicks "Start My Journey" on Step 14, you should trigger an 
   API call (e.g., POST /api/users/onboarding) with this payload.

2. WHERE TO PLUG IN PARTNER INVITE API:
   In `InviteScreen` (Step 13), the `inviteCode` and `inviteLink` are currently mocked.
   You should fetch a real invite code from your backend when the component mounts,
   or pass it down as a prop if generated earlier in the flow.
   Example: 
   useEffect(() => { 
     fetch('/api/invite-code').then(res => res.json()).then(data => setInviteCode(data.code)) 
   }, [])

3. HOW TO SAVE ONBOARDING ANSWERS:
   Inside the `renderScreen` switch for `case 14`, locate the "Start My Journey" button.
   Replace the `console.log` and `alert` with your mutation logic:
   
   const handleComplete = async () => {
     try {
       await saveOnboardingData(data); // Your API client function
       router.push('/home'); // Next.js router
     } catch (error) {
       // Handle error
     }
   }

4. HOW TO ROUTE TO FIRST IN-APP EXPERIENCE:
   Use Next.js `useRouter` from `next/navigation`.
   After the API call succeeds in step 14, call `router.push('/dashboard')` or 
   wherever the core loop begins.
=============================================================================
*/
