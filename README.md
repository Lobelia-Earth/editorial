# Editorial

Flexible, headless CMS based on simple architecture

## Getting Started

The minimum version of Node.js is **18.x**, the recommended version is **20.x**.

**Getting started**: Read [the getting started guide](./docs/getting-started.md)

**Quickstart**: Use `create-editorial` with `npx @isardsat/create-editorial`, `yarn @isardsat/create create-editorial`, or `pnpm create @isardsat/create-edtitorial` to quickly bootstrap an example Editorial project.

**Examples**: You can use the [examples](./examples/) to get an idea of how editorial works.

## Packages

This monorepo contains the following packages:

- **[@isardsat/editorial-server](./packages/server)**
  
  The server implementation that provides the Editorial CMS API using Hono framework, includes Swagger UI for API documentation, and hosts the admin interface. Handles content management operations.

- **[@isardsat/editorial-admin](./packages/admin)**
  
  A React Router-based web application providing the admin interface for managing content. Built with Radix UI components, Tailwind CSS, and MDX editor for rich content editing.

- **[@isardsat/editorial-client](./packages/client)**
  
  A TypeScript/JavaScript client library for interacting with the Editorial CMS API from your applications.

- **[@isardsat/editorial-cli](./packages/cli)**
  
  CLI tool for running and managing Editorial CMS from the command line. Provides the `editorial` command using Commander.js.

- **[@isardsat/editorial-react-toolkit](./packages/react-toolkit)**
  
  React toolkit providing components, hooks, and utilities for integrating Editorial CMS into React applications. Available as both ES modules and CommonJS.

- **[@isardsat/editorial-common](./packages/common)**
  
  Shared types, schemas and utilities used across Editorial packages.

- **[@isardsat/create-editorial](./packages/create-editorial)**
  
- Scaffolding tool for creating new Editorial CMS projects with the proper setup and configuration.


## Development

Running `pnpm -w compile:watch` for all packages apart from the admin panel. You can then run `pnpm dev` in the `packages/admin` directory and run `pnpm editorial` in one of the [examples](./examples/) for dummy data.

Alternatively, if you need to develop alongside a project implementing Editorial, you can simply "link" your local repo of editorial to the project and run the same `pnpm -w compile:watch` command as above.

## Publishing

Run `pnpm login` to authenticate with npm repository. Afterward running `pnpm changeset`, `pnpm changeset version`, and `pnpm changeset publish` in that order.

## Contributing

We currently don't accept PRs from external collaborators but we plan to! If you have any problems with Editorial we [track issues on Github](https://github.com/Lobelia-Earth/editorial/issues)
