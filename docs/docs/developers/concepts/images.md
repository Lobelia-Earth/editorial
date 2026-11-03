---
sidebar_position: 4
---

# Images

Uploaded file fields (`type: string` with `isUploadedFile: true`) can declare the image they expect:

```yaml
article:
  displayName: Articles
  fields:
    cover:
      type: string
      displayName: Cover
      isUploadedFile: true
      aspectRatio: "16:9"
      maxWidth: 1600
```

- `aspectRatio`: ratio in the format `"width:height"`. Quote it, as some YAML parsers read `16:9` as a number. The image editor locks the crop to it.
- `maxWidth`: maximum width in pixels. The image editor never saves the image wider than this.

The admin warns editors when the selected image doesn't match these constraints and offers to edit it. The constraints are not enforced when saving content.

## Image editor

Editors can crop, rotate and resize PNG, JPEG and WebP images, and save them as WebP, JPEG or PNG. SVG and GIF files can't be edited.

Images are edited in the browser and saved as a new file next to the original, so content referencing the original is not affected. When editing from a field, the field is updated to the new file.

Images stored by the large file handler are loaded from `largeFilesUrl`, so its server must send CORS headers that allow the admin's origin. Otherwise the editor can't load them.

Edited images of 1 MB or more are stored by the large file handler like any other upload.
