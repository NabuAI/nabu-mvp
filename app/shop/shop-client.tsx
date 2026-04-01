"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  House,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useRewards } from "@/app/providers/rewards-context";
import { deriveFurnitureCategory, type Asset } from "@/lib/asset-metadata";

type ShopItem = Asset & {
  price: number;
  categoryLabel: string;
};

function priceFor(asset: Asset) {
  const sizeScore = Math.max(asset.width, asset.height);
  const base = 70 + sizeScore * 1.6;
  const lower = asset.name.toLowerCase();
  let bump = 0;
  if (/bed|sofa|couch/.test(lower)) bump += 140;
  if (/table|desk/.test(lower)) bump += 70;
  if (/lamp|light|lantern/.test(lower)) bump += 35;
  if (/plant|tree/.test(lower)) bump += 20;
  if (/rug|carpet/.test(lower)) bump += 40;
  const price = Math.max(90, Math.min(640, Math.round(base + bump)));
  return price;
}

export default function ShopClient({ items }: { items: Asset[] }) {
  const router = useRouter();
  const { state, purchaseFurniture, ownedFurnitureSet } = useRewards();
  const [pulse, setPulse] = useState<string | null>(null);

  const pricedItems = useMemo<ShopItem[]>(
    () =>
      items.map((item) => ({
        ...item,
        price: priceFor(item),
        categoryLabel: deriveFurnitureCategory(item.name),
      })),
    [items],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ShopItem[]>();
    for (const item of pricedItems) {
      const group = map.get(item.categoryLabel) ?? [];
      group.push(item);
      map.set(item.categoryLabel, group);
    }
    return [...map.entries()]
      .map(([label, assets]) => ({
        label,
        assets: assets.sort((a, b) => a.price - b.price),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [pricedItems]);

  const tryPurchase = (item: ShopItem) => {
    if (ownedFurnitureSet.has(item.path)) {
      setPulse("Already owned");
      return;
    }
    const { purchased } = purchaseFurniture({
      assetPath: item.path,
      price: item.price,
    });
    if (purchased) {
      setPulse(`Purchased ${item.name} (−${item.price} pts)`);
    } else {
      setPulse("Not enough points yet");
    }
  };

  return (
    <div className="min-h-dvh bg-[#0f0b1c] text-white">
      <div
        className="mx-auto w-full max-w-5xl px-4 pb-[calc(var(--safe-bottom)+2.5rem)]"
        style={{ paddingTop: "calc(var(--safe-top) + 1rem)" }}
      >
        <div className="sticky top-[calc(var(--safe-top)+0.5rem)] z-20 -mx-1 mb-4">
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#13111c]/85 px-4 py-3 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/12"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="rounded-full border border-white/12 bg-white/8 px-4 py-1.5 text-sm font-semibold text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              Wallet · {state.points} pts
            </div>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-6 rounded-[28px] border border-white/12 bg-gradient-to-br from-[#1a1328] via-[#13111c] to-[#0b0a12] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/60">
              Shop
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9D84FF] to-[#FF84E8] px-3 py-2 text-xs font-semibold text-[#0F0C18] shadow-[0_12px_30px_rgba(157,132,255,0.35)]">
              <ShoppingBag size={14} /> Buy furniture, then place it in your
              house.
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/75">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5">
              <House size={16} />
              Bring purchases to the House tab
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5">
              <Sparkles size={16} />
              Starter items stay free
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/12"
            >
              <Home size={16} /> Home
            </button>
            <button
              type="button"
              onClick={() => router.push("/house")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#9D84FF] to-[#84F3FF] px-3 py-2 text-sm font-semibold text-[#0F0C18] shadow-[0_12px_30px_rgba(132,243,255,0.35)]"
            >
              <House size={16} /> Go place items
            </button>
          </div>
        </motion.section>

        <div className="mt-6 space-y-5">
          {grouped.map((group) => (
            <section
              key={group.label}
              className="rounded-3xl border border-white/10 bg-white/4 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                    Category
                  </p>
                  <h2 className="text-lg font-semibold">{group.label}</h2>
                </div>
                <p className="text-xs text-white/60">
                  {group.assets.length} items
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {group.assets.map((item) => {
                  const owned = ownedFurnitureSet.has(item.path);
                  const affordable = state.points >= item.price;
                  return (
                    <div
                      key={item.path}
                      className="rounded-2xl border border-white/12 bg-[#0f0c18] p-2.5 shadow-[0_10px_26px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-white/65 leading-tight line-clamp-2">
                          {item.name}
                        </p>
                        {owned ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#9D84FF]/20 px-2 py-1 text-[11px] font-semibold text-[#c7b8ff]">
                            <CheckCircle2 size={12} /> Owned
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center justify-center rounded-xl border border-white/12 bg-white/6 p-2">
                        <img
                          src={item.path}
                          alt={item.name}
                          width={item.width}
                          height={item.height}
                          className="h-16 w-16 object-contain"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {item.price} pts
                        </span>
                        <button
                          type="button"
                          disabled={owned || !affordable}
                          onClick={() => tryPurchase(item)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            owned
                              ? "border border-white/12 text-white/60"
                              : affordable
                                ? "bg-gradient-to-r from-[#9D84FF] to-[#FF84E8] text-[#0F0C18] shadow-[0_8px_20px_rgba(157,132,255,0.35)]"
                                : "border border-white/12 text-white/60"
                          }`}
                        >
                          {owned
                            ? "Owned"
                            : affordable
                              ? "Purchase"
                              : "Need pts"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <AnimatePresence>
          {pulse ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 -translate-x-1/2 bottom-5 z-50 rounded-2xl border border-white/12 bg-[#0F0C18]/95 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,0,0,0.45)]"
              onAnimationComplete={() => {
                setTimeout(() => setPulse(null), 1400);
              }}
            >
              {pulse}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
