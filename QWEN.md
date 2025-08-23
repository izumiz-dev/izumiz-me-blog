# izumiz-me-blog Project Context

This is a specialized blog project built using Astro and Notion as a CMS. It's a fork/customization of the `astro-notion-blog` template.

## Project Overview

*   **Type**: Astro-based Static Site Generator for a Blog
*   **Core Technology**: Astro, Notion API
*   **Purpose**: To generate a static blog site where content is managed and stored in a Notion database. This allows for easy content creation and editing via the Notion interface.
*   **Key Features**:
    *   Fetches blog post data from a Notion database using the Notion API.
    *   Generates static HTML, CSS, and JS for fast page loads.
    *   Supports custom domains and sub-paths.
    *   Includes integrations for downloading cover images, featured images, and handling public Notion assets.
    *   Generates an RSS feed.
    *   Caching mechanism for Notion block content (`tmp/` directory).

## Development Workflow

*   **Main Framework**: [Astro](https://astro.build/)
*   **Content Source**: [Notion](https://www.notion.so/) database.
*   **Package Manager**: `pnpm` (inferred from `pnpm-lock.yaml` and `package.json` scripts).
*   **Key Directories**:
    *   `src/`: Contains the main source code, including pages, components, layouts, and library code for interacting with Notion.
    *   `public/`: Static assets served directly.
    *   `scripts/`: Custom Node.js scripts for caching Notion content.
    *   `tmp/`: Local cache for Notion block data (`.json` files). This directory is likely ignored by Git.
*   **Environment Variables**: Critical for operation. `NOTION_API_SECRET` and `DATABASE_ID` must be set. `GALLERY_ID`, `CUSTOM_DOMAIN`, `BASE_PATH`, and `PUBLIC_GA_TRACKING_ID` are also used.

## Building and Running

These commands are defined in `package.json`:

*   **Install Dependencies**: `pnpm install` (or `npm install`)
*   **Development Server**: `pnpm run dev` (Starts a local development server, likely at `http://localhost:4321`).
*   **Build Static Site**: `pnpm run build` (Generates the static site in the `dist/` directory).
*   **Build with Cache**: `pnpm run build:cached` (Runs the cache fetch script before building).
*   **Preview Build**: `pnpm run preview` (Serves the built site locally for testing).
*   **Lint Code**: `pnpm run lint` (Runs ESLint on source files).
*   **Format Code**: `pnpm run format` (Runs Prettier to format code).
*   **Fetch Notion Cache**: `pnpm run cache:fetch` (Runs a script to fetch and cache Notion block data).
*   **Purge Cache**: `pnpm run cache:purge` (Clears Nx cache and `tmp/` directory).

## Deployment

The project is designed for deployment on platforms like Cloudflare Pages, as indicated in the original README. Environment variables (`NOTION_API_SECRET`, `DATABASE_ID`, `NODE_VERSION`) need to be configured on the deployment platform.

## Development Conventions

*   **Code Style**: Enforced by ESLint (`@typescript-eslint`) and Prettier.
*   **Git Hooks**: `lefthook` is configured (via `lefthook.yml`) for running checks on commit/push.
*   **TypeScript**: Used throughout the project.
*   **Nx**: Used for caching and potentially managing tasks (`nx.json`).
*   **Notion Integration**: The application interacts with Notion via `@notionhq/client`. Content fetching is handled in `src/lib/notion/client.ts`. It includes retry logic and caching (`tmp/*.json`).
*   **Custom Integrations**: Astro integrations in `src/integrations/` handle tasks like downloading images and copying public Notion assets during the build process.