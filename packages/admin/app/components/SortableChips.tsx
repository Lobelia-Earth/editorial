import { cn } from "@/lib/utils";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { type ReactNode, type SyntheticEvent } from "react";

type SortableChipsProps = {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: ReactNode;
};

type SortableChipProps = {
  value: string;
  onRemove: () => void;
};

// Keep interactions on the remove button from starting a drag
const stopDragActivation = {
  onMouseDown: (event: SyntheticEvent) => event.stopPropagation(),
  onTouchStart: (event: SyntheticEvent) => event.stopPropagation(),
  onKeyDown: (event: SyntheticEvent) => event.stopPropagation(),
};

const SortableChip = ({ value, onRemove }: SortableChipProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value });

  return (
    <span
      ref={setNodeRef}
      style={{
        // Translate rather than Transform so chips of different widths aren't scaled
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      aria-roledescription="sortable item"
      aria-label={value}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium bg-gray-100 text-black-800 cursor-grab touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "relative z-10 cursor-grabbing shadow-md opacity-80",
      )}
    >
      <GripVertical size={14} className="text-muted-foreground" />
      {value}
      <button
        type="button"
        onClick={onRemove}
        {...stopDragActivation}
        className="hover:bg-gray-200 rounded-sm p-0.5"
      >
        <X size={14} />
        <span className="sr-only">Remove {value}</span>
      </button>
    </span>
  );
};

const SortableChips = ({
  values,
  onChange,
  placeholder,
}: SortableChipsProps) => {
  const sensors = useSensors(
    // Small distance so clicks on the chip don't start a drag
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Press-and-hold on touch so the page can still be scrolled
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = values.indexOf(String(active.id));
    const to = values.indexOf(String(over.id));
    onChange(arrayMove(values, from, to));
  };

  return (
    <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border rounded-md bg-background">
      {values.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) =>
                `Picked up ${active.id}. Position ${values.indexOf(String(active.id)) + 1} of ${values.length}.`,
              onDragOver: ({ active, over }) =>
                over
                  ? `${active.id} moved to position ${values.indexOf(String(over.id)) + 1} of ${values.length}.`
                  : undefined,
              onDragEnd: ({ active, over }) =>
                over
                  ? `${active.id} dropped at position ${values.indexOf(String(over.id)) + 1} of ${values.length}.`
                  : `${active.id} dropped.`,
              onDragCancel: ({ active }) =>
                `Reordering cancelled. ${active.id} returned to its original position.`,
            },
          }}
        >
          <SortableContext items={values} strategy={rectSortingStrategy}>
            {values.map((selectedValue) => (
              <SortableChip
                key={selectedValue}
                value={selectedValue}
                onRemove={() =>
                  onChange(values.filter((v) => v !== selectedValue))
                }
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <span className="text-muted-foreground text-sm">{placeholder}</span>
      )}
    </div>
  );
};

export default SortableChips;
