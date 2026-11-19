"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { FormField, FormSchema } from "@/modules/form-schema/types";

function SortableFieldCard({
  field,
  index,
  total,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  field: FormField;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-[var(--radius-md)] border bg-surface p-3 shadow-[var(--shadow-sm)]",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border",
        isDragging ? "opacity-80" : undefined,
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="touch-target mt-0.5 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-page"
          aria-label={`Drag to reorder ${field.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onSelect}
          aria-pressed={selected}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-text">
              {field.label}
              {field.required ? (
                <span className="text-danger" aria-hidden="true">
                  {" "}
                  *
                </span>
              ) : null}
            </span>
            <span className="rounded-[var(--radius-sm)] bg-page px-2 py-0.5 text-xs text-text-muted">
              {field.type}
            </span>
            {field.protected ? (
              <span className="rounded-[var(--radius-sm)] bg-primary-muted px-2 py-0.5 text-xs text-primary">
                Core
              </span>
            ) : null}
            {field.visibility ? (
              <span className="rounded-[var(--radius-sm)] bg-page px-2 py-0.5 text-xs text-text-muted">
                Visible when {field.visibility.fieldId} = {field.visibility.equals}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-text-muted">ID: {field.id}</p>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 px-3 text-xs"
          disabled={index === 0}
          onClick={onMoveUp}
        >
          Move up
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 px-3 text-xs"
          disabled={index >= total - 1}
          onClick={onMoveDown}
        >
          Move down
        </Button>
        {!field.protected ? (
          <Button
            type="button"
            variant="danger"
            className="min-h-10 px-3 text-xs"
            onClick={onRemove}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function FormCanvas({
  schema,
  selectedFieldId,
  onSelect,
  onReorder,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  schema: FormSchema;
  selectedFieldId: string | null;
  onSelect: (fieldId: string) => void;
  onReorder: (fields: FormField[]) => void;
  onMoveUp: (fieldId: string) => void;
  onMoveDown: (fieldId: string) => void;
  onRemove: (fieldId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = schema.fields.findIndex((field) => field.id === active.id);
    const newIndex = schema.fields.findIndex((field) => field.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    onReorder(arrayMove(schema.fields, oldIndex, newIndex));
  }

  return (
    <section
      aria-label="Form canvas"
      className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text">Lead information</h2>
          <p className="text-xs text-text-muted">
            {schema.fields.length} fields · Drag to reorder, or use Move up /
            Move down
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={schema.fields.map((field) => field.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3">
            {schema.fields.map((field, index) => (
              <SortableFieldCard
                key={field.id}
                field={field}
                index={index}
                total={schema.fields.length}
                selected={selectedFieldId === field.id}
                onSelect={() => onSelect(field.id)}
                onMoveUp={() => onMoveUp(field.id)}
                onMoveDown={() => onMoveDown(field.id)}
                onRemove={() => onRemove(field.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
