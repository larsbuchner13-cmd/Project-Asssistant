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
import type { WorkPackage, TaskStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteTask, moveTask } from "@/app/[locale]/actions/tasks";
import { TaskFormDialog } from "@/components/executing/task-form-dialog";
import type { TaskWithWorkPackage } from "@/components/executing/types";

const STATUSES: TaskStatus[] = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"];

type Columns = Record<TaskStatus, TaskWithWorkPackage[]>;

function groupByStatus(tasks: TaskWithWorkPackage[]): Columns {
  const cols = { BACKLOG: [], IN_PROGRESS: [], REVIEW: [], DONE: [] } as Columns;
  for (const task of [...tasks].sort((a, b) => a.order - b.order)) {
    cols[task.status].push(task);
  }
  return cols;
}

export function KanbanBoard({
  projectId,
  tasks,
  workPackages,
}: {
  projectId: string;
  tasks: TaskWithWorkPackage[];
  workPackages: WorkPackage[];
}) {
  const t = useTranslations("taskboard");
  const [columns, setColumns] = React.useState<Columns>(() => groupByStatus(tasks));
  const [activeTask, setActiveTask] = React.useState<TaskWithWorkPackage | null>(null);

  React.useEffect(() => {
    setColumns(groupByStatus(tasks));
  }, [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function findContainer(id: string): TaskStatus | undefined {
    if ((STATUSES as string[]).includes(id)) return id as TaskStatus;
    return STATUSES.find((s) => columns[s].some((task) => task.id === id));
  }

  function handleDragStart(event: DragStartEvent) {
    const container = findContainer(event.active.id as string);
    if (!container) return;
    setActiveTask(columns[container].find((t) => t.id === event.active.id) ?? null);
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
      const activeIndex = activeItems.findIndex((t) => t.id === active.id);
      const overIndex = overItems.findIndex((t) => t.id === over.id);
      const item = { ...activeItems[activeIndex], status: overContainer };

      const newActiveItems = activeItems.filter((t) => t.id !== active.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      const newOverItems = [...overItems.slice(0, insertAt), item, ...overItems.slice(insertAt)];

      return { ...prev, [activeContainer]: newActiveItems, [overContainer]: newOverItems };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const container = findContainer(active.id as string) ?? findContainer(over.id as string);
    if (!container) return;

    const items = columns[container];
    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = over.id === container ? items.length - 1 : items.findIndex((t) => t.id === over.id);

    let reordered = items;
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reordered = [...items];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setColumns((prev) => ({ ...prev, [container]: reordered }));
    }

    await moveTask(
      projectId,
      active.id as string,
      container,
      reordered.map((t) => t.id)
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
            tasks={columns[status]}
            projectId={projectId}
            workPackages={workPackages}
            label={t(`column.${status}`)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rounded-md border border-primary bg-card px-3 py-2 shadow-lg">{activeTask.title}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  tasks,
  projectId,
  workPackages,
  label,
}: {
  status: TaskStatus;
  tasks: TaskWithWorkPackage[];
  projectId: string;
  workPackages: WorkPackage[];
  label: string;
}) {
  const t = useTranslations("taskboard");
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {label} <span className="text-muted-foreground">({tasks.length})</span>
        </h3>
        <TaskFormDialog
          projectId={projectId}
          workPackages={workPackages}
          defaultStatus={status}
          trigger={
            <Button variant="ghost" size="icon" title={t("addTask")}>
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </div>
      <div ref={setNodeRef} className="flex min-h-[80px] flex-col gap-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectId={projectId} workPackages={workPackages} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  projectId,
  workPackages,
}: {
  task: TaskWithWorkPackage;
  projectId: string;
  workPackages: WorkPackage[];
}) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityVariant =
    task.priority === "CRITICAL" ? "red" : task.priority === "HIGH" ? "amber" : "outline";

  return (
    <Card ref={setNodeRef} style={style} className="gap-0 p-3">
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
          <p className="truncate text-sm font-medium">{task.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant={priorityVariant as never} className="text-[10px]">
              {t(`priority.${task.priority}`)}
            </Badge>
            {task.workPackage && (
              <Badge variant="outline" className="max-w-[140px] truncate text-[10px]">
                {task.workPackage.name}
              </Badge>
            )}
            {task.assignee && <span className="text-xs text-muted-foreground">{task.assignee}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-0.5">
          <TaskFormDialog
            projectId={projectId}
            workPackages={workPackages}
            task={task}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
          <form action={deleteTask.bind(null, projectId, task.id)}>
            <Button variant="ghost" size="icon" type="submit" className="h-6 w-6">
              <Trash2 className="h-3 w-3" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
