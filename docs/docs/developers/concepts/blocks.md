---
sidebar_position: 3
---

# Blocks

A `blocks` field holds an ordered list of blocks. Each block has a type, and every block type defines its own fields. It is useful for content that is composed by the editor, like an article built from images and text sections.

Blocks are stored inline in the item that owns them, so they don't need their own collection and are removed together with the item.

```yaml
article:
  displayName: Articles
  fields:
    title:
      type: string
      displayName: Title
    modules:
      type: blocks
      displayName: Modules
      optional: true
      blocks:
        media:
          displayName: Media
          fields:
            file:
              type: string
              displayName: Image or video
              isUploadedFile: true
            caption:
              type: string
              displayName: Caption
              optional: true
        titleWysiwyg:
          displayName: Title + text
          fields:
            title:
              type: string
              displayName: Title
            headingLevel:
              type: select
              displayName: Heading level
              choicesFixed: [h2, h3]
            content:
              type: markdown
              displayName: Content
```

Every key under `blocks` is a block type, with a `displayName` and its `fields`. Block fields support every field type and option except `blocks`, so blocks cannot be nested. A required `blocks` field needs at least one block.

## Stored data

The value is an array of objects. `_block` is the block type key, the other keys are the block fields:

```json
{
  "modules": [
    { "_block": "media", "file": "articles/cover.jpg", "caption": "A caption" },
    {
      "_block": "titleWysiwyg",
      "title": "Introduction",
      "headingLevel": "h2",
      "content": "Some **markdown**"
    }
  ]
}
```

The API handles fields inside blocks like top-level fields:

- Uploaded files are returned as full URLs.
- With `resolve`, references (`choicesFixed: [$type]`) are replaced with the referenced items.
- Renaming or deleting a referenced item updates the references inside blocks.

Blocks whose type is no longer defined in the schema are returned as they are, and must be removed in the admin before the item can be saved again.

`@isardsat/editorial-client` exports the `EditorialBlockValue` type to type block values:

```ts
import type { EditorialBlockValue } from "@isardsat/editorial-client";

type MediaBlock = EditorialBlockValue<"media"> & {
  file: string;
  caption?: string;
};
```

:::note

Localisation messages replace whole field values, so the fields inside blocks can't be translated individually yet.

:::
