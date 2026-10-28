import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  getNewBlockFormValue,
  hasFieldChoices,
  resolveFieldChoices,
  type BlockFormValue,
  type SchemaField,
} from "@/lib/fieldUtils";
import { useGetDataQuery } from "@/lib/store/slices/editorialApi";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { EditorialData } from "@isardsat/editorial-common";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  get,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import SchemaFormField from "./schemaFormField";

type BlocksFormValues = Record<string, BlockFormValue[]>;

export interface BlocksFieldProps {
  /** Form path of the blocks field, also used as the element id */
  name: string;
  schemaField: SchemaField;
  className?: string;
  /** Extra content rendered next to the label, e.g. a modified marker */
  labelExtra?: ReactNode;
}

const getErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const { message, root } = error as {
    message?: string;
    root?: { message?: string };
  };
  return message ?? root?.message;
};

/**
 * Short plain-text summary of a block, shown in its header.
 */
const getBlockSummary = (
  schemaField: SchemaField,
  value: BlockFormValue | undefined,
) => {
  const block = value && schemaField.blocks?.[value._block];
  if (!block) return "";

  const textField = Object.entries(block.fields).find(
    ([key, field]) =>
      (field.type === "string" || field.type === "markdown") &&
      !field.isUploadedFile &&
      typeof value[key] === "string" &&
      value[key],
  );
  if (!textField) return "";

  return (value[textField[0]] as string)
    .replace(/[#*_>`[\]!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

type BlockCardProps = {
  id: string;
  name: string;
  index: number;
  schemaField: SchemaField;
  allData: EditorialData | undefined;
  onRemove: () => void;
};

const BlockCard = ({
  id,
  name,
  index,
  schemaField,
  allData,
  onRemove,
}: BlockCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const blockPath = `${name}.${index}`;

  const form = useFormContext<BlocksFormValues>();
  const value = useWatch({
    control: form.control,
    name: blockPath,
  }) as unknown as BlockFormValue | undefined;
  const { errors } = useFormState({ control: form.control, name: blockPath });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const blockType = value?._block ?? "";
  const block = schemaField.blocks?.[blockType];
  const blockError = get(errors, blockPath);
  // Blocks with errors stay open so the messages are visible
  const isOpen = !isCollapsed || !!blockError;
  const summary = isOpen ? "" : getBlockSummary(schemaField, value);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        "rounded-md border bg-white",
        blockError && "border-destructive",
        isDragging && "relative z-10 shadow-md opacity-80",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5",
          isOpen && "border-b",
        )}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-roledescription="sortable item"
          className="p-1 rounded-sm text-muted-foreground cursor-grab touch-manipulation hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical size={16} />
          <span className="sr-only">
            Reorder {block?.displayName ?? blockType}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          aria-expanded={isOpen}
          className="flex flex-1 min-w-0 items-center gap-2 text-left text-sm"
        >
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 transition-transform",
              !isOpen && "-rotate-90",
            )}
          />
          <span className="font-medium shrink-0">
            {block?.displayName ?? `Unknown block "${blockType}"`}
          </span>
          {summary && (
            <span className="truncate text-muted-foreground">{summary}</span>
          )}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRemove}
          title="Remove block"
        >
          <Trash2 size={14} />
          <span className="sr-only">
            Remove {block?.displayName ?? blockType}
          </span>
        </Button>
      </div>

      <div className={cn("space-y-4 p-3", !isOpen && "hidden")}>
        {block ? (
          Object.entries(block.fields).map(([fieldKey, blockField]) => (
            <SchemaFormField
              key={fieldKey}
              name={`${blockPath}.${fieldKey}`}
              schemaField={blockField}
              resolvedChoices={
                hasFieldChoices(blockField)
                  ? resolveFieldChoices(blockField, allData)
                  : []
              }
            />
          ))
        ) : (
          <p className="text-sm text-destructive">
            {getErrorMessage(get(errors, `${blockPath}._block`)) ??
              `The block type "${blockType}" is not defined in the schema.`}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Renders a "blocks" field: an ordered list of blocks of the types defined in
 * the schema, which can be added, reordered, collapsed and removed.
 * Must be used inside a <Form>.
 */
export default function BlocksField({
  name,
  schemaField,
  className,
  labelExtra,
}: BlocksFieldProps) {
  const form = useFormContext<BlocksFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name,
  });
  const { errors } = useFormState({ control: form.control, name });
  const { data: allData } = useGetDataQuery();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    move(oldIndex, newIndex);
  };

  const blockTypes = Object.entries(schemaField.blocks ?? {});
  const errorMessage = getErrorMessage(get(errors, name));

  return (
    <div id={name} className={cn("flex flex-col gap-2", className)}>
      <Label
        className={cn(
          "flex gap-1 items-baseline",
          errorMessage && "text-destructive",
        )}
      >
        {schemaField.displayName}
        {schemaField.optional && (
          <span className="text-gray-400">(optional)</span>
        )}
        {labelExtra}
      </Label>

      {fields.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((field) => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <BlockCard
                  key={field.id}
                  id={field.id}
                  name={name}
                  index={index}
                  schemaField={schemaField}
                  allData={allData}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-sm text-muted-foreground">
          {schemaField.placeholder ?? "No blocks yet."}
        </p>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="self-start">
            <Plus />
            Add block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {blockTypes.map(([blockType, block]) => (
            <DropdownMenuItem
              key={blockType}
              onSelect={() =>
                append(getNewBlockFormValue(block, blockType), {
                  shouldFocus: false,
                })
              }
            >
              {block.displayName}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {schemaField.displayExtra && (
        <p className="text-muted-foreground text-sm">
          {schemaField.displayExtra}
        </p>
      )}
      {errorMessage && (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}
    </div>
  );
}
