# Data Retrieval vs Display Analysis

## Summary
After testing FRMI and analyzing the codebase, we've identified significant data that we're **retrieving but not displaying** in the UI.

## Current State for FRMI

### Data We're Successfully Retrieving:
✅ **Market Cap**: $6.37B  
✅ **Shares Outstanding**: 614,025,378  
✅ **Company Name**: "Fermi Inc."  
✅ **Price Data**: $10.37 (regularMarketPrice)  
✅ **Volume**: 9,492,117  
✅ **52 Week Range**: $7.28 - $36.99  
✅ **Analyst Data**: 8 analysts, target mean $29, recommendation mean 1  
✅ **Earnings Estimates**: earningsAverage -$0.00986, revenueAverage $12.085M  
✅ **Institution Ownership**: 3 institutions holding shares  
✅ **Currency**: USD  
✅ **Exchange**: NMS  

### Data We're NOT Retrieving (API limitations):
❌ **Float**: Not available (fundamentals module fails)  
❌ **Short Interest**: Not available (fundamentals module fails)  
❌ **Sector**: Not available (fundamentals module fails)  
❌ **Total Cash**: Not available (fundamentals module fails)  
❌ **Free Cash Flow**: Not available (fundamentals module fails)  

## Data We're Retrieving But NOT Displaying

### 1. Price & Volume Data (Available but Hidden)
- **Current Price**: $10.37
- **Previous Close**: $9.18
- **Day High/Low**: $10.57 / $8.95
- **52 Week High/Low**: $36.99 / $7.28
- **Volume**: 9,492,117
- **Average Volume**: 6,332,461

**Impact**: Users can't see the stock price or trading activity, which is critical information.

### 2. Analyst Data (Available but Hidden)
- **Target Price Range**: $20 - $37
- **Target Mean**: $29
- **Recommendation Mean**: 1 (Strong Buy)
- **Number of Analysts**: 8

**Impact**: Missing valuable analyst insights that could inform investment decisions.

### 3. Earnings Estimates (Available but Hidden)
- **Earnings Average**: -$0.00986
- **Earnings Range**: -$0.00986 to -$0.00986
- **Revenue Average**: $12.085M
- **Revenue Range**: $11.8M - $12.37M

**Impact**: Missing forward-looking earnings data that's important for IPO stocks.

### 4. Institution Ownership Details (Available but Hidden)
- **Number of Institutions**: 3
- **Individual Institution Holdings**: Available but not displayed
- **Ownership Percentages**: Available but not displayed

**Impact**: Can't see which institutions are holding the stock.

### 5. Shares Outstanding (Available but Not Prominently Displayed)
- **Shares Outstanding**: 614,025,378
- Currently only shown in expanded view
- Should be shown in main card when float is null

**Impact**: For IPO stocks without float data, shares outstanding is the next best metric.

### 6. Currency & Exchange (Available but Hidden)
- **Currency**: USD
- **Exchange**: NMS

**Impact**: Useful context for international stocks.

## Current Display Issues

### Main Card (Always Visible)
Currently shows 4 metrics:
1. ✅ Market Cap - **Displayed**
2. ❌ Float - **NULL for FRMI** (shows "-")
3. ❌ Short % - **NULL for FRMI** (shows "-")
4. ❌ Inst. Own - **NULL for FRMI** (shows "-")

**Problem**: 3 out of 4 metrics are empty for IPO stocks like FRMI.

### Expanded View
Shows all available data, but many fields are null for IPO stocks.

## Recommendations

### Immediate Fixes (High Priority)

1. **Replace null metrics in main card with available data:**
   - When `float` is null, show `sharesOutstanding` instead
   - When `pctFloatShort` is null, show `regularMarketPrice` instead
   - When `institutionalOwnership` is null, show `volume` or `52WeekHigh/Low` instead

2. **Add Price section to expanded view:**
   - Current Price
   - Previous Close
   - Day High/Low
   - 52 Week High/Low
   - Volume / Average Volume

3. **Add Analyst section to expanded view:**
   - Target Price Range
   - Target Mean
   - Recommendation
   - Number of Analysts

4. **Add Earnings Estimates section:**
   - Earnings estimates (average, range)
   - Revenue estimates (average, range)

### Data Structure Updates Needed

Add to `TickerData` interface:
```typescript
// Price & Trading Data
regularMarketPrice: number | null;
previousClose: number | null;
dayHigh: number | null;
dayLow: number | null;
fiftyTwoWeekHigh: number | null;
fiftyTwoWeekLow: number | null;
volume: number | null;
averageVolume: number | null;

// Analyst Data
targetHighPrice: number | null;
targetLowPrice: number | null;
targetMeanPrice: number | null;
recommendationMean: number | null;
numberOfAnalystOpinions: number | null;

// Earnings Estimates
earningsAverage: number | null;
earningsLow: number | null;
earningsHigh: number | null;
revenueAverage: number | null;
revenueLow: number | null;
revenueHigh: number | null;

// Additional
currency: string | null;
exchange: string | null;
```

### Extraction Functions Needed

1. `extractFromQuote()` - Already exists but needs enhancement to extract price/volume data
2. `extractFromSummaryDetail()` - New function for 52-week ranges, volume
3. `extractFromFinancialData()` - Already exists but needs enhancement for analyst data
4. `extractFromCalendarEvents()` - Already exists but needs enhancement for earnings estimates

## Test Results Summary

**FRMI Test Results:**
- Total tests: 53
- Successful: 41 (77.4%)
- Failed: 12 (22.6%)
- Best method completeness: 41.7%

**Successful Modules:**
- ✅ price
- ✅ quoteType
- ✅ summaryDetail
- ✅ financialData
- ✅ calendarEvents
- ✅ institutionOwnership
- ✅ quote() method

**Failed Modules (No fundamentals data):**
- ❌ summaryProfile
- ❌ defaultKeyStatistics
- ❌ assetProfile
- ❌ majorHoldersBreakdown
- ❌ insiderTransactions

## Next Steps

1. **Enhance extraction functions** to pull price, analyst, and earnings data
2. **Update TickerData interface** to include new fields
3. **Modify TickerCard component** to:
   - Show available data when primary metrics are null
   - Add new sections for price, analyst, and earnings data
   - Dynamically adjust displayed metrics based on data availability
4. **Test with multiple IPO stocks** to validate improvements
