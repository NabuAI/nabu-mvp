/* eslint-disable @next/next/no-img-element */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useRewards } from "@/app/providers/rewards-context";
import {
  deriveFurnitureCategory,
  type Asset,
  type FrameTiles,
} from "@/lib/asset-metadata";

type DraftPlacement = {
  asset: Asset;
  x: number;
  y: number;
};

type PlacedFurniture = DraftPlacement & {
  id: string;
};

type RoomPlaygroundProps = {
  floors: Asset[];
  walls: Asset[];
  frameTiles: FrameTiles;
  furniture: Asset[];
};

type BubblePanel = "inventory" | "floor" | "wall" | null;

type InventoryCategory = {
  name: string;
  items: Asset[];
};

const TILE_SIZE = 32;
const ROOM_WIDTH = 14;
const FLOOR_HEIGHT = 9;
const MAX_SCALE = 2.25;

function tileSpan(px: number) {
  return Math.max(1, Math.round(px / 16));
}

function isTallKitchenItem(asset: Asset) {
  return /kitchen 002/i.test(asset.name);
}

function usesFullFootprint(asset: Asset) {
  return /table|desk|counter/i.test(asset.name) || isTallKitchenItem(asset);
}

function getCollisionHeightReduction(asset: Asset) {
  if (isTallKitchenItem(asset)) {
    return 2;
  }
  if (/table|desk|counter/i.test(asset.name)) {
    return 1;
  }
  return 0;
}

function getCollisionBounds(placement: DraftPlacement) {
  const width = isTallKitchenItem(placement.asset)
    ? Math.max(2, tileSpan(placement.asset.width))
    : tileSpan(placement.asset.width);
  const rawHeight = tileSpan(placement.asset.height);
  const fullFootprint = usesFullFootprint(placement.asset);
  const requiredHeight = fullFootprint
    ? Math.max(1, rawHeight - getCollisionHeightReduction(placement.asset))
    : 1;
  const top = fullFootprint
    ? placement.y + (rawHeight - requiredHeight)
    : placement.y + rawHeight - 1;

  return {
    left: placement.x,
    right: placement.x + width,
    top,
    bottom: top + requiredHeight,
  };
}

function intersectsWall(placement: DraftPlacement) {
  const bounds = getCollisionBounds(placement);
  const wallTop = -1;
  const wallBottom = 0;
  return bounds.top < wallBottom && bounds.bottom > wallTop;
}

function intersects(a: DraftPlacement, b: DraftPlacement) {
  const aBounds = getCollisionBounds(a);
  const bBounds = getCollisionBounds(b);
  return (
    aBounds.left < bBounds.right &&
    aBounds.right > bBounds.left &&
    aBounds.top < bBounds.bottom &&
    aBounds.bottom > bBounds.top
  );
}

function clampDraft(draft: DraftPlacement): DraftPlacement {
  const maxX = ROOM_WIDTH - tileSpan(draft.asset.width);
  const itemHeight = tileSpan(draft.asset.height);
  const maxY = FLOOR_HEIGHT - itemHeight;
  const minY = 1 - itemHeight;
  return {
    ...draft,
    x: Math.max(0, Math.min(draft.x, Math.max(0, maxX))),
    y: Math.max(minY, Math.min(draft.y, maxY)),
  };
}

function getInitialDraft(asset: Asset): DraftPlacement {
  const w = tileSpan(asset.width);
  const h = tileSpan(asset.height);
  return {
    asset,
    x: Math.max(0, Math.floor((ROOM_WIDTH - w) / 2)),
    y: Math.max(0, Math.floor((FLOOR_HEIGHT - h) / 2)),
  };
}

function getTouchDistance(touches: React.TouchList) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export default function RoomPlayground({
  floors,
  walls,
  frameTiles,
  furniture,
}: RoomPlaygroundProps) {
  const router = useRouter();
  const roomViewportRef = useRef<HTMLDivElement | null>(null);
  const roomFrameRef = useRef<HTMLDivElement | null>(null);
  const pinchStateRef = useRef<{
    startDistance: number;
    startScale: number;
  } | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
  } | null>(null);
  const suppressNextTapRef = useRef(false);
  const [selectedFloor, setSelectedFloor] = useState<Asset>(floors[0]);
  const [selectedWall, setSelectedWall] = useState<Asset>(walls[0]);
  const [placed, setPlaced] = useState<PlacedFurniture[]>([]);
  const [draft, setDraft] = useState<DraftPlacement | null>(null);
  const [activePanel, setActivePanel] = useState<BubblePanel>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [inventoryCategory, setInventoryCategory] = useState<string | null>(
    null,
  );
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const { ownedFurnitureSet } = useRewards();
  const starterPaths = useMemo(
    () => furniture.slice(0, 14).map((item) => item.path),
    [furniture],
  );
  const unlockedPaths = useMemo(() => {
    const set = new Set<string>();
    for (const path of starterPaths) {
      set.add(path);
    }
    ownedFurnitureSet.forEach((path) => set.add(path));
    return set;
  }, [ownedFurnitureSet, starterPaths]);
  const availableFurniture = useMemo(
    () => furniture.filter((item) => unlockedPaths.has(item.path)),
    [furniture, unlockedPaths],
  );

  const clampScale = (nextScale: number, nextFitScale = fitScale) =>
    Math.min(MAX_SCALE, Math.max(nextFitScale, nextScale));

  const roomWidthPx = ROOM_WIDTH * TILE_SIZE;
  const wallHeightPx = Math.max(
    TILE_SIZE,
    tileSpan(selectedWall.height) * TILE_SIZE,
  );
  const floorHeightPx = FLOOR_HEIGHT * TILE_SIZE;
  const floorLeftPx = TILE_SIZE;
  const floorTopPx = wallHeightPx;
  const stageWidthPx = roomWidthPx + TILE_SIZE * 2;
  const stageHeightPx = wallHeightPx + floorHeightPx + TILE_SIZE;
  const roomScale = clampScale(fitScale * zoomLevel);
  const scaledStageWidthPx = Math.max(1, Math.round(stageWidthPx * roomScale));
  const scaledStageHeightPx = Math.max(
    1,
    Math.round(stageHeightPx * roomScale),
  );
  const scaledFloorTileWidth = selectedFloor.width * 2;
  const scaledFloorTileHeight = selectedFloor.height * 2;
  const useIsometricFloorPattern =
    selectedFloor.width === 64 && selectedFloor.height === 48;
  const floorBackgroundImage = useIsometricFloorPattern
    ? `url(${selectedFloor.path}), url(${selectedFloor.path})`
    : `url(${selectedFloor.path})`;
  const floorBackgroundRepeat = useIsometricFloorPattern
    ? "repeat, repeat"
    : "repeat";
  const floorBackgroundSize = useIsometricFloorPattern
    ? `${scaledFloorTileWidth}px ${scaledFloorTileHeight}px, ${scaledFloorTileWidth}px ${scaledFloorTileHeight}px`
    : `${scaledFloorTileWidth}px ${scaledFloorTileHeight}px`;
  const floorBackgroundPosition = useIsometricFloorPattern
    ? `0 0, ${scaledFloorTileWidth / 2}px ${scaledFloorTileHeight / 2}px`
    : "left top";

  const topFrameTile = frameTiles.top ?? frameTiles.bottom;
  const bottomFrameTile = frameTiles.bottom ?? frameTiles.top;

  const topStep =
    Math.max(1, tileSpan((topFrameTile ?? selectedFloor).width)) * TILE_SIZE;
  const bottomStep =
    Math.max(1, tileSpan((bottomFrameTile ?? selectedFloor).width)) * TILE_SIZE;
  const leftStep =
    Math.max(1, tileSpan((frameTiles.sideLeft ?? selectedFloor).height)) *
    TILE_SIZE;
  const rightStep =
    Math.max(1, tileSpan((frameTiles.sideRight ?? selectedFloor).height)) *
    TILE_SIZE;
  const topCount = Math.ceil(roomWidthPx / topStep);
  const bottomCount = Math.ceil(roomWidthPx / bottomStep);
  const sideHeightPx = Math.max(TILE_SIZE, floorHeightPx + wallHeightPx);
  const leftCount = Math.ceil(sideHeightPx / leftStep);
  const rightCount = Math.ceil(sideHeightPx / rightStep);
  const trimSeamOverlapPx = 1;
  const topTileWidthPx = (topFrameTile?.width ?? 16) * 2;
  const bottomTileWidthPx = (bottomFrameTile?.width ?? 16) * 2;
  const topTrimVisualOffsetPx = Math.max(
    0,
    Math.round((topTileWidthPx - topStep) / 2),
  );
  const bottomTrimVisualOffsetPx = Math.max(
    0,
    Math.round((bottomTileWidthPx - bottomStep) / 2),
  );

  const isDraftValid = useMemo(() => {
    if (!draft) return false;
    const clamped = clampDraft(draft);
    if (clamped.x !== draft.x || clamped.y !== draft.y) return false;
    if (intersectsWall(draft)) return false;
    return !placed.some((item) => intersects(item, draft));
  }, [draft, placed]);

  const inventoryCategories = useMemo<InventoryCategory[]>(() => {
    const grouped = new Map<string, Asset[]>();
    for (const item of availableFurniture) {
      const category = deriveFurnitureCategory(item.name);
      const existing = grouped.get(category);
      if (existing) {
        existing.push(item);
      } else {
        grouped.set(category, [item]);
      }
    }
    return [...grouped.entries()]
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableFurniture]);

  const activeInventoryCategoryName =
    inventoryCategory &&
    inventoryCategories.some((category) => category.name === inventoryCategory)
      ? inventoryCategory
      : inventoryCategories[0]?.name;

  const activeInventoryItems = useMemo(() => {
    return (
      inventoryCategories.find(
        (entry) => entry.name === activeInventoryCategoryName,
      )?.items ?? []
    );
  }, [activeInventoryCategoryName, inventoryCategories]);

  useEffect(() => {
    function updateRoomScale() {
      const viewport = roomViewportRef.current;
      if (!viewport) return;
      const availableWidth = Math.max(1, viewport.clientWidth - 8);
      const availableHeight = Math.max(1, viewport.clientHeight - 8);
      const widthScale = availableWidth / stageWidthPx;
      const heightScale = availableHeight / stageHeightPx;
      const nextScale = Math.min(1, widthScale, heightScale);
      setFitScale(nextScale);
    }
    updateRoomScale();
    window.addEventListener("resize", updateRoomScale);
    return () => {
      window.removeEventListener("resize", updateRoomScale);
    };
  }, [activePanel, stageHeightPx, stageWidthPx]);

  useEffect(() => {
    const frame = roomFrameRef.current;
    if (!frame) return;

    const maxPanX = Math.max(0, (scaledStageWidthPx - frame.clientWidth) / 2);
    const maxPanY = Math.max(0, (scaledStageHeightPx - frame.clientHeight) / 2);

    setPanX((current) => {
      if (roomScale <= fitScale + 0.01 || maxPanX === 0) return 0;
      return Math.max(-maxPanX, Math.min(maxPanX, current));
    });

    setPanY((current) => {
      if (roomScale <= fitScale + 0.01 || maxPanY === 0) return 0;
      return Math.max(-maxPanY, Math.min(maxPanY, current));
    });
  }, [fitScale, roomScale, scaledStageHeightPx, scaledStageWidthPx]);

  function clampPan(nextX: number, nextY: number, scale = roomScale) {
    const frame = roomFrameRef.current;
    if (!frame) return { x: nextX, y: nextY };
    const scaledWidth = stageWidthPx * scale;
    const scaledHeight = stageHeightPx * scale;
    const maxPanX = Math.max(0, (scaledWidth - frame.clientWidth) / 2);
    const maxPanY = Math.max(0, (scaledHeight - frame.clientHeight) / 2);
    return {
      x: maxPanX > 0 ? Math.max(-maxPanX, Math.min(maxPanX, nextX)) : 0,
      y: maxPanY > 0 ? Math.max(-maxPanY, Math.min(maxPanY, nextY)) : 0,
    };
  }

  function zoomTo(
    nextScale: number,
    focal?: {
      x: number;
      y: number;
    },
  ) {
    const frame = roomFrameRef.current;
    const clampedScale = clampScale(nextScale);
    if (!frame) {
      setZoomLevel(clampedScale / Math.max(fitScale, 0.0001));
      return;
    }

    const rect = frame.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const focusX = focal?.x ?? centerX;
    const focusY = focal?.y ?? centerY;

    const currentScale = roomScale;
    const stageOriginX = centerX - (stageWidthPx * currentScale) / 2 + panX;
    const stageOriginY = centerY - (stageHeightPx * currentScale) / 2 + panY;
    const focusStageX = (focusX - stageOriginX) / currentScale;
    const focusStageY = (focusY - stageOriginY) / currentScale;

    const deltaX =
      (currentScale - clampedScale) * (stageWidthPx / 2 + focusStageX);
    const deltaY =
      (currentScale - clampedScale) * (stageHeightPx / 2 + focusStageY);

    const boundedPan = clampPan(panX + deltaX, panY + deltaY, clampedScale);
    setPanX(boundedPan.x);
    setPanY(boundedPan.y);
    setZoomLevel(clampedScale / Math.max(fitScale, 0.0001));
  }

  function handleViewportTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      const startDistance = getTouchDistance(event.touches);
      if (!startDistance) return;
      pinchStateRef.current = { startDistance, startScale: roomScale };
      dragStateRef.current = null;
      return;
    }
    if (event.touches.length === 1 && roomScale > fitScale + 0.01) {
      dragStateRef.current = {
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY,
        startPanX: panX,
        startPanY: panY,
        moved: false,
      };
    }
  }

  function handleViewportTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || !pinchStateRef.current) {
      if (event.touches.length === 1 && dragStateRef.current) {
        const deltaX = event.touches[0].clientX - dragStateRef.current.startX;
        const deltaY = event.touches[0].clientY - dragStateRef.current.startY;
        const nextPan = clampPan(
          dragStateRef.current.startPanX + deltaX,
          dragStateRef.current.startPanY + deltaY,
        );
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          dragStateRef.current.moved = true;
          event.preventDefault();
        }
        setPanX(nextPan.x);
        setPanY(nextPan.y);
      }
      return;
    }

    event.preventDefault();
    const currentDistance = getTouchDistance(event.touches);
    if (!currentDistance) return;
    const ratio = currentDistance / pinchStateRef.current.startDistance;
    const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    zoomTo(pinchStateRef.current.startScale * ratio, { x: midX, y: midY });
  }

  function handleViewportTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (dragStateRef.current?.moved) {
      suppressNextTapRef.current = true;
      setTimeout(() => {
        suppressNextTapRef.current = false;
      }, 0);
    }
    if (event.touches.length === 0) {
      dragStateRef.current = null;
    }
    if (event.touches.length < 2) {
      pinchStateRef.current = null;
    }
  }

  function startDraft(asset: Asset) {
    setDraft(getInitialDraft(asset));
  }

  function moveDraft(deltaX: number, deltaY: number) {
    setDraft((current) => {
      if (!current) return current;
      return clampDraft({
        ...current,
        x: current.x + deltaX,
        y: current.y + deltaY,
      });
    });
  }

  function placeDraft() {
    if (!draft || !isDraftValid) return;
    setPlaced((current) => [
      ...current,
      { ...draft, id: `${draft.asset.path}-${Date.now()}-${current.length}` },
    ]);
    setDraft(null);
  }

  function setDraftFromClick(event: React.MouseEvent<HTMLDivElement>) {
    if (suppressNextTapRef.current) {
      suppressNextTapRef.current = false;
      return;
    }
    if (!draft) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(
      (event.clientX - bounds.left) / (TILE_SIZE * roomScale),
    );
    const y = Math.floor(
      (event.clientY - bounds.top) / (TILE_SIZE * roomScale),
    );
    const anchorHeight = tileSpan(draft.asset.height);
    setDraft(
      clampDraft({
        ...draft,
        x,
        y: y - (anchorHeight - 1),
      }),
    );
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(157,132,255,0.14),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,132,232,0.12),transparent_40%),#13111C] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.04),transparent_45%)]" />

      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-[calc(var(--safe-top)+0.5rem)]">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.35)] transition hover:bg-white/10"
        >
          ← Back to Home
        </button>
        <button
          type="button"
          onClick={() => setPlaced([])}
          className="rounded-full border border-[#9D84FF]/50 bg-[#9D84FF]/20 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(157,132,255,0.35)] hover:bg-[#9D84FF]/30"
        >
          Clear
        </button>
      </div>

      <div
        ref={roomViewportRef}
        className="absolute inset-x-0 top-0"
        onWheel={(event) => {
          event.preventDefault();
          const zoomFactor = Math.exp(-event.deltaY * 0.0012);
          zoomTo(roomScale * zoomFactor, {
            x: event.clientX,
            y: event.clientY,
          });
        }}
        onTouchStart={handleViewportTouchStart}
        onTouchMove={handleViewportTouchMove}
        onTouchEnd={handleViewportTouchEnd}
        onTouchCancel={handleViewportTouchEnd}
        style={{
          bottom: activePanel ? "22rem" : "7.5rem",
          paddingTop: "4.2rem",
          paddingLeft: "0.75rem",
          paddingRight: "0.75rem",
          touchAction: "none",
        }}
      >
        <div
          ref={roomFrameRef}
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-white/12 bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-4xl"
        >
          <div
            className="relative"
            style={{
              width: `${scaledStageWidthPx}px`,
              height: `${scaledStageHeightPx}px`,
              transform: `translate(${panX}px, ${panY}px)`,
            }}
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: `${stageWidthPx}px`,
                height: `${stageHeightPx}px`,
                transform: `scale(${roomScale})`,
              }}
            >
              <div
                aria-hidden
                className="absolute top-0"
                style={{
                  left: `${floorLeftPx}px`,
                  width: `${roomWidthPx}px`,
                  height: `${wallHeightPx}px`,
                  backgroundImage: `url(${selectedWall.path})`,
                  backgroundRepeat: "repeat-x",
                  backgroundSize: `${selectedWall.width * 2}px ${selectedWall.height * 2}px`,
                  imageRendering: "pixelated",
                }}
              />

              {topFrameTile
                ? Array.from({ length: topCount }).map((_, index) => (
                    <img
                      key={`frame-top-${index}`}
                      src={topFrameTile.path}
                      alt="top frame"
                      width={topFrameTile.width * 2}
                      height={topFrameTile.height * 2}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${floorLeftPx + index * topStep - (index > 0 ? trimSeamOverlapPx : 0) - topTrimVisualOffsetPx}px`,
                        top: `${floorTopPx - TILE_SIZE * 5}px`,
                        width: `${topFrameTile.width * 2 + trimSeamOverlapPx}px`,
                        height: `${topFrameTile.height * 2}px`,
                        imageRendering: "pixelated",
                      }}
                    />
                  ))
                : null}

              {bottomFrameTile
                ? Array.from({ length: bottomCount }).map((_, index) => (
                    <img
                      key={`frame-bottom-${index}`}
                      src={bottomFrameTile.path}
                      alt="bottom frame"
                      width={bottomFrameTile.width * 2}
                      height={bottomFrameTile.height * 2}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${floorLeftPx + index * bottomStep - (index > 0 ? trimSeamOverlapPx : 0) - bottomTrimVisualOffsetPx}px`,
                        top: `${floorTopPx + floorHeightPx}px`,
                        width: `${bottomFrameTile.width * 2 + trimSeamOverlapPx}px`,
                        height: `${bottomFrameTile.height * 2}px`,
                        imageRendering: "pixelated",
                      }}
                    />
                  ))
                : null}

              {frameTiles.sideLeft
                ? Array.from({ length: leftCount }).map((_, index) => (
                    <img
                      key={`frame-left-${index}`}
                      src={frameTiles.sideLeft?.path}
                      alt="left frame"
                      width={(frameTiles.sideLeft?.width ?? 16) * 2}
                      height={(frameTiles.sideLeft?.height ?? 16) * 2}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${floorLeftPx - TILE_SIZE}px`,
                        top: `${floorTopPx - wallHeightPx + index * leftStep - (index > 0 ? trimSeamOverlapPx : 0)}px`,
                        width: `${(frameTiles.sideLeft?.width ?? 16) * 2}px`,
                        height: `${(frameTiles.sideLeft?.height ?? 16) * 2 + trimSeamOverlapPx}px`,
                        imageRendering: "pixelated",
                      }}
                    />
                  ))
                : null}

              {frameTiles.sideRight
                ? Array.from({ length: rightCount }).map((_, index) => (
                    <img
                      key={`frame-right-${index}`}
                      src={frameTiles.sideRight?.path}
                      alt="right frame"
                      width={(frameTiles.sideRight?.width ?? 16) * 2}
                      height={(frameTiles.sideRight?.height ?? 16) * 2}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${floorLeftPx + roomWidthPx}px`,
                        top: `${floorTopPx - wallHeightPx + index * rightStep - (index > 0 ? trimSeamOverlapPx : 0)}px`,
                        width: `${(frameTiles.sideRight?.width ?? 16) * 2}px`,
                        height: `${(frameTiles.sideRight?.height ?? 16) * 2 + trimSeamOverlapPx}px`,
                        imageRendering: "pixelated",
                      }}
                    />
                  ))
                : null}

              {frameTiles.topLeft ? (
                <img
                  src={frameTiles.topLeft.path}
                  alt="top left corner"
                  width={frameTiles.topLeft.width * 2}
                  height={frameTiles.topLeft.height * 2}
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: `${floorLeftPx - TILE_SIZE}px`,
                    top: `${floorTopPx - wallHeightPx - TILE_SIZE}px`,
                    width: `${frameTiles.topLeft.width * 2}px`,
                    height: `${frameTiles.topLeft.height * 2}px`,
                    imageRendering: "pixelated",
                  }}
                />
              ) : null}

              {frameTiles.topRight ? (
                <img
                  src={frameTiles.topRight.path}
                  alt="top right corner"
                  width={frameTiles.topRight.width * 2}
                  height={frameTiles.topRight.height * 2}
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: `${floorLeftPx + roomWidthPx}px`,
                    top: `${floorTopPx - wallHeightPx - TILE_SIZE}px`,
                    width: `${frameTiles.topRight.width * 2}px`,
                    height: `${frameTiles.topRight.height * 2}px`,
                    imageRendering: "pixelated",
                  }}
                />
              ) : null}

              {frameTiles.bottomLeft ? (
                <img
                  src={frameTiles.bottomLeft.path}
                  alt="bottom left corner"
                  width={frameTiles.bottomLeft.width * 2}
                  height={frameTiles.bottomLeft.height * 2}
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: `${floorLeftPx - TILE_SIZE}px`,
                    top: `${floorTopPx + floorHeightPx}px`,
                    width: `${frameTiles.bottomLeft.width * 2}px`,
                    height: `${frameTiles.bottomLeft.height * 2}px`,
                    imageRendering: "pixelated",
                  }}
                />
              ) : null}

              {frameTiles.bottomRight ? (
                <img
                  src={frameTiles.bottomRight.path}
                  alt="bottom right corner"
                  width={frameTiles.bottomRight.width * 2}
                  height={frameTiles.bottomRight.height * 2}
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: `${floorLeftPx + roomWidthPx}px`,
                    top: `${floorTopPx + floorHeightPx}px`,
                    width: `${frameTiles.bottomRight.width * 2}px`,
                    height: `${frameTiles.bottomRight.height * 2}px`,
                    imageRendering: "pixelated",
                  }}
                />
              ) : null}

              <div
                role="button"
                tabIndex={0}
                onClick={setDraftFromClick}
                onKeyDown={(event) => {
                  if (!draft) return;
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    moveDraft(-1, 0);
                  }
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    moveDraft(1, 0);
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveDraft(0, -1);
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveDraft(0, 1);
                  }
                }}
                className="absolute cursor-crosshair border border-white/10"
                style={{
                  left: `${floorLeftPx}px`,
                  top: `${floorTopPx}px`,
                  width: `${roomWidthPx}px`,
                  height: `${floorHeightPx}px`,
                  backgroundImage: floorBackgroundImage,
                  backgroundRepeat: floorBackgroundRepeat,
                  backgroundSize: floorBackgroundSize,
                  backgroundPosition: floorBackgroundPosition,
                  imageRendering: "pixelated",
                  outline: "none",
                }}
              >
                {draft ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                      backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                      pointerEvents: "none",
                    }}
                  />
                ) : null}

                {[...placed]
                  .sort(
                    (a, b) =>
                      a.y +
                      tileSpan(a.asset.height) -
                      (b.y + tileSpan(b.asset.height)),
                  )
                  .map((item) => {
                    const width = item.asset.width * 2;
                    const height = item.asset.height * 2;
                    return (
                      <img
                        key={item.id}
                        src={item.asset.path}
                        alt={item.asset.name}
                        width={width}
                        height={height}
                        className="absolute pointer-events-none"
                        style={{
                          left: `${item.x * TILE_SIZE}px`,
                          top: `${item.y * TILE_SIZE}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                          imageRendering: "pixelated",
                        }}
                      />
                    );
                  })}

                {draft ? (
                  <img
                    src={draft.asset.path}
                    alt={`${draft.asset.name} preview`}
                    width={draft.asset.width * 2}
                    height={draft.asset.height * 2}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${draft.x * TILE_SIZE}px`,
                      top: `${draft.y * TILE_SIZE}px`,
                      width: `${draft.asset.width * 2}px`,
                      height: `${draft.asset.height * 2}px`,
                      imageRendering: "pixelated",
                      filter: isDraftValid
                        ? "grayscale(0.15) brightness(1.1) saturate(1.05)"
                        : "grayscale(0.8) sepia(1) hue-rotate(-40deg) saturate(8) brightness(0.85)",
                      opacity: 0.92,
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-bottom)+1.25rem)] z-30 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() =>
              setActivePanel((current) =>
                current === "inventory" ? null : "inventory",
              )
            }
            className={`h-12 rounded-full px-4 text-sm font-semibold transition ${
              activePanel === "inventory"
                ? "bg-[#9D84FF] text-[#0f0c18] shadow-[0_0_20px_rgba(157,132,255,0.55)]"
                : "bg-white/10 text-white/80 hover:bg-white/16"
            }`}
          >
            Inventory
          </button>
          <button
            type="button"
            onClick={() =>
              setActivePanel((current) =>
                current === "floor" ? null : "floor",
              )
            }
            className={`h-12 rounded-full px-4 text-sm font-semibold transition ${
              activePanel === "floor"
                ? "bg-[#9D84FF] text-[#0f0c18] shadow-[0_0_20px_rgba(157,132,255,0.55)]"
                : "bg-white/10 text-white/80 hover:bg-white/16"
            }`}
          >
            Floor
          </button>
          <button
            type="button"
            onClick={() =>
              setActivePanel((current) => (current === "wall" ? null : "wall"))
            }
            className={`h-12 rounded-full px-4 text-sm font-semibold transition ${
              activePanel === "wall"
                ? "bg-[#9D84FF] text-[#0f0c18] shadow-[0_0_20px_rgba(157,132,255,0.55)]"
                : "bg-white/10 text-white/80 hover:bg-white/16"
            }`}
          >
            Wall
          </button>
        </div>
      </div>

      {activePanel ? (
        <section
          className="fixed inset-x-0 bottom-0 z-40 overflow-hidden rounded-t-3xl border-t border-white/12 bg-[#0f0c18]/95 px-4 pb-4 pt-3 shadow-[0_-14px_38px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          style={{ maxHeight: "75svh" }}
        >
          <div className="mx-auto flex max-h-full w-full max-w-5xl flex-col gap-3 overflow-y-auto pb-[calc(var(--safe-bottom)+1rem)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
                {activePanel === "inventory"
                  ? "Inventory"
                  : activePanel === "floor"
                    ? "Floor"
                    : "Wall"}
              </h2>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/16"
              >
                Close
              </button>
            </div>

            {activePanel === "floor" ? (
              <div className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
                {floors.map((asset) => {
                  const active = selectedFloor.path === asset.path;
                  return (
                    <button
                      key={asset.path}
                      type="button"
                      onClick={() => setSelectedFloor(asset)}
                      className={`min-h-11 rounded-lg border p-1 transition ${
                        active
                          ? "border-[#9D84FF] bg-[#9D84FF]/15 shadow-[0_0_18px_rgba(157,132,255,0.35)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                      title={asset.name}
                    >
                      <img
                        src={asset.path}
                        alt={asset.name}
                        width={48}
                        height={48}
                        className="mx-auto h-9 w-9 object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activePanel === "wall" ? (
              <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
                {walls.map((asset) => {
                  const active = selectedWall.path === asset.path;
                  return (
                    <button
                      key={asset.path}
                      type="button"
                      onClick={() => setSelectedWall(asset)}
                      className={`min-h-11 rounded-lg border p-1 transition ${
                        active
                          ? "border-[#9D84FF] bg-[#9D84FF]/15 shadow-[0_0_18px_rgba(157,132,255,0.35)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                      title={asset.name}
                    >
                      <img
                        src={asset.path}
                        alt={asset.name}
                        width={64}
                        height={48}
                        className="mx-auto h-9 w-11 object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activePanel === "inventory" ? (
              <>
                <div className="flex items-center justify-between text-xs text-white/65">
                  <span>{availableFurniture.length} items unlocked</span>
                  <button
                    type="button"
                    onClick={() => router.push("/shop")}
                    className="rounded-full border border-white/14 bg-white/8 px-3 py-1 font-semibold text-white hover:bg-white/14"
                  >
                    Open Shop
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {inventoryCategories.map((category) => {
                    const active =
                      activeInventoryCategoryName === category.name;
                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => setInventoryCategory(category.name)}
                        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-[#9D84FF] bg-[#9D84FF]/15 text-white shadow-[0_0_18px_rgba(157,132,255,0.35)]"
                            : "border-white/10 bg-white/5 text-white/80 hover:border-white/20"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>

                <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
                  {activeInventoryItems.map((asset) => {
                    const selected = draft?.asset.path === asset.path;
                    return (
                      <button
                        key={asset.path}
                        type="button"
                        onClick={() => startDraft(asset)}
                        className={`min-h-11 rounded-lg border p-1 transition ${
                          selected
                            ? "border-[#9D84FF] bg-[#9D84FF]/15 shadow-[0_0_18px_rgba(157,132,255,0.35)]"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                        title={asset.name}
                      >
                        <img
                          src={asset.path}
                          alt={asset.name}
                          width={64}
                          height={64}
                          className="mx-auto h-9 w-9 object-contain"
                        />
                      </button>
                    );
                  })}
                </div>

                {draft ? (
                  <div className="sticky bottom-0 rounded-xl border border-white/16 bg-white/8 p-2.5 shadow-[0_-6px_18px_rgba(0,0,0,0.35)] backdrop-blur">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => moveDraft(-1, 0)}
                        className="rounded-lg border border-white/15 bg-white/8 px-2 py-2 text-xs font-medium text-white hover:bg-white/14"
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDraft(0, -1)}
                        className="rounded-lg border border-white/15 bg-white/8 px-2 py-2 text-xs font-medium text-white hover:bg-white/14"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDraft(1, 0)}
                        className="rounded-lg border border-white/15 bg-white/8 px-2 py-2 text-xs font-medium text-white hover:bg-white/14"
                      >
                        Right
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraft(null)}
                        className="rounded-lg border border-white/15 bg-white/8 px-2 py-2 text-xs font-medium text-white hover:bg-white/14"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDraft(0, 1)}
                        className="rounded-lg border border-white/15 bg-white/8 px-2 py-2 text-xs font-medium text-white hover:bg-white/14"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        disabled={!isDraftValid}
                        onClick={placeDraft}
                        className="rounded-lg border border-[#9D84FF]/60 bg-[#9D84FF]/25 px-2 py-2 text-xs font-semibold text-white shadow-[0_0_14px_rgba(157,132,255,0.4)] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Place
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-white/70">
                      {isDraftValid
                        ? "Preview valid. Tap Place to drop it."
                        : "Preview blocked. Move it away from other furniture."}
                    </p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-white/16 bg-white/6 px-3 py-2 text-xs text-white/80">
                    Pick an item from inventory, then tap in the room to
                    position it.
                  </p>
                )}
              </>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
