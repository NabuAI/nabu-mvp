"use client";

import { motion } from "framer-motion";
import { Home, House, AlignJustify } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

type TabId = "home" | "house" | "settings";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "house", label: "House", icon: House },
  { id: "home", label: "Home", icon: Home },
  { id: "settings", label: "Settings", icon: AlignJustify },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#13111C] text-white flex justify-center items-stretch overflow-hidden">
      <div
        className="w-full max-w-md h-dvh relative bg-[#13111C] flex flex-col px-6"
        style={{
          paddingTop: "calc(var(--safe-top) + 2.5rem)",
          paddingBottom: "calc(var(--safe-bottom) + 7rem)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(157,132,255,0.2),transparent_70%)] pointer-events-none" />
        <div className="absolute -left-20 top-28 w-48 h-48 rounded-full bg-[#9D84FF]/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 top-52 w-44 h-44 rounded-full bg-[#FF84E8]/10 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
            Nabu
          </p>
          <h1 className="text-[2.15rem] leading-tight font-semibold mt-3">
            Home
          </h1>
          <p className="text-white/60 mt-4 max-w-72 leading-relaxed text-[0.97rem]">
            Placeholder home screen. Your real dashboard widgets and feed will
            live here.
          </p>
        </motion.div>

        <div
          className="fixed inset-x-0 bottom-0 flex justify-center z-30"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 0.75rem)" }}
        >
          <div className="w-full max-w-md px-4">
            <div className="relative rounded-[34px] border border-white/12 bg-white/4 backdrop-blur-2xl px-4 pt-3 pb-4 shadow-[0_-8px_40px_rgba(0,0,0,0.35)]">
              <motion.button
                type="button"
                onClick={() => setActiveTab("home")}
                className="absolute left-1/2 -translate-x-1/2 -top-8 w-24 h-24 rounded-[28px] bg-linear-to-b from-[#232036] to-[#181529] border border-white/10 flex items-center justify-center"
                animate={
                  activeTab === "home"
                    ? { boxShadow: "0 0 38px rgba(157,132,255,0.55)" }
                    : { boxShadow: "0 14px 35px rgba(0,0,0,0.45)" }
                }
                whileTap={{
                  scale: 0.95,
                  boxShadow: "0 0 46px rgba(255,132,232,0.6)",
                }}
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#9D84FF] to-[#FF84E8] flex items-center justify-center"
                  animate={
                    activeTab === "home"
                      ? { boxShadow: "0 0 28px rgba(157,132,255,0.55)" }
                      : { boxShadow: "0 0 20px rgba(157,132,255,0.35)" }
                  }
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <Home size={26} className="text-[#13111C]" />
                </motion.div>
              </motion.button>

              <div className="grid grid-cols-3 items-end gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isCenter = tab.id === "home";
                  const isActive = activeTab === tab.id;

                  const handleTab = () => {
                    setActiveTab(tab.id);
                    if (tab.id === "house") {
                      router.push("/house");
                    } else if (tab.id === "home") {
                      router.push("/home");
                    }
                  };

                  return (
                    <button
                      key={tab.id}
                      onClick={handleTab}
                      className={`flex flex-col items-center rounded-2xl transition-colors duration-200 ${
                        isCenter
                          ? "pt-20 pb-1.5"
                          : "pt-2 pb-1.5 min-h-16 justify-end"
                      } ${isActive ? "text-white" : "text-white/50 hover:text-white/75"}`}
                      aria-label={tab.label}
                    >
                      {!isCenter && <Icon size={24} strokeWidth={2.2} />}
                      <span className="mt-2 text-[13px] font-medium">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
