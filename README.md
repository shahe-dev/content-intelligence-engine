# Content Intelligence Engine

AI-powered content generation platform that produces market intelligence reports and property listing content from structured real estate data.

## What It Does

Processes property data inputs through a GenKit-orchestrated AI pipeline to generate publication-ready market analysis, area guides, and listing descriptions. Includes an auth-protected team interface for content review and export.

Features:

- AI-assisted content blueprinting (generate content strategies from structured data)
- Market intelligence aggregator (RSS feed analysis for market trends)
- Editorial planning and content calendar management
- Competitor content monitoring
- SEO analysis and optimization scoring
- Performance dashboard
- Firebase Auth with domain-restricted access

## Architecture

```
Data Input (structured property/market data)
  --> GenKit AI Pipeline (orchestration layer)
  --> OpenAI GPT-4o (content generation)
  --> Review Interface (Next.js 14, auth-protected)
  --> Export (formatted reports)
```

## Tech Stack

- Next.js 14 / TypeScript / React
- Firebase (hosting, authentication)
- OpenAI API (GPT-4o)
- GenKit (AI pipeline orchestration)
- Tailwind CSS + shadcn/ui
- Fly.io (deployment)
- GitHub Actions CI/CD

## Setup

### Prerequisites

- Node.js 20+
- Firebase project with Authentication enabled
- OpenAI API key
- Fly.io account (for deployment)

### Installation

```bash
git clone https://github.com/shahe-dev/content-intelligence-engine
cd content-intelligence-engine
cp .env.example .env.local
# Edit .env.local with your credentials
npm install
```

### Running locally

```bash
npm run dev
# Opens on http://localhost:9003
```

### Deployment

```bash
fly deploy
```

## Configuration

All configuration is via environment variables. See `.env.example` for the full list.

To restrict authentication to a specific Google Workspace domain, set:

```
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=your-domain.com
```

## Project Status

Active. Deployed and in production use for content operations.

## License

MIT
