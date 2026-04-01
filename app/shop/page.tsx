import type { Metadata } from "next";

import ShopClient from "@/app/shop/shop-client";
import { loadAssets } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Nabu Shop",
  description: "Spend points on furniture and bring it into your house.",
};

export default async function ShopPage() {
  const { furniture } = await loadAssets();
  return <ShopClient items={furniture} />;
}
