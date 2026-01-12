# Stock Watchlist Application

A simple, modern web application for tracking and researching stock tickers. Add tickers to your watchlist and automatically fetch comprehensive financial data.

## Features

- **Ticker Management**: Add and remove tickers from your watchlist
- **Automatic Data Fetching**: Automatically pulls 17 data points per ticker including:
  - Float and short interest data
  - Institutional ownership
  - Cash metrics and runway calculations
  - Automated flag detection
- **Persistent Storage**: Watchlist persists in browser localStorage
- **Sortable Table**: Sort by any column to analyze your watchlist
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (React + TypeScript)
- **Data Source**: yahoo-finance2 (JavaScript library)
- **Styling**: Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

That's it! No Python, no special configuration needed.

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository

3. Vercel will automatically detect Next.js and deploy!

No special configuration needed - it's just a standard Next.js app.

## Project Structure

```
watchlist/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── ticker/
│   │       └── [symbol]/
│   │           └── route.ts      # Ticker data API endpoint
│   ├── components/                # React components
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page
│   └── globals.css               # Global styles
├── lib/                          # TypeScript utilities
│   ├── tickerData.ts             # Type definitions
│   └── storage.ts                # localStorage utilities
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
├── tailwind.config.js            # Tailwind config
└── postcss.config.js             # PostCSS config
```

## API Endpoints

### `GET /api/ticker/[symbol]`

Fetches comprehensive ticker data for a given stock symbol.

**Example**: `/api/ticker/AAPL`

**Response**:
```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "float": 15345678900,
    "shortFloatShares": 123456789,
    "pctFloatShort": 0.0804,
    "institutionalOwnership": 0.625,
    ...
  }
}
```

## Data Columns

The application displays the following data for each ticker:

1. **Ticker** - Stock symbol
2. **Float** - Float shares
3. **Short Float (Shares)** - Number of shares sold short
4. **% Float Short** - Percentage of float that is shorted
5. **Institutional Ownership** - Percentage held by institutions
6. **Last Reverse Split Date** - Date of most recent reverse split
7. **Reverse Split Ratio** - Ratio of reverse split (e.g., "1:5")
8. **Sector** - Company sector
9. **Company Description** - Brief company description
10. **Market Cap** - Market capitalization
11. **Total Cash** - Total cash on hand
12. **Free Cash Flow (TTM)** - Trailing twelve months free cash flow
13. **Cash Runway (Months)** - Estimated months until cash runs out
14. **Shares Outstanding** - Total shares outstanding
15. **Dilution (YoY %)** - Year-over-year share dilution
16. **Flags** - Automated risk flags
17. **Last Updated** - Timestamp of last data fetch

## Flags

The application automatically detects and flags:

- 🟡 **High short + Low float**: Float < 20M and short % > 20%
- 🟠 **Has reverse split history**: Company has performed reverse splits
- 🔴 **Cash runway < 12mo**: Estimated cash runway less than 12 months
- 🔵 **Shares up YoY (dilution?)**: Share count increased >10% year-over-year

## License

MIT
