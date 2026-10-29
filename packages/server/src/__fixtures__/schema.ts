import {
  EditorialSchemaSchema,
  type EditorialData,
  type EditorialDataItem,
} from "@isardsat/editorial-common";

/**
 * Small schema with references and uploaded files, both at the top level and
 * inside the blocks of a "blocks" field.
 */
export const schema = EditorialSchemaSchema.parse({
  author: {
    displayName: "Author",
    fields: {
      name: { type: "string", displayName: "Name" },
      avatar: { type: "string", displayName: "Avatar", isUploadedFile: true },
      mentor: {
        type: "select",
        displayName: "Mentor",
        choicesFixed: ["$author"],
        optional: true,
      },
    },
  },
  settings: {
    displayName: "Settings",
    singleton: true,
    fields: {
      siteName: { type: "string", displayName: "Site name" },
    },
  },
  tag: {
    displayName: "Tag",
    fields: {
      name: { type: "string", displayName: "Name" },
    },
  },
  article: {
    displayName: "Article",
    fields: {
      title: { type: "string", displayName: "Title" },
      cover: { type: "string", displayName: "Cover", isUploadedFile: true },
      author: {
        type: "select",
        displayName: "Author",
        choicesFixed: ["$author"],
      },
      tags: {
        type: "multiselect",
        displayName: "Tags",
        choicesFixed: ["$tag"],
      },
      content: {
        type: "blocks",
        displayName: "Content",
        blocks: {
          text: {
            displayName: "Text",
            fields: {
              body: { type: "markdown", displayName: "Body" },
            },
          },
          image: {
            displayName: "Image",
            fields: {
              file: {
                type: "string",
                displayName: "File",
                isUploadedFile: true,
              },
              caption: { type: "string", displayName: "Caption" },
            },
          },
          quote: {
            displayName: "Quote",
            fields: {
              author: {
                type: "select",
                displayName: "Author",
                choicesFixed: ["$author"],
              },
              tags: {
                type: "multiselect",
                displayName: "Tags",
                choicesFixed: ["$tag"],
              },
            },
          },
        },
      },
    },
  },
});

export const item = (
  id: string,
  values: Record<string, unknown>,
): EditorialDataItem => ({
  id,
  isDraft: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...values,
});

export function createContent(): EditorialData {
  return {
    author: {
      ada: item("ada", { name: "Ada", avatar: "authors/ada.png" }),
      bob: item("bob", {
        name: "Bob",
        avatar: "https://cdn.example.com/bob.png",
        mentor: "ada",
      }),
    },
    tag: {
      news: item("news", { name: "News" }),
      tech: item("tech", { name: "Tech" }),
    },
    article: {
      hello: item("hello", {
        title: "Hello",
        cover: "covers/hello.png",
        author: "bob",
        tags: ["news", "missing", "tech"],
        content: [
          { _block: "text", body: "Intro" },
          { _block: "image", file: "images/a.png", caption: "A" },
          {
            _block: "image",
            file: "https://cdn.example.com/b.png",
            caption: "B",
          },
          { _block: "quote", author: "ada", tags: ["tech", "missing"] },
          { _block: "video", file: "videos/v.mp4", author: "ada" },
        ],
      }),
    },
  };
}
