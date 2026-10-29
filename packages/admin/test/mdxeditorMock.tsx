import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";

/**
 * Stand-in for "@mdxeditor/editor", whose Lexical editor doesn't run in jsdom.
 * MDXEditor is a controlled textarea that accepts the same props, including a
 * ref with the editor methods (stable across renders, like the real one).
 * Plugins and toolbar components render nothing.
 */
export const MDXEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
  function MDXEditor({ markdown, onChange, className, placeholder }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        getMarkdown: () => textareaRef.current?.value ?? "",
        setMarkdown: (value) => {
          if (textareaRef.current) textareaRef.current.value = value;
        },
        insertMarkdown: () => {},
        focus: () => textareaRef.current?.focus(),
      }),
      [],
    );

    return (
      <textarea
        ref={textareaRef}
        data-testid="mdxeditor"
        className={className}
        placeholder={typeof placeholder === "string" ? placeholder : undefined}
        value={markdown}
        onChange={(event) => onChange?.(event.target.value, false)}
      />
    );
  },
);

const plugin = () => ({});
const Empty = ({ children }: { children?: ReactNode }) => <>{children}</>;

export const headingsPlugin = plugin;
export const listsPlugin = plugin;
export const linkPlugin = plugin;
export const linkDialogPlugin = plugin;
export const quotePlugin = plugin;
export const imagePlugin = plugin;
export const thematicBreakPlugin = plugin;
export const markdownShortcutPlugin = plugin;
export const codeBlockPlugin = plugin;
export const diffSourcePlugin = plugin;
export const toolbarPlugin = plugin;
export const BlockTypeSelect = Empty;
export const BoldItalicUnderlineToggles = Empty;
export const CreateLink = Empty;
export const DiffSourceToggleWrapper = Empty;
export const InsertImage = Empty;
export const ListsToggle = Empty;
export const Separator = Empty;
export const UndoRedo = Empty;
export const useCodeBlockEditorContext = () => ({ setCode: () => {} });
