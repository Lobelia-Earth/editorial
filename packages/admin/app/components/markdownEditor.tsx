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
import { useMemo } from "react";
import type { UseFormRegister } from "react-hook-form";
import styles from "./markdownEditor.module.css";

export interface MarkdownEditorProps extends MDXEditorProps {
  className?: string;
  name: string;
  register: UseFormRegister<Record<string, string>>;
}

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
}: MarkdownEditorProps) {
  const { data: filesTree } = useGetFilesQuery();

  const files = useMemo(() => {
    return filesTree ? flattenFiles(filesTree) : [];
  }, [filesTree]);

  return (
    <MDXEditor
      {...register(name)}
      className={cn(
        "flex flex-col w-full rounded-md border border-input bg-transparent text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        styles.mdxeditor,
        className,
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
        toolbarPlugin({
          toolbarClassName:
            "flex flex-row overflow-hidden shrink-0 h-10 border-b bg-white rounded-none",
          toolbarContents: () => (
            <>
              <div className="flex items-center flex-1 gap-1">
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle options={["bullet", "number"]} />
                <Separator />
                <CreateLink />
                <InsertImage />

                <div className="ml-auto">
                  <UndoRedo />
                </div>
              </div>
            </>
          ),
        }),
      ]}
    />
  );
}
