# @isardsat/editorial-vue-toolkit

Vue 3 counterpart of `@isardsat/editorial-react-toolkit`. It shares the same `localStorage` keys and sync event, so both toolkits can be used on the same page (e.g. Astro islands) and stay in sync.

## Usage

```ts
import {
  EditorialContent,
  EditorialVueConfigProvider,
  PreviewMenu,
} from "@isardsat/editorial-vue-toolkit";
import "@isardsat/editorial-vue-toolkit/dist/index.css";
```

Wrap the app (or each Astro island) with the provider, or call `provideEditorialVueConfig(ref(config))` in a root component's `setup`:

```vue
<EditorialVueConfigProvider :config="{ isPreview, editorialUrl }">
  <PreviewMenu />

  <EditorialContent
    entity-name="homepage"
    :instance-id="homepage.id"
    property-name="tagline"
  >
    <h1>{{ homepage.tagline }}</h1>
  </EditorialContent>
</EditorialVueConfigProvider>
```

`EditorialContent` expects a single element or component as its child. When preview mode and "Show Editorial shortcuts" are enabled, it draws an overlay over the child linking to the item in the Editorial admin.
