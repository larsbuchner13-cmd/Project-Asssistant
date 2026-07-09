"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { GripVertical, Plus, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { flatten, getProjection, INDENT_WIDTH, type FlatNode } from "@/lib/tree";
import { moveWorkPackage, deleteWorkPackage } from "@/app/[locale]/actions/work-packages";
import { WorkPackageFormDialog } from "@/components/planning/work-package-form-dialog";
import type { WorkPackageWithDeps } from "@/components/planning/types";

export function WbsTree({
  projectId,
  workPackages,
}: {
  projectId: string;
  workPackages: WorkPackageWithDeps[];
}) {
  const t = useTranslations("wbs");
  const [items, setItems] = React.useState(() => flatten(workPackages));
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = React.useState(0);

  React.useEffect(() => {
    setItems(flatten(workPackages));
  }, [workPackages]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  const projected = React.useMemo(() => {
    if (!activeId) return null;
    const overIndex = items.findIndex((i) => i.id === activeId);
    if (overIndex === -1) return null;
    const dragDepthOffset = Math.round(offsetLeft / INDENT_WIDTH);
    return getProjection(items, activeId, overIndex, dragDepthOffset);
  }, [activeId, items, offsetLeft]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setOffsetLeft(0);
  }

  function handleDragMove(event: DragMoveEvent) {
    setOffsetLeft(event.delta.x);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOffsetLeft(0);
    if (!over || active.id === over.id) return;

    const activeIndex = items.findIndex((i) => i.id === active.id);
    const overIndex = items.findIndex((i) => i.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;

    const dragDepthOffset = Math.round(offsetLeft / INDENT_WIDTH);
    const proj = getProjection(items, active.id as string, overIndex, dragDepthOffset);

    const reordered = arrayMove(items, activeIndex, overIndex).map((item) =>
      item.id === active.id ? { ...item, parentId: proj.parentId, depth: proj.depth } : item
    );
    setItems(reordered);

    const siblingIds = reordered.filter((i) => i.parentId === proj.parentId).map((i) => i.id);

    await moveWorkPackage(projectId, active.id as string, proj.parentId, siblingIds);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <WorkPackageFormDialog
            projectId={projectId}
            parentId={null}
            allWorkPackages={workPackages}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                {t("addWorkPackage")}
              </Button>
            }
          />
        </div>
        <div className="rounded-lg border border-border">
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <WbsRow
                key={item.id}
                item={item}
                projectId={projectId}
                allWorkPackages={workPackages}
                previewDepth={activeId === item.id ? projected?.depth : undefined}
              />
            ))}
          </SortableContext>
        </div>
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="rounded-md border border-primary bg-card px-3 py-2 shadow-lg">
            {activeItem.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function WbsRow({
  item,
  projectId,
  allWorkPackages,
  previewDepth,
}: {
  item: FlatNode<WorkPackageWithDeps>;
  projectId: string;
  allWorkPackages: WorkPackageWithDeps[];
  previewDepth?: number;
}) {
  const t = useTranslations("wbs");
  const tc = useTranslations("common");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const depth = previewDepth ?? item.depth;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border-b border-border/60 bg-card px-2 py-2 last:border-b-0"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Drag"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div style={{ paddingLeft: depth * INDENT_WIDTH }} className="min-w-0 flex-1 py-0.5">
        <div className="truncate font-medium">{item.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            {t("level")} {item.level}
          </Badge>
          {item.owner && <span>{item.owner}</span>}
          {item.effortEstimate != null && <span>{item.effortEstimate} PT</span>}
          <StatusBadge status={item.status} />
          {item.successorOf.length > 0 && (
            <span className="max-w-[280px] truncate">
              {t("dependencies")}: {item.successorOf.map((d) => d.predecessor.name).join(", ")}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {item.level < 4 && (
          <WorkPackageFormDialog
            projectId={projectId}
            parentId={item.id}
            allWorkPackages={allWorkPackages}
            trigger={
              <Button variant="ghost" size="icon" title={t("addChild")}>
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        )}
        <WorkPackageFormDialog
          projectId={projectId}
          parentId={item.parentId}
          allWorkPackages={allWorkPackages}
          workPackage={item}
          trigger={
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <form action={deleteWorkPackage.bind(null, projectId, item.id)}>
          <Button variant="ghost" size="icon" type="submit" title={tc("delete")}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: WorkPackageWithDeps["status"] }) {
  const variant =
    status === "DONE" ? "green" : status === "BLOCKED" ? "red" : status === "IN_PROGRESS" ? "amber" : "outline";
  return (
    <Badge variant={variant as never} className="shrink-0 text-[10px]">
      {status.replace("_", " ")}
    </Badge>
  );
}
