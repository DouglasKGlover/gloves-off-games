# Personal Collection Tracker & Gaming Blog

[![Netlify Status](https://api.netlify.com/api/v1/badges/171aebf2-e82a-44e8-a43b-304532f5e693/deploy-status)](https://app.netlify.com/sites/glovesoffgames/deploys)

https://glovesoff.games

I've built this tracking web app for my video game collection, as existing tools are in my experience too rigid. Building my own allows me to rapidly add new functionalities as I see fit. Also to more closely hold the data within without fear of the tool or service someone else is maintaining suddenly becoming defunct or changing direction in some way I don't like.

## Stack

- Nuxt/Vue ([docs](https://nuxtjs.org))
- Bootstrap ([docs](https://bootstrap-vue.org/docs))
- Contenful GraphQL API ([docs](https://www.contentful.com/developers/docs/references/graphql/))
- Netlify ([docs](https://docs.netlify.com/))

## Local Development Commands

```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# generate static site
$ npm run generate
```

## Environment Variables

Running or generating the site requires env vars; locally you need a .env file in the root folder of the project with the following:

```txt
CTF_HOST=<Contentful Host; either cdn or preview.contentful.com>
CTF_SPACE_ID=<ID of the Contentful Space>
CTF_CDA_ACCESS_TOKEN=<CDA token from Contentful>
CTF_CMA_ACCESS_TOKEN=<CMA token from Contentful>
```

The CMA token isn't currently used, but if I decide in the future to create my own interface for adding content it'll be required.
