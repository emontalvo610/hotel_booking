# Hotel Booking

A modern hotel booking application built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (with PostCSS)
- **Linting**: ESLint with Next.js config
- **Package Manager**: npm

## Project Structure

```
hotel_booking/
├── src/
│   └── app/
│       ├── globals.css        # Global styles with Tailwind v4
│       ├── layout.tsx          # Root layout component
│       └── page.tsx            # Home page
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
├── postcss.config.mjs          # PostCSS with Tailwind v4
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

**Note**: Tailwind CSS v4 uses CSS-based configuration via `@import "tailwindcss"` in `globals.css` instead of a separate config file.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Learn More

To learn more about Next.js, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).