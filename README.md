# Editorial

**Editorial** is a [Headless CMS](https://en.wikipedia.org/wiki/Headless_CMS) that helps non-programmers edit website content, upload static files and publish contents to production.

Some example sites built with Editorial:

* [Lobelia](https://www.lobelia.earth)
* [isardSAT](https://www.isardsat.cat)

## Cintributing

Currently we don't accept PR's from external collaborators.

## Developing a website/application with Editorial

### Pre-requisites

It is highly recommended that you become fluent with [React](https://reactjs.org/) before trying to use Editorial.

The first sites built with Editorial also use the [Next.js](https://github.com/vercel/next.js) framework, but Editorial is in principle compatible with other frameworks. We highly recommend using Next.js to start with, so that you can follow the existing examples. Try building a trivial site with [Next.js](https://nextjs.org/) before using Editorial. This small guide assumes the Editorial/Next.js/React combination.

### First steps

* Think about what authors (non-programmers, such as translators, project managers, communication managers, etc.) will want to contribute to the site, e.g. events, publications, posts, pages... It will heavily depend on the type of site.

* With that information, you can start writing the **site's schema**. Specify in  `data/schema.yaml` the types of content items you will have and the fields/attributes for each one of them. *Editorial* will help authors edit the data in `data/data.json` following the schema you define.

* Finally, we address **component design**. Editorial CMS allows a bidirectional relationship between React components and user contents:

    - React components can embed a `Markdown` component whenever they want to render user contents with formatting.
    - Markdown contents can embed React components (indirectly) using code blocks. All component props can be written by the user in YAML.

* You can also try adding contents using Editorial, the way your authors will do it. Run `yarn editorial` inside your project folder and navigate in your browser to e.g. `localhost:3000/editorial`.


## Web site directory structure

Editorial-based **web sites** have the following structure:

* `/package.json`, including the `@isardsat/editorial` dependency.

* `/data`, containing:

  * `schema.yaml`, defining types of variable data. In the following example, two types are defined (`page` and `company`), one of which will generate dynamic pages (`page`):

    ```yaml
    page:
      displayName: Pages
      fields:
        title:
          type: markdown
          displayName: Page title
          placeholder: 'Meet our **team**'
          showInSummary: true  # show field in the list
        layout:
          type: markdown
          displayName: Layout
          placeholder: 'Use blocks like Home, Contents, Contact...'
          height: 300
        contents:
          type: markdown
          displayName: Contents
          height: 300
        sidebarContents:
          type: markdown
          displayName: Sidebar contents (e.g. with highlighted images and videos)
          height: 300

    company:
      displayName: Companies
      allowManualSorting: true  # allows drag'n'drop in the list
      fields:
        isFeatured:
          type: boolean
          displayName: Featured (in Home page)
          showInSummary: true
          labelLevel: 2
        isHidden:
          type: boolean
          displayName: Hidden
          showInSummary: true
        name:
          type: string
          displayName: Full name
          placeholder: Finnish Meteorological Institute
          showInSummary: true
        acronym:
          type: string
          displayName: Acronym
          placeholder: FMI
          dontTranslate: true  # don't include in locale list
          showInSummary: true
        isClient:
          type: boolean
          displayName: Client
          showInSummary: true
        isDataProvider:
          type: boolean
          displayName: Data provider
          showInSummary: true
          labelLevel: 2
        isPlatformProvider:
          type: boolean
          displayName: Platform provider
          showInSummary: true
        logoImage:
          type: string
          displayName: Logo image filename
          placeholder: 'fmi.png'
          dontTranslate: true
          showInSummary: true
        logoResizeFactor:
          type: number
          displayName: Logo resize factor (blank for 1)
          placeholder: '1.2'
          showInSummary: true
    ```

    **Note: images (and other static files) are not included as metadata. Any number of images can be uploaded via Editorial, with a mandatory name, and can be referenced from Markdown. This allows a page to have an arbitrary number of images.**

  * `data.json`, a single file containing all data managed by Editorial. Storing data in raw format allows Editorial to create, read, update and delete contents easily. It also makes it easier to manage under version control tools (e.g. git). Example contents (`id`s are chosen by the author):

    ```json
    {
      "page": {
        "home": {
          "id": "home",
          "title": "Home",
          "layout": "```Home\ntagline: \"**Observing the Earth** to anticipate the effects of a changing climate.\"\nprovidersTitle: Working with the leading data providers\nmarketsTitle: We work with organisations across the globe affected by our changing climate\n```\n\n```Contact\n```",
          "content": ""
        },
        "about": {
          "id": "about",
          "title": "Expert services to face climate change using Earth Observation data",
          "layout": "```Contents\nsidebar: true\n```\n\n```TeamMembers\ntitle: Our team\n```\n\n```Contact\nquestion: Would you like to work with us?\nbutton: get in touch\n```",
          "content": "",
          "contents": "Identify the indicators of environmental impact that are appropriate for your case and carry out the necessary studies, both at the level of monitoring and forecasting and planning, based on the use of satellite Earth Observation information, largely based on highly specific raw data, public and free acquired by European satellites under the Copernicus program.\n\nLobelia is a spin-off of isardSAT, a lead company providing services and solutions in the Earth Observation field.",
          "sidebarContents": "![](c.jpg)"
        }
      },
      "company": {
        "oxfam": {
          "id": "acme",
          "name": "Acme",
          "acronym": "Acme",
          "isClient": true,
          "isFeatured": true,
          "logoImage": "logo-acme-white.png",
          "rank": 20
        },
      }
    }
    ```

    **Note: Translation tool Mady will not detect contents in data.json automatically; a special script injects this contents into Mady (see `getExtraMessages.js` below)**.

* `/locales`, managed by Mady. Special attention:

  * `config.json` includes important information for page generation such as `langs` and `originalLang`.

  * `getExtraMessages.js` (optional) exports a single function, which returns the messages that are not detected by Mady but which should be included in its message database. You usually don't need to modify this file. Each message may be flagged as `isMarkdown` (so that it's not processed as MessageFormat) and given a `scope` (so that it's not included in the generic locale module for a given language and is only used for the generation of translated datapackages).

* `/pages`. Includes:

  * Manual pages (e.g. `index.js`, `about.js`)

  * Base components for dynamic pages (e.g. `page.js`, `project.js`) -- one for each variable data type defined in `schema.yaml` which will generate pages. In our example, `page` and `project`. Note these are _not templates_ (they require no processing whatsoever).

  * `_document.js`, `_app.js`, `_error.js`, if any (see Next.js docs).

* `/static`, static files used by the page, both included manually (e.g. favicon images and the `/img` directory) as well as uploaded through Editorial, e.g. a company logo image, stored in `/static/files`.  

* `/next.config.js`, Next.js config file, includes a dynamically generated `exportPathMap` based on the available languages and the pages under `/pages`.

* `/components`, supplementary components needed to build a page: header, footer, etc.  

  Pages are constructed using the react components in the `/components` directory but, in particular, the `Markdown` component allows the specification by the user of special components embedded within the markdown text by means of:

  * the **code block** markdown feature

  * the `renderers` option of the [react-markdown](https://github.com/rexxars/react-markdown) component

  For instance, a `Home` component can be specified by the user within the markdown text as:

  ````
  ```Home
  tagline: "**Observing the Earth** to anticipate the effects of a changing climate."
  providersTitle: Working with the leading data providers
  marketsTitle: We work with organisations across the globe affected by our changing climate
  ```
  ````


## Schema documentation

Each item type can have:

* `displayName`
* `description` (in Markdown)
* `allowManualSorting`
* `fields` (object)

Each field can have:

* General:
    - `type`: `markdown` | `string` | `boolean` | `date` | `number` | `select` | `color`
    - `displayName`
    - `displayExtra` (instructions, etc.)
    - `dontTranslate` (not necessary for fields of type `boolean` | `date` | `number` | `color`)
    - `placeholder`
    - `height` (for `markdown` fields, mainly)
    - `allowCustomBlocks`: `true | Array<string>` (array of allowed blocks)
    - `inlineSelect` (for `select`)
    - `choicesFixed`: `Array<string>`
    - `choicesPreviousValues` (`boolean`)
    - `isMultiple` (comma-separated list)
    - `isRequired`
    - `isExternalUrl` (adds a button to go to that URL)
    - `isUploadedFile` (adds a menu to choose one of the uploaded files)
* How field appears in summary:
    - `showInSummary`
    - `labelLevel`
