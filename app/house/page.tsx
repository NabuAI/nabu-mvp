import { readdir } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";

import RoomPlayground from "@/app/house/room-playground";

type AssetCategory = "floor" | "wall" | "frame" | "furniture";

type Asset = {
  path: string;
  name: string;
  width: number;
  height: number;
  category: AssetCategory;
};

type FrameTiles = {
  top?: Asset;
  bottom?: Asset;
  sideLeft?: Asset;
  sideRight?: Asset;
  topLeft?: Asset;
  topRight?: Asset;
  bottomLeft?: Asset;
  bottomRight?: Asset;
};

export const metadata: Metadata = {
  title: "Nabu House Builder",
  description: "Design your room with floors, walls, and furniture sprites.",
};

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(fullPath);
      }
      return [fullPath];
    }),
  );
  return files.flat();
}

function parseAsset(fullPath: string): Asset | null {
  if (!fullPath.endsWith(".png")) {
    return null;
  }

  const publicRoot = path.join(process.cwd(), "public");
  const relativePublicPath = path
    .relative(publicRoot, fullPath)
    .split(path.sep)
    .join("/");
  const webPath = `/${relativePublicPath}`;
  const fileName = path.basename(fullPath, ".png");
  const parts = fullPath.split(path.sep);
  const sizePart = [...parts].reverse().find((part) => /^\d+x\d+$/i.test(part));
  const [width, height] = sizePart
    ? sizePart.split("x").map((value) => Number.parseInt(value, 10))
    : [16, 16];

  const lowerFileName = fileName.toLowerCase();
  const isFrameTile =
    lowerFileName.startsWith("top") ||
    lowerFileName.startsWith("bottom") ||
    lowerFileName.startsWith("sideleft") ||
    lowerFileName.startsWith("sideright");

  let category: AssetCategory = "furniture";
  if (lowerFileName.startsWith("floor_")) {
    category = "floor";
  } else if (lowerFileName.startsWith("wall_")) {
    category = "wall";
  } else if (isFrameTile) {
    category = "frame";
  }

  return {
    path: webPath,
    name: fileName.replace(/_/g, " "),
    width,
    height,
    category,
  };
}

function byName(a: Asset, b: Asset) {
  return a.path.localeCompare(b.path);
}

export default async function HousePage() {
  const assetDirectory = path.join(process.cwd(), "public", "Assets");
  const files = await collectFiles(assetDirectory);
  const allAssets = files
    .map(parseAsset)
    .filter((asset): asset is Asset => asset !== null);

  const floors = allAssets
    .filter((asset) => asset.category === "floor")
    .sort(byName);
  const walls = allAssets
    .filter((asset) => asset.category === "wall")
    .sort(byName);
  const frameAssets = allAssets
    .filter((asset) => asset.category === "frame")
    .sort(byName);
  const furniture = allAssets
    .filter((asset) => asset.category === "furniture")
    .sort(byName);

  const frameTiles: FrameTiles = {
    top: frameAssets.find((asset) => asset.name.startsWith("top ")),
    bottom: frameAssets.find((asset) => asset.name.startsWith("bottom ")),
    sideLeft: frameAssets.find((asset) => asset.name.startsWith("sideleft")),
    sideRight: frameAssets.find((asset) => asset.name.startsWith("sideright")),
    topLeft: frameAssets.find((asset) => asset.name.startsWith("topleft")),
    topRight: frameAssets.find((asset) => asset.name.startsWith("topright")),
    bottomLeft: frameAssets.find((asset) =>
      asset.name.startsWith("bottomleft"),
    ),
    bottomRight: frameAssets.find((asset) =>
      asset.name.startsWith("bottomright"),
    ),
  };

  return (
    <RoomPlayground
      floors={floors}
      walls={walls}
      frameTiles={frameTiles}
      furniture={furniture}
    />
  );
}
