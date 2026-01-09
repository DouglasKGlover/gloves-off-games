---
description: "General guidelines for the Gloves Off Games Nuxt 3 site project"
applyTo: "**"
---

# Gloves Off Games — General Project Instructions

Guidelines for developing and maintaining a Nuxt 3 game collection tracking site with responsive design, proper CSS architecture, and clean component structure.

## Project Context

- **Project type:** Nuxt 3 web application
- **Purpose:** Personal game collection tracker with logs, stats, and gallery
- **Tech stack:** Vue 3, Nuxt 3, SCSS, CSS Grid, GraphQL
- **Design approach:** Mobile-first, component-based architecture

## General Principles

### Simplicity First

- Always attempt to use the simplest path to solve the problem
- Do not add erroneous or currently unnecessary features unless explicitly requested
- If a request lacks specifics (e.g., "add a typography file"), prompt for clarification rather than assuming scope
- Prefer straightforward solutions; technical debt from unused features is worse than minimal scaffolding

### CSS and Styling Standards

- **NEVER use `!important` in CSS.** Any perceived need indicates a problem with encapsulation, cascade, or selector specificity. Fix the root cause instead:
  - Improve scoping with component-level styles
  - Adjust selector specificity appropriately
  - Restructure markup if necessary
- Keep things simple and direct; avoid over-engineering
- No duplicate CSS output to the client
- Prefer semantic HTML and clean markup

## Code Style & Architecture

### CSS/SCSS Standards

- Use `@use` instead of `@import` for Sass modules
- Component-scoped styles go in `<style scoped lang="scss">` within `.vue` files
- Global styles are managed in `assets/css/` with proper separation:
  - `_tokens.scss`: z-index layers, breakpoints, spacing (no CSS output)
  - `normalize.scss`: CSS reset and global element/layout basics (e.g., body background)
  - `typography.scss`: font stacks, base text styles, headings, text utilities
  - `grid.scss`: CSS Grid utilities, container sizing, display utilities
  - `global.scss`: entry point that `@use`s and `@forward`s others
- Tokens module is meant for sharing variables only; components should `@use "./tokens"` directly when needed
- Choose the appropriate file for new CSS features: layout and background in `normalize.scss`, text and headings in `typography.scss`, grid/layout utilities in `grid.scss`, and component-specific styles within the component’s `<style scoped>`.
- All spacing values use rem units (1rem = 10px via `font-size: 62.5%` on html)

### Vue/Nuxt Standards

- Use Vue 3 Composition API with `<script setup>`
- Prefer imports at module level; use `@use` for Sass
- Global styles load once via `nuxt.config.ts` `css` array
- Component styles are scoped to prevent leakage
- Use `NuxtLink` for internal navigation
- Follow mobile-first responsive design with breakpoints: sm, md, lg, xl, xxl

### Grid System

- Use CSS Grid with `.grid` class
- 12-column layout with 1.5rem gap
- Utilities: `.col-span-*`, `.col-start-*`, `.col-end-*`, `.row-span-*`
- Responsive variants: `.grid-cols-{breakpoint}-*`, `.col-span-{breakpoint}-*`
- Display utilities: `.d-none`, `.d-block`, `.d-flex`, `.d-grid`

### File Organization

- Components in `components/` (organized by feature, e.g., `site/`, `game/`)
- Pages in `pages/` with file-based routing
- Layouts in `layouts/`
- GraphQL queries in `graphql/` as `.gql` files
- Utility functions in a `utils/` folder if needed
- Assets (images, fonts, CSS) in `assets/`

## Best Practices

- Keep things simple and direct; avoid over-engineering
- No duplicate CSS output to the client
- Prefer semantic HTML and clean markup
- Use utility classes sparingly for layout; rely on component structure
- Responsive design is mobile-first

## Common Development Tasks

- **Adding a new page:** Create `.vue` in `pages/` directory
- **Adding a component:** Create `.vue` in `components/` with scoped styles
- **Querying data:** Add `.gql` file in `graphql/`, import and use `$graphql.request()` in component
- **Styling a component:** Use `<style scoped lang="scss">` and `@use "~/assets/css/tokens"` if accessing spacing/breakpoints
