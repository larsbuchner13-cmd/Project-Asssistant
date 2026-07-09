"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import type { Sprint, TaskStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteBacklogItem, moveBacklogItemStatus } from "@/app/[locale]/actions/backlog-items";
import { BacklogItemFormDialog } from "@/components/scrum/backlog-item-form-dialog";
import type { BacklogItemWithSprint } from "@/components/scrum/types";

const STATUSES: TaskStatus[] = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"];

type Columns = Record<TaskStatus, BacklogItemWithSprint[]>;

function groupByStatus(items: BacklogItemWithSprint[]): Columns {
  const cols = { BACKLOG: [], IN_PROGRESS: [], REVIEW: [], DONE: [] } as Columns;
  for (const item of [...items].sort((a, b) => a.order - b.order)) {
    cols[item.status].push(item);
  }
  return cols;
}

export function SprintBoard({
  projectId,
  items,
  sprints,
}: {
  projectId: string;
  items: BacklogItemWithSprint[];
  sprints: Sprint[];
}) {
  const t = useTranslations("taskboard");
  const [columns, setColumns] = React.useState<Columns>(() => groupByStatus(items));
  const [activeItem, setActiveItem] = React.useState<BacklogItemWithSprint | null>(null);

  React.useEffect(() => {
    setColumns(groupByStatus(items));
  }, [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function findContainer(id: string): TaskStatus | undefined {
    if ((STATUSES as string[]).includes(id)) return id as TaskStatus;
    return STATUSES.find((s) => columns[s].some((item) => item.id === id));
  }

  function handleDragStart(event: DragStartEvent) {
    const container = findContainer(event.active.id as string);
    if (!container) return;
    setActiveItem(columns[container].find((i) => i.id === event.active.id) ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === active.id);
      const overIndex = overItems.findIndex((i) => i.id === over.id);
      const item = { ...activeItems[activeIndex], status: overContainer };

      const newActiveItems = activeItems.filter((i) => i.id !== active.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      const newOverItems = [...overItems.slice(0, insertAt), item, ...overItems.slice(insertAt)];

      return { ...prev, [activeContainer]: newActiveItems, [overContainer]: newOverItems };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    const container = findContainer(active.id as string) ?? findContainer(over.id as string);
    if (!container) return;

    const containerItems = columns[container];
    const oldIndex = containerItems.findIndex((i) => i.id === active.id);
    const newIndex = over.id === container ? containerItems.length - 1 : containerItems.findIndex((i) => i.id === over.id);

    let reordered = containerItems;
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reordered = [...containerItems];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setColumns((prev) => ({ ...prev, [container]: reordered }));
    }

    await moveBacklogItemStatus(
      projectId,
      active.id as string,
      container,
      reordered.map((i) => i.id)
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            items={columns[status]}
            projectId={projectId}
            sprints={sprints}
            label={t(`column.${status}`)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="rounded-md border border-primary bg-card px-3 py-2 shadow-lg">{activeItem.title}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  items,
  projectId,
  sprints,
  label,
}: {
  status: TaskStatus;
  items: BacklogItemWithSprint[];
  projectId: string;
  sprints: Sprint[];
  label: string;
}) {
  const t = useTranslations("backlog");
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {label} <span className="text-muted-foreground">({items.length})</span>
        </h3>
        <BacklogItemFormDialog
          projectId={projectId}
          sprints={sprints}
          trigger={
            <Button variant="ghost" size="icon" title={t("addItem")}>
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </div>
      <div ref={setNodeRef} className="flex min-h-[80px] flex-col gap-2">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} projectId={projectId} sprints={sprints} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  projectId,
  sprints,
}: {
  item: BacklogItemWithSprint;
  projectId: string;
  sprints: Sprint[];
}) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityVariant =
    item.priority === "CRITICAL" ? "red" : item.priority === "HIGH" ? "amber" : "outline";

  return (
    <Card ref={setNodeRef} style={style} className="p-3">
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label="Drag"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant={priorityVariant as never} className="text-[10px]">
              {t(`priority.${item.priority}`)}
            </Badge>
            {item.storyPoints != null && (
              <Badge variant="outline" className="text-[10px]">
                {item.storyPoints} SP
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-0.5">
          <BacklogItemFormDialog
            projectId={projectId}
            sprints={sprints}
            item={item}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
          <form action={deleteBacklogItem.bind(null, projectId, item.id)}>
            <Button variant="ghost" size="icon" type="submit" className="h-6 w-6">
              <Trash2 className="h-3 w-3" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
