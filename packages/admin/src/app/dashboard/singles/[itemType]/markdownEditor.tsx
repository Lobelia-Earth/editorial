import { cn } from '@/lib/utils';
import type { MDXEditorProps } from '@mdxeditor/editor';
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import styles from './markdownEditor.module.css';

export interface MarkdownEditorProps extends MDXEditorProps {
  className?: string;
}

export default function MarkdownEditor({
  className,
  markdown,
  onChange,
}: MarkdownEditorProps) {
  return (
    <MDXEditor
      className={cn(
        'flex flex-col w-full rounded-md border border-input bg-transparent text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        styles.mdxeditor,
        className
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
          disableImageResize: true,
          disableImageSettingsButton: true,
        }),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarClassName:
            'flex flex-row overflow-hidden shrink-0 h-10 border-b bg-white rounded-none',
          toolbarContents: () => (
            <div className="flex items-center flex-1 gap-1">
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <Separator />
              <InsertImage />

              <div className="ml-auto">
                <UndoRedo />
              </div>
            </div>
          ),
        }),
      ]}
    />
  );
}
