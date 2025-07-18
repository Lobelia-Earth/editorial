---
sidebar_position: 1
---

# Collections

Collections are the basic type of object found in Editorial. A collection is defined as a group of objects that follow the same schema (for unique structures, see [Singles](/concepts/singles)), you can think of a `Page` schema as an example of a collection schema. A website can have many `Page` objects, all following the same schema.

An example of a `Page` schema is:

```yaml
page:
  displayName: Pages
  fields:
    title:
      type: markdown
      displayName: Page title
    content:
      type: markdown
      displayName: Content
```

This schema means there can be 0, 1, or many `Page` objects created, each with their own title and contents. Generally speaking an Editorial website would use these to create individual pages found on the front-end but the use-case for collections can go far beyond that.

Some other types of collections that could be found:

- Team Member
- Blog Post
- User Review
- Support Link
