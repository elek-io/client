import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@renderer/util';
import { GripVerticalIcon } from 'lucide-react';
import * as React from 'react';
import type { FieldValues, UseFieldArrayReturn } from 'react-hook-form';
import { Button } from './button';

function DragHandle({ id }: { id: string }): React.ReactElement {
  const { attributes, listeners } = useSortable({
    id,
  });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-zinc-500 dark:text-zinc-400 size-9 hover:bg-transparent hover:cursor-grab"
    >
      <GripVerticalIcon className="size-4" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function DraggableComponent({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id,
  });

  return (
    <Slot
      data-dragging={isDragging}
      ref={setNodeRef}
      className={cn(
        'relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80',
        className
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {children}
    </Slot>
  );
}

function SortableFieldArray<T extends FieldValues>({
  children,
  fieldArray,
}: {
  children: React.ReactNode;
  fieldArray: UseFieldArrayReturn<T>;
}): React.ReactElement {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  function handleDragStart(event: DragStartEvent): void {
    const { active } = event;

    setActiveId(active.id);
  }

  function handleDragEnd(event: DragEndEvent): void {
    console.log(event);
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = fieldArray.fields.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = fieldArray.fields.findIndex(
        (item) => item.id === over.id
      );
      fieldArray.move(oldIndex, newIndex);
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={fieldArray.fields}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
      <DragOverlay>
        {activeId ? <div id={activeId.toString()} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export { DraggableComponent, DragHandle, SortableFieldArray };
