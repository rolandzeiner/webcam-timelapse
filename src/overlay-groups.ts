import type { OverlayEntityConfig, WebcamTimelapseCardConfig } from "./types";

/** Which edge of the frame a readings block is pinned to. */
export type ReadoutSide = "left" | "right";

export interface OverlayGroup {
  side: ReadoutSide;
  /** Trimmed; absent when the config carries no usable heading. */
  title?: string | undefined;
  entities: OverlayEntityConfig[];
}

/** Blank and whitespace-only headings are the same thing: no heading. */
function heading(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * The readings blocks a config asks for, in DOM order.
 *
 * `entities` is the original block and keeps the corner it has always
 * had — bottom-right — whether or not a second block exists beside it.
 * That is the whole point of the key split: adding `entities_left` must
 * never move readings that were already on screen.
 *
 * The side lives in the key name rather than in a count, so a config
 * carrying only `entities_left` renders on the left instead of quietly
 * inheriting the original corner.
 *
 * Left comes first because the narrow layout stacks the two with
 * `column-reverse`, and that is what puts the right-hand block on top.
 */
export function overlayGroups(
  config: WebcamTimelapseCardConfig | undefined,
): OverlayGroup[] {
  const groups: OverlayGroup[] = [];

  const left = config?.entities_left ?? [];
  if (left.length > 0) {
    groups.push({
      side: "left",
      title: heading(config?.overlay_title_left),
      entities: left,
    });
  }

  const right = config?.entities ?? [];
  if (right.length > 0) {
    groups.push({
      side: "right",
      title: heading(config?.overlay_title),
      entities: right,
    });
  }

  return groups;
}
