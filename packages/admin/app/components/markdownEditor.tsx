import { useAppSelector } from "@/lib/store/hooks";
import { useGetFilesQuery } from "@/lib/store/slices/editorialApi";
import { cn } from "@/lib/utils";
import type { EditorialFiles } from "@isardsat/editorial-common";
import type {
  CodeBlockEditorDescriptor,
  MDXEditorProps,
} from "@mdxeditor/editor";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  useCodeBlockEditorContext,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Expand, Shrink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { UseFormRegister } from "react-hook-form";
import styles from "./markdownEditor.module.css";

export interface MarkdownEditorProps extends MDXEditorProps {
  className?: string;
  name: string;
  register: UseFormRegister<Record<string, string>>;
  fieldDisplayName?: string;
  fullscreenable?: boolean;
}

/**
 * Custom components can be implement as directives with a custom editor.
 * Needs a method of getting custom component fields/validators from the schema.
 */
const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: (language, meta) => true,
  priority: 0,
  Editor: (props) => {
    const cb = useCodeBlockEditorContext();

    return (
      <div
        className="flex flex-col bg-gray-100 my-4"
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        <input defaultValue={props.language} />
        <textarea
          className="flex-1"
          defaultValue={props.code}
          onChange={(e) => cb.setCode(e.target.value)}
        />
      </div>
    );
  },
};

function flattenFiles(files: EditorialFiles): EditorialFiles {
  const flattened: EditorialFiles = [];

  function traverse(items: EditorialFiles) {
    for (const item of items) {
      flattened.push(item);
      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(files);
  return flattened;
}

export default function MarkdownEditor({
  className,
  markdown,
  name,
  register,
  onChange,
  fieldDisplayName,
  fullscreenable = true,
}: MarkdownEditorProps) {
  const { data: filesTree } = useGetFilesQuery();
  const initialMarkdown = useRef(markdown);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const role = useAppSelector((state) => state.auth.role);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const files = useMemo(
    () => (filesTree ? flattenFiles(filesTree) : []),
    [filesTree],
  );

  const ToolbarContents = () => (
    <>
      <div className="flex items-center flex-1 gap-1">
        {isFullscreen && (
          <>
            <span className="text-sm font-medium text-gray-600">
              {fieldDisplayName}
            </span>
            <Separator />
          </>
        )}

        <BlockTypeSelect />
        <BoldItalicUnderlineToggles />
        <Separator />
        <ListsToggle options={["bullet", "number"]} />
        <Separator />
        <CreateLink />
        <InsertImage />

        <div className="flex items-center ml-auto gap-1">
          {role === "developer" ? (
            <DiffSourceToggleWrapper>
              <UndoRedo />
            </DiffSourceToggleWrapper>
          ) : (
            <UndoRedo />
          )}
          {fullscreenable && (
            <>
              <Separator />
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                }
              >
                {isFullscreen ? <Shrink size={16} /> : <Expand size={16} />}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );

  const renderEditor = () => (
    <MDXEditor
      {...register(name)}
      className={cn(
        "flex flex-col w-full rounded-md border border-input bg-transparent text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        styles.mdxeditor,
        isFullscreen ? styles.fullscreen : className,
      )}
      suppressHtmlProcessing={true}
      markdown={markdown}
      onChange={onChange}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        quotePlugin(),
        imagePlugin({
          imageAutocompleteSuggestions: files
            ?.filter((file) => file.type !== "directory")
            .map((file) => file.relativePath),
          imagePreviewHandler: (image) => {
            return new Promise((resolve) => {
              return resolve(`/${image}`);
            });
          },
          disableImageResize: true,
        }),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        codeBlockPlugin({
          codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor],
        }),
        diffSourcePlugin({
          viewMode: "rich-text",
          diffMarkdown: initialMarkdown.current,
        }),
        toolbarPlugin({
          toolbarClassName: cn(
            "flex flex-row overflow-hidden shrink-0 h-10 border-b bg-white rounded-none",
            isFullscreen && "border-gray-200",
          ),
          toolbarContents: ToolbarContents,
        }),
      ]}
    />
  );

  if (isFullscreen) {
    return createPortal(
      <div className={cn("fixed inset-0 z-50", styles.fullscreenBackdrop)}>
        <div
          className={cn(
            "m-8 h-[calc(100vh-4rem)] flex flex-col bg-white rounded-lg shadow-2xl",
            styles.fullscreenContainer,
          )}
        >
          {renderEditor()}
        </div>
      </div>,
      document.body,
    );
  }

  return renderEditor();
}
