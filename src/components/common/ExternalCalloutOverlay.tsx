import React, { useMemo } from 'react';

export interface ExternalCalloutItem {
  id: string;
  name: string;
  label?: string;
  color?: string;
  anchorX: number; // 2D projected screen X in pixels
  anchorY: number; // 2D projected screen Y in pixels
  depth?: number; // NDC z-depth (-1 to 1)
  visible: boolean;
  isSelected?: boolean;
  category?: string;
}

interface ExternalCalloutOverlayProps {
  items: ExternalCalloutItem[];
  containerWidth: number;
  containerHeight: number;
  onSelectPart?: (id: string) => void;
  showLabels?: boolean;
}

interface ComputedCallout extends ExternalCalloutItem {
  side: 'left' | 'right';
  badgeX: number;
  badgeY: number;
  elbowX: number;
  elbowY: number;
  badgeWidth: number;
  badgeHeight: number;
}

/**
 * Universal External Callout & Leader-Line Annotation System
 * Places labels in organized left/right margin columns outside the central 3D model
 * silhouette and connects each compact pill badge to its 3D anchor with a non-crossing SVG leader line.
 */
export const ExternalCalloutOverlay: React.FC<ExternalCalloutOverlayProps> = ({
  items,
  containerWidth,
  containerHeight,
  onSelectPart,
  showLabels = true,
}) => {
  const computedCallouts = useMemo<ComputedCallout[]>(() => {
    if (!showLabels || containerWidth < 120 || containerHeight < 120) return [];

    // Filter only valid on-screen visible anchors
    const valid = items.filter(
      (item) =>
        item.visible &&
        Number.isFinite(item.anchorX) &&
        Number.isFinite(item.anchorY) &&
        item.anchorX >= -40 &&
        item.anchorX <= containerWidth + 40 &&
        item.anchorY >= -40 &&
        item.anchorY <= containerHeight + 40
    );

    if (valid.length === 0) return [];

    const centerX = containerWidth / 2;
    const isCompact = containerWidth < 640;
    const badgeHeight = isCompact ? 24 : 28;
    const minVerticalGap = isCompact ? 28 : 34;
    const topMargin = 58; // Leave room for top HUD status bar
    const bottomMargin = containerHeight - 62; // Leave room for bottom dock

    const leftItems: ExternalCalloutItem[] = [];
    const rightItems: ExternalCalloutItem[] = [];

    // Partition into left and right columns relative to model center
    const sortedByX = [...valid].sort((a, b) => a.anchorX - b.anchorX);
    sortedByX.forEach((item, idx) => {
      if (item.anchorX < centerX - 15) {
        leftItems.push(item);
      } else if (item.anchorX > centerX + 15) {
        rightItems.push(item);
      } else {
        if (leftItems.length <= rightItems.length) {
          leftItems.push(item);
        } else {
          rightItems.push(item);
        }
      }
      void idx;
    });

    // Balance if one side has way too many items (> 65% of total when total > 4)
    while (leftItems.length > rightItems.length + 3) {
      const moved = leftItems.pop();
      if (moved) rightItems.unshift(moved);
    }
    while (rightItems.length > leftItems.length + 3) {
      const moved = rightItems.shift();
      if (moved) leftItems.push(moved);
    }

    const layoutSide = (
      sideItems: ExternalCalloutItem[],
      side: 'left' | 'right'
    ): ComputedCallout[] => {
      if (sideItems.length === 0) return [];

      // Sort strictly top-to-bottom by anchorY so leader lines never cross
      const sorted = [...sideItems].sort((a, b) => a.anchorY - b.anchorY);
      const count = sorted.length;

      const availableSpan = Math.max(120, bottomMargin - topMargin);
      const effectiveGap = Math.min(
        minVerticalGap,
        Math.max(22, Math.floor(availableSpan / Math.max(1, count)))
      );

      // Initial desired Y positions clamped to safe vertical bounds
      const yPositions = sorted.map((item) =>
        Math.max(topMargin, Math.min(bottomMargin, item.anchorY))
      );

      // Forward pass: push down overlapping labels
      for (let i = 1; i < count; i++) {
        if (yPositions[i] < yPositions[i - 1] + effectiveGap) {
          yPositions[i] = yPositions[i - 1] + effectiveGap;
        }
      }

      // Backward pass: pull up if bottom overflowed
      if (yPositions[count - 1] > bottomMargin) {
        yPositions[count - 1] = bottomMargin;
        for (let i = count - 2; i >= 0; i--) {
          if (yPositions[i] > yPositions[i + 1] - effectiveGap) {
            yPositions[i] = Math.max(topMargin, yPositions[i + 1] - effectiveGap);
          }
        }
      }

      const marginPad = isCompact ? 10 : 18;

      return sorted.map((item, i) => {
        const text = item.label || item.name;
        const estimatedWidth = Math.min(
          isCompact ? 150 : 225,
          Math.max(isCompact ? 82 : 104, text.length * (isCompact ? 6.2 : 6.8) + 28)
        );
        const by = yPositions[i];

        const bx =
          side === 'left'
            ? marginPad
            : Math.max(centerX + 20, containerWidth - marginPad - estimatedWidth);

        const lineAttachX = side === 'left' ? bx + estimatedWidth : bx;
        const elbowX =
          side === 'left'
            ? Math.min(item.anchorX - 8, lineAttachX + (isCompact ? 14 : 26))
            : Math.max(item.anchorX + 8, lineAttachX - (isCompact ? 14 : 26));

        return {
          ...item,
          side,
          badgeX: bx,
          badgeY: by,
          elbowX,
          elbowY: by,
          badgeWidth: estimatedWidth,
          badgeHeight,
        };
      });
    };

    return [...layoutSide(leftItems, 'left'), ...layoutSide(rightItems, 'right')];
  }, [items, containerWidth, containerHeight, showLabels]);

  if (!showLabels || computedCallouts.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 select-none">
      {/* Crisp SVG Leader Lines & Anchor Target Dots */}
      <svg
        width={containerWidth}
        height={containerHeight}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {computedCallouts.map((c) => {
          const attachX = c.side === 'left' ? c.badgeX + c.badgeWidth : c.badgeX;
          const attachY = c.badgeY;
          const strokeColor = c.isSelected
            ? '#38bdf8'
            : c.color || 'rgba(186, 230, 253, 0.85)';

          return (
            <g key={`leader-${c.id}`}>
              {/* Subtle outer contrast halo for leader line visibility on any background */}
              <polyline
                points={`${c.anchorX},${c.anchorY} ${c.elbowX},${c.elbowY} ${attachX},${attachY}`}
                fill="none"
                stroke="rgba(15, 23, 42, 0.72)"
                strokeWidth={c.isSelected ? 3.6 : 2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Main crisp leader line */}
              <polyline
                points={`${c.anchorX},${c.anchorY} ${c.elbowX},${c.elbowY} ${attachX},${attachY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={c.isSelected ? 2.1 : 1.45}
                strokeDasharray={c.isSelected ? undefined : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* 3D Surface Anchor Point Dot */}
              <circle
                cx={c.anchorX}
                cy={c.anchorY}
                r={c.isSelected ? 4.4 : 3.2}
                fill={c.isSelected ? '#38bdf8' : c.color || '#e0f2fe'}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      {/* External Margin Callout Pill Badges */}
      {computedCallouts.map((c) => {
        const displayTitle = c.label || c.name;
        return (
          <button
            key={`badge-${c.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPart?.(c.id);
            }}
            style={{
              left: `${c.badgeX}px`,
              top: `${c.badgeY - c.badgeHeight / 2}px`,
              width: `${c.badgeWidth}px`,
              height: `${c.badgeHeight}px`,
            }}
            className={`absolute pointer-events-auto cursor-pointer flex items-center gap-1.5 px-2.5 rounded-full text-[11px] font-semibold transition-all duration-150 shadow-sm backdrop-blur-md border ${
              c.isSelected
                ? 'bg-sky-500 text-white border-sky-300 shadow-sky-500/25 scale-[1.03] z-20'
                : 'bg-white/95 text-slate-900 border-slate-300/90 hover:border-sky-400 hover:bg-white'
            }`}
            title={displayTitle}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 border border-black/10"
              style={{
                backgroundColor: c.isSelected ? '#ffffff' : c.color || '#0284c7',
              }}
            />
            <span className="truncate leading-none">{displayTitle}</span>
          </button>
        );
      })}
    </div>
  );
};
