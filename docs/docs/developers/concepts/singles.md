---
sidebar_position: 2
---

# Singles

Singles are almost exactly the same as [Collections](/concepts/collections), the key difference is that while there can be many instances of a collection there can only be one instance of a single.

In practical terms this means that if your `Page` schema was a "single" instead of a collection, you would only ever have one `Page` to edit, not multiple. An example use case of this is a `Settings` structure on a website, maybe controlling the theme or search engine properties.

Here is an example of this schema:

```yaml
settings:
  displayName: Settings
  singleton: true
  fields:
    title:
      type: string
      displayName: Site title
    favicon:
      type: image
      displayName: Favicon
    description:
      type: text
      displayName: Search engine description
```

This schema allows an editor to update the default website title, upload a new favicon, or change the search engine description on the fly without involving a developer.

Some other potential types of singles:

- Header links
- Theme settings
- Contact information
