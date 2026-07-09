export type FlatNode<T> = T & {
  id: string;
  parentId: string | null;
  order: number;
  depth: number;
};

export function flatten<T extends { id: string; parentId: string | null; order: number }>(
  items: T[]
): FlatNode<T>[] {
  const byParent = new Map<string | null, T[]>();
  for (const item of items) {
    const key = item.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(item);
  }
  Array.from(byParent.values()).forEach((list) => list.sort((a, b) => a.order - b.order));

  const result: FlatNode<T>[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      result.push({ ...child, depth });
      walk(child.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const INDENT_WIDTH = 24;
export const MAX_DEPTH = 3; // 0-indexed -> 4 levels (1-4)

export function getProjection<T>(
  items: FlatNode<T>[],
  activeId: string,
  overIndex: number,
  dragDepthOffset: number
) {
  const overItem = items[overIndex];
  const previousItem = items[overIndex - 1];
  const nextItem = items[overIndex + 1];

  const projectedDepth = (previousItem?.depth ?? 0) + dragDepthOffset;

  const maxDepth = previousItem ? Math.min(previousItem.depth + 1, MAX_DEPTH) : 0;
  const minDepth = nextItem ? nextItem.depth : 0;

  const depth = clamp(projectedDepth, minDepth, maxDepth);

  function getParentId(): string | null {
    if (depth === 0 || !previousItem) return null;
    if (depth === previousItem.depth) return previousItem.parentId;
    if (depth > previousItem.depth) return previousItem.id;

    const newParent = items
      .slice(0, overIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;
    return newParent ?? null;
  }

  return { depth, parentId: getParentId(), overItem };
}
