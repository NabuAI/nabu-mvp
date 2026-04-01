import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  type Asset,
  type AssetCategory,
  type FrameTiles,
} from "@/lib/asset-metadata";

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
  if (!fullPath.endsWith(".png")) return null;

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

function byPath(a: Asset, b: Asset) {
  return a.path.localeCompare(b.path);
}

export async function loadAssets(assetRoot?: string) {
  const assetDirectory =
    assetRoot ?? path.join(process.cwd(), "public", "Assets");
  const files = await collectFiles(assetDirectory);
  const allAssets = files
    .map(parseAsset)
    .filter((asset): asset is Asset => asset !== null)
    .sort(byPath);

  const floors = allAssets.filter((asset) => asset.category === "floor");
  const walls = allAssets.filter((asset) => asset.category === "wall");
  const frameAssets = allAssets.filter((asset) => asset.category === "frame");
  const furniture = allAssets.filter((asset) => asset.category === "furniture");

  const frameTiles: FrameTiles = {
    top:
      frameAssets.find((asset) => asset.name.startsWith("top ")) ?? undefined,
    bottom:
      frameAssets.find((asset) => asset.name.startsWith("bottom ")) ??
      undefined,
    sideLeft:
      frameAssets.find((asset) => asset.name.startsWith("sideleft")) ??
      undefined,
    sideRight:
      frameAssets.find((asset) => asset.name.startsWith("sideright")) ??
      undefined,
    topLeft:
      frameAssets.find((asset) => asset.name.startsWith("topleft")) ??
      undefined,
    topRight:
      frameAssets.find((asset) => asset.name.startsWith("topright")) ??
      undefined,
    bottomLeft:
      frameAssets.find((asset) => asset.name.startsWith("bottomleft")) ??
      undefined,
    bottomRight:
      frameAssets.find((asset) => asset.name.startsWith("bottomright")) ??
      undefined,
  };

  return {
    allAssets,
    floors,
    walls,
    frameTiles,
    furniture,
  };
}
