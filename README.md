# Gloves Off Games

https://glovesoff.games

A personal video game collection tracking web app and blog. Built from scratch because existing tools are too rigid—this allows rapid feature additions and full control over the data without relying on third-party services that may become defunct or change direction.

## Tech Stack

- **Framework:** [Nuxt 4](https://nuxt.com/) / [Vue 3](https://vuejs.org/)
- **Styling:** SCSS with custom CSS Grid system (mobile-first, responsive)
- **Data:** [Contentful GraphQL API](https://www.contentful.com/developers/docs/references/graphql/)
- **Charts:** [Highcharts](https://www.highcharts.com/)
- **Deployment:** [SST](https://sst.dev/) on AWS (static site generation)

## Project Structure

```
├── assets/css/       # Global SCSS (grid, typography, buttons, forms)
├── components/       # Vue components organized by feature
│   ├── blog/         # Blog-related components
│   ├── game/         # Game card, list, filters
│   ├── site/         # Header, footer, hero, background
│   └── system/       # Gaming system components
├── graphql/          # GraphQL query files (.gql)
├── layouts/          # Nuxt layouts
├── pages/            # File-based routing
│   ├── blog/         # Blog pages
│   ├── games/        # Game collection pages
│   └── systems/      # Gaming system pages
├── plugins/          # Nuxt plugins (date formatting, rich text)
└── functions/        # Utility functions
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (localhost:3000)
npm run dev

# Generate static site
npm run generate

# Preview generated site
npm run preview
```

## Deployment

The site is deployed to AWS using SST:

```bash
# Deploy to production
npm run sst:deploy

# Remove deployment
npm run sst:remove
```

## Environment Variables

Create a `.env` file in the project root with the following:

```txt
CTF_HOST=cdn.contentful.com
CTF_SPACE_ID=<Contentful Space ID>
CTF_CDA_ACCESS_TOKEN=<Contentful Delivery API token>
```

Use `preview.contentful.com` as `CTF_HOST` to view draft content.
