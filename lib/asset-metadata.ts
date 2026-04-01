export type AssetCategory = "floor" | "wall" | "frame" | "furniture";

export type Asset = {
  path: string;
  name: string;
  width: number;
  height: number;
  category: AssetCategory;
};

export type FrameTiles = {
  top?: Asset;
  bottom?: Asset;
  sideLeft?: Asset;
  sideRight?: Asset;
  topLeft?: Asset;
  topRight?: Asset;
  bottomLeft?: Asset;
  bottomRight?: Asset;
};

export function deriveFurnitureCategory(name: string) {
  const lowerName = name.toLowerCase();
  if (/(chair|stool|bench|seat)/.test(lowerName)) return "Seating";
  if (/(table|desk|counter)/.test(lowerName)) return "Tables";
  if (/(bed|sofa|couch|armchair)/.test(lowerName)) return "Lounge";
  if (/(lamp|light|lantern|chandelier)/.test(lowerName)) return "Lighting";
  if (/(plant|tree|flower|bush|pot)/.test(lowerName)) return "Plants";
  if (/(cabinet|shelf|drawer|wardrobe|bookcase|closet)/.test(lowerName))
    return "Storage";
  if (/(rug|carpet|mat)/.test(lowerName)) return "Rugs";
  if (/(clock|mirror|painting|frame|vase|decor|statue)/.test(lowerName))
    return "Decor";
  const fallback = lowerName
    .replace(/\d+/g, "")
    .split(" ")
    .map((part) => part.trim())
    .find((part) => part.length > 1);
  if (!fallback) return "Misc";
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}
