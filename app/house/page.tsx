import type { Metadata } from "next";

import RoomPlayground from "@/app/house/room-playground";
import { loadAssets } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Nabu House Builder",
  description: "Design your room with floors, walls, and furniture sprites.",
};

export default async function HousePage() {
  const { floors, walls, frameTiles, furniture } = await loadAssets();

  return (
    <RoomPlayground
      floors={floors}
      walls={walls}
      frameTiles={frameTiles}
      furniture={furniture}
    />
  );
}
