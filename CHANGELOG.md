## 6.0.0 (2024-7-11)

Initial public version

## 5.3.2 (2022-6-14)

* **Server**:
    * Do not escape HTML
    * Do not fail when submitting items with attributes not present in schema
## 5.3.1 (2022-6-9)

## 5.3.0 (2022-6-7)

* **Server**:
    * Upload files: return uploaded file paths

## 5.2.3 (2022-6-2)

## 5.2.2 (2022-6-2)

* **Server**:
    * Create directory: inform when directory exists
## 5.2.1 (2022-6-1)

* **Server**:
    * **Bugfix**: Allow submitting special attrs (`_draft`, `_noTranslation`)
    * **Bugfix**: Do not leave open handles in tests
 
## 5.2.0 (2022-6-1)

* **Client**:
    * File list: List firectories first
    * File list: Sanitise names when creating directories
    * File list: Handle file tree inconsistencies with remote large files
    
## 5.1.0 (2021-12-13)

* **Client**:
    * **Bugfix**: Editor: fix malformed items object after content edition
    * File list: Minor UI improvements

## 5.0.1 (2021-12-13)

## 5.0.0 (2021-12-13)

* **Server**:
    * API endpoint `/editorial/_fileList` now returns a flat list of entries, containing files and directories, from which a directory tree can be built.
    * New API endpoints:
        - `POST /editorial/_directoryCreate`
        - `POST /editorial/_directoryDelete`
    * **Breaking change** (**if you use largeFiles**): The `largeFiles` plugin needs to be updated so the files directory structure is recursively scanned. This plugin has been updated in the `editorial-example` module.
* **Client**:
    * File list: Uploaded files can now be organised in a directory structure.
    * File list: File list can be open as a modal from any page in Editorial.
    * Editor: File picker input is a typeahead instead of a dropdown list.
    * New Lobelia logo is displayed.

## 4.10.2 (2021-8-6)

* Prevent from generating malformed URLs in the Preview tab when the preview URL contains a query string.

## 4.10.1 (2021-2-22)

## 4.10.0 (2021-2-22)

* Bump mady -- adds a button to remove unused messages.
* Translations: avoid extracting messages from `data.json` when the site is configured (`config.yaml`) with `noTranslation: true`.
* **General**:
    * Items can now be marked as _not translated_ in the client. These items will not pollute Mady's message list.

## 4.9.4 (2021-2-9)

## 4.9.3 (2021-2-9)

* Bump storyboard, timm, oao.

## 4.9.2 (2021-2-9)

* **Lib**:
    * Preserve leading whitespace in lines through translation.

## 4.9.1 (2021-2-5)

* **Lib**:
    * **Bugfix** Do not translate null values.

## 4.9.0 (2021-1-10)

* **Lib**:
    * **Bugfix** Tolerate missing translations files (e.g. es.js) on init.
* **Server**:
    * Open browser automatically (except with flag `--no-open`).
    * **Bugfix** Tolerate missing production snapshot (dataProd.json) on init.
    * Add `--snapshot` flag (takes data snapshot for production, but does not publish).

## 4.8.1 (2020-12-27)

* **Server**: **Bugfix** Fix error in CMS API (/editorial/_data/:itemType) that caused in-memory data to be modified (translated).

## 4.8.0 (2020-12-26)

* **Server**: allow CORS requests.

## 4.7.2 (2020-12-20)

* **Client**:
    * **Bugfix**: Editor: fix incorrect validation of new items (required Markdown fields were not enforced).
    * **Bugfix**: Editor: make translations appear when new item is saved.

## 4.7.1 (2020-12-14)

## 4.7.0 (2020-12-14)

* **General**:
    * Items can now be marked as _draft_ in the client. Drafts are not published when the user clicks on Publish (i.e. content remains as in the previous snapshot). Drafts are also clearly tagged in the item list.
    * Editor: the embedded scoped translation editor is automatically updated when an item content changes (and is saved).
    * No longer requires *mady* as peer dependency.
* **Server**:
    * Integrated with Mady v4, which simplifies websocket management and increases performance (see also UX improvements in the client, below).
* **Client**:
    * Editor: embed **scope-specific translation editor**.
    * Translate page: **fully revamped** with Mady v4, with dramatic performance improvement and better UX.
    * Editor: do not navigate back to item list on save.

## 4.6.0 (2020-12-7)

* **Client**:
    * Editor: show available custom blocks as a list, and sort them alphabetically.

## 4.5.0 (2020-12-7)

* **Client**:
    * File list: sort all by name, including large files.
    * Item list: show tooltips in cells when `linesPerRow` is used.
    * Item list: user cleaner rendering for boolean fields (empty vs filled rectangle).
    * Item list: add color codes swatches (field `colorCode` attribute). Use `colorCode: true` when you want to make it easier for users to see which rows belong together.
    * Item list: remove legacy scrollbars.

## 4.4.0 (2020-12-4)

* **Client**:
    * Item list: honor `linesPerRow` in schema (at item type level).

## 4.3.0 (2020-12-4)

* **Library**: `getExtraMessages()` no longer includes section names (e.g. `=== col1 ===`), which are used by lobelia-common's Markdown component to split content in sections.

## 4.2.1 (2020-11-18)

## 4.2.0 (2020-11-18)

* **Do not use (removed)**. Add **editorial-browser**, with components that may be useful for building Editorial-based sites.
  Initially, it contains only one component: `Markdown`, which encapsulates `ReactMarkdown` and adds:
  - Named sections
  - Custom blocks
  - Line endings
  - Pass-through data

## 4.1.0 (2020-9-30)

* **Server**: add `onHeartbeat` hook, running every 6 h.

## 4.0.5 (2020-7-12)

* **Client**:
    * Editor: preview manual line breaks (supported by custom "¶" or "¶\n" notation).

## 4.0.4 (2020-7-10)

## 4.0.3 (2020-7-10)

## 4.0.2 (2020-7-10)

## 4.0.1 (2020-7-10)

* **Server**:
    * Fix `loadAllLocales()` when `appendScopedLocaleCode` is enabled. It is now more robust and generates a smaller payload.

## 4.0.0 (2020-7-10)

* **Server**:
    * Look for modules (plugins) in default locations:
        - ./editorial/largeFiles (override with `--large-files`)
        - ./editorial/cmsHelpers (override with `--cms-helpers`)
    * File list: hide files starting with '.' and 'index.html' (used to avoid directory index to be shown in some deployments).
    * API endpoint names have changed and now begin with an underscore to avoid collisions with itemTypes at the client-side routes (e.g. /editorial/_allData, /editorial/_fileList, /editorial/_file/xxx, /editorial/_data/xxx). **Breaking change** (**only if you used refData, which is highly unlikely**): /editorial/refData is now /editorial/_data, /editorial/localeCode is now /editorial/_localeCode. Both also provide additional functionalities for preview:
        - /editorial/_data [?preview]
        - /editorial/_data/:itemType [?lang=:lang] [?filter=:filter] [?preview]
        - /editorial/_data/:itemType/ids [?filter=:filter] [?preview]
        - /editorial/_data/:itemType/:id [?lang=:lang] [?preview]
        - /editorial/_localeCode/:lang [?preview]
    * **Breaking change** (**only if you used cmsHelpers, which is highly unlikely**): new contract with the cmsHelpers module, allowing to take a snapshot of translations (both preview and production) and apply those to any item in the database.

## 3.6.0 - 3.6.5 (2020-7-8)

* **Server**:
    * Add CMS-like endpoints (for advanced usage) with optional custom CMS helpers module (`--cms-helpers` flag):
        - /editorial/refData/:itemType [?lang=:lang] [?filter=:filter]
        - /editorial/refData/:itemType/ids [?filter=:filter]
        - /editorial/refData/:itemType/:id [?lang=:lang]
        - /editorial/localeCode/:lang

## 3.5.2 (2020-7-3)

## 3.5.1 (2020-7-3)

## 3.5.0 (2020-7-3)

* **Client**:
    * Allow `singleton` item types (can be created once, and then cannot be deleted. ID is always `default`).
    * Editor: save with Cmd/Ctrl-S. Save and go back with Cmd/Ctrl-Shift-S.
    * Item list: fix Files layout.
    * Item list: make quick links stick to the top.
    * Add logo to sidebar.

## 3.4.2 (2020-7-3)

* **Client**:
    * *bugfix*: General: show log-in form when logged out.
    * Files: highlight those that don't seem to be in use.
    * *bugfix*: Previewer: fix full-screen link.
    * Editor: when editing the item ID, replace whitespace by -.

## 3.4.1 (2020-7-2)

## 3.4.0 (2020-7-2)

* **Client**:
    * Item list: improve layout (scroll data tables horizontally).
    * Item list: add TOC.
    * Item list: hide time in date fields (not editable, in any case...).
    * *bugfix*: Item list: fix sort by date field.
    * Editor: in Markdown custom blocks, show help by default.
    * Editor: when editing the item ID, replace _ by -.
    * Editor: add breadcrumbs.
    * Editor: use native date input.
    * Editor: do not preview HTML. **Note: for security reasons, you should avoid displaying unsanitized HTML in your site. Editorial, however, will not prevent you from writing potentially dangerous content to your data.json file.**
* **General**:
    * Add `config.yaml` options: `name`, `noHub`, `noTranslation`, `alwaysShowFileThumbnails`.
    * Fix issue uploading files with extensions longer than 3 characters.
    * Uploading files now always convert file names to lowercase, to avoid issues with Git.

## 3.3.0 (2020-3-30)

* **Server**:
    * If user specifies a `previewUrl` in its `config.yaml`, use it for the Preview pane.
    * Don't serve `out` directory by default.
    * Don't consider a restart as "user activity".

## 3.2.1 (2020-3-20)

## 3.2.0 (2020-3-20)

* **Server**: 
    * Run hooks asynchronously (should not hog the processor in case a hook takes a long time to complete).
    * Add `onEditStart` hook -- called the first time the user shows activity and killed a while after the user stops being active.

## 3.1.5 (2020-3-17)

* **Server**:
    * `loadAllLocales`: make sure the most up-to-date locale modules are loaded.

## 3.1.4 (2020-1-29)

## 3.1.3 (2020-1-17)

* **Server**:
    * Bump Mady and disable auto-translate of new keys.

## 3.1.2 (2019-8-25)

## 3.1.1 (2019-8-17)

## 3.1.0 (2019-8-17)

* **Client**:
    * Add `color` fields.

## 3.0.3 (2019-8-17)

## 3.0.2 (2019-8-17)

## 3.0.1 (2019-8-17)

## 3.0.0 (2019-8-17)

## 3.0.0-rc.4 (2019-8-17)

## 3.0.0-rc.3 (2019-8-16)

## 3.0.0-rc.2 (2019-8-16)

## 3.0.0-rc.1 (2019-8-15)

## 3.0.0-rc.0 (2019-8-15)

* **General**:
    * Bump many deps.
    * Add library with commonly-used functions.
* **Client**:
    * New appearance (and also easier to update, thanks to the use of plain old CSS and the new Giu v0.18).
    * Enforces IDs to be lowercase, numbers or hyphens.
    * Add `select` fields, with drop-down or inline pickers.
    * Add `choicesFixed` and `choicesPreviousValues` in field specs.
    * Add `isMultiple` in field specs.
    * ItemsForType: add ellipsis to long cell contents that otherwise would break table layout (e.g. URLs).
* **Server**:
    * Add `--migrate-locales-chop` to automatically migrate Markdown messages, chopping them and their translations.

## 2.11.0 (2019-1-25)

* **General**: bump Mady (adds quick find + scope filtering).

## 2.10.2 (2019-1-25)

* **General**: bump Mady (fixes a bug when clearing a translation instead of deleting it).

## 2.10.1 (2019-1-25)

* **Server**: bump Mady (should fix auto-translate when deployed).

## 2.10.0 (2019-1-25)

* **Client**:
    * Editor: When dirty, warn the user before navigating away and losing changes.
    * After *Restart server*, refresh in 10 s (rather than 3).
    * Bugfix: fix general layout so that sidebar never shrinks.
    * ItemsForType: show description above the data table.
    * Editor: add support for `isRequired` fields.

## 2.9.0 (2019-1-24)

* **General**:
    * Add *Restart server* developer action
* **Client**:
    * Add link to public website (just add a `publicUrl: https://lobelia.earth` line to your `data/config.yaml`).
* **Server**:
    * Add Storyboard-based logging - this resurfaces many swallowed logs.

## 2.8.0 (2019-1-21)

* **Server**:
    * Disable Mady's file-watching mechanism. User should now manually refresh the message list.
    * Improve Markdown translations (code blocks are no longer translated).

## 2.7.1 (2019-1-18)

## 2.7.0 (2019-1-11)

* **Server**: call `refreshPathMap()` on the embedded `server` module when items are created/deleted, so that it can update the path map and allow immediate previewing.

## 2.6.2 (2019-1-10)

## 2.6.1 (2019-1-10)

## 2.6.0 (2019-1-10)

* **Server**:
    * Add `pull`, `push` hooks.
    * Configure envvar `EDITORIAL_USER` when calling hooks, so that it can be used, for example, to tag commits.
* **Client**:
    * ItemsForType: always show table, even if no items are present.
    * ItemsForType: improve display of dates and URLs.
    * Merge `build` and `deploy` actions, add indication that it may take a long time.
    * Add *Pull from repo*, *Push to repo* actions.
    * Make notification sticky when build & deploy finishes.
    * Previewer: when clicking on the full-screen button, open page in a new tab.
    * Sidebar: navigation links are now always visible.
    * Editor: throbbing Save button to remind user to save.
    * Editor: add link for URLs.
    * Editor: add selector for uploaded files.

## 2.5.3 (2019-1-9)

## 2.5.2 (2019-1-9)

* **Client**:
    * Bugfix: fix issue that prevented creation of new item when no previous items existed for that item type.

## 2.5.1 (2019-1-8)

## 2.5.0 (2019-1-8)

* Add **git pull** function (allows developers to trigger manual synchronisation with the repo).

## 2.4.0 (2018-12-24)

* **Client**:
    * Add **password reset** function.

## 2.3.0 (2018-12-24)

* **Client**:
    * Add **per-site user list**.
    * Close socket on logout.
    * Remove all client-side data on logout.

## 2.2.3 (2018-11-15)

* **Client**:
    * Fix "Back to Hub" link.

## 2.2.2 (2018-11-15)

* **Client**:
    * Don't show spinner if logged out.
    * Add "Back to Hub" link.

## 2.2.1 (2018-11-15)

* **Server**:
    * Don't complain so loudly when hooks are not defined.
* **Client**:
    * Items view: disable file previews by default (saves bandwidth).

## 2.2.0 (2018-11-14)

* Add **compression** middleware.

## 2.1.0 (2018-11-14)

* Add **large file handler** option.
* Add **embedded server** option (useful for self-updating, Next-based pages).

## 2.0.0 (2018-11-14)

* **Concurrent access**. When a user modifies the database or uploads/deletes a file, all users are notified of the change and asked to refresh data/files accordingly.
* Show in the client **who's currently editing the page**.
* **Bump Mady** (with some interesting goodies, such as on-demand automatic translations). This is what makes this upgrade **breaking**, since it requires running Editorial at least once in order to update the locale database.
* Internal: client only modifies an item a time, not the whole database.
* **Add `onDataChange`, `onFileChange` hooks** (e.g. to rebuild datapackages).
* **Add `onLocaleChange` hook** (e.g. to rebuild datapackages).

## 1.8.5 (2018-11-12)

* **Client**:
    * Editor: keep scroll position in Items view when an item is saved and router goes back.

## 1.8.4 (2018-11-12)

* **Client**:
    * Bugfix: ItemsForType: Fix drag'n'drop issue.

## 1.8.3 (2018-10-26)

* **Client**:
    * Bugfix: Editor: Fix incorrect preview of images that have not made it yet into a Nextjs build.

## 1.8.2 (2018-10-11)

## 1.8.1 (2018-10-11)

## 1.8.0 (2018-10-11)

* **Server**:
    * Add support for Mady's `otherLocaleDirs`.

## 1.7.4 (2018-10-3)

* **Client**:
    * Show `displayExtra` information in Editor fields.

## 1.7.3 (2018-10-2)

* **Client**:
    * Bump Giu: allows wheel events in DataTables.
    * Fix sidebar layout (position of Editorial version).

## 1.7.0-1.7.2 (2018-10-2)

* **Client**:
    * Add custom block help.
    * Show Editorial version

## 1.6.1 (2018-9-15)

* **Server**:
    * Bugfix: Fix issue with correct build/deploy scripts that resulted in error notifications to the user.
* **Client**:
    * Bugfix: Add rank to new items when necessary.

## 1.6.0 (2018-9-14)

* **Client**:
    * Bump Giu and use data tables without fixed height.

## 1.5.4 (2018-9-14)

* **Client**:
    * Hover on file thumbnail to darken background (helps seeing white imgs).

## 1.5.0-1.5.3 (2018-9-14)

* **Client**:
    * Use Giu's **data tables**, including drag-and-drop for sorting.
    * Improve **item creation**, avoiding creation of empty elements in the server before saving.
    * **Migrate to Redux**.
    * Modify ID fields on the fly so that they are always simplified dash-case.
    * Make placeholders lighter.

## 1.4.1 (2018-9-7)

## 1.4.0 (2018-9-7)

* **Client**:
    * Support new field type `number` in schema.
    * Editor: add instructions on valid IDs.
    * Files (inside Pages): fix styles.
* **Server**:
    * Show URL on startup.
    * Allow configuration of uploads path.

## 1.3.0 (2018-8-31)

* Support new field type `boolean` in schema.

## 1.2.0 (2018-8-29)

* Support new field type `date` in schema.
* Bump many deps, incl. Giu v0.16.

## 1.1.1 (2018-5-6)

## 1.1.0 (2018-3-20)

## 1.0.1 (2018-3-16)

* First version
