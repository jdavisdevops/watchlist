import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Get ticker(s) from command line arguments or use default
const TICKERS = process.argv.slice(2).length > 0 
  ? process.argv.slice(2).map(t => t.toUpperCase().trim())
  : ['FRMI'];

// Target fields we want to extract for IPO stocks
const TARGET_FIELDS = [
  'marketCap',
  'floatShares',
  'sharesOutstanding',
  'sector',
  'longName',
  'shortName',
  'regularMarketPrice',
  'sharesShort',
  'heldPercentInstitutions',
  'totalCash',
  'freeCashflow',
  'longBusinessSummary',
  'industry',
  'fullTimeEmployees',
  'website',
  'city',
  'state',
  'country',
  'ipoDate',
  'exDividendDate',
  'earningsDate',
  'majorHoldersBreakdown',
  'institutionOwnership',
  'insiderTransactions',
];

// Test results structure
interface TestResult {
  method: string;
  success: boolean;
  data: any;
  error?: string;
  errorType?: string;
  fieldsFound: string[];
  executionTime: number;
  fieldCoverage?: number; // Percentage of target fields found
  completenessScore?: number; // Overall completeness score (0-100)
}

// Helper to extract field names from nested objects
function extractFields(obj: any, prefix = ''): string[] {
  const fields: string[] = [];
  
  if (obj === null || obj === undefined) {
    return fields;
  }
  
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            fields.push(...extractFields(value, fullKey));
          } else {
            fields.push(fullKey);
          }
        }
      }
    }
  }
  
  return fields;
}

// Calculate field coverage score
function calculateFieldCoverage(fieldsFound: string[]): number {
  if (TARGET_FIELDS.length === 0) return 0;
  
  const foundCount = TARGET_FIELDS.filter(targetField => {
    // Check if any found field matches the target (case-insensitive, partial match)
    return fieldsFound.some(found => {
      const foundLower = found.toLowerCase();
      const targetLower = targetField.toLowerCase();
      return foundLower === targetLower || 
             foundLower.includes(targetLower) || 
             targetLower.includes(foundLower);
    });
  }).length;
  
  return (foundCount / TARGET_FIELDS.length) * 100;
}

// Calculate completeness score based on data quality
function calculateCompletenessScore(result: TestResult): number {
  if (!result.success) return 0;
  
  const fieldCoverage = result.fieldCoverage || 0;
  const hasMarketCap = result.fieldsFound.some(f => f.toLowerCase().includes('marketcap'));
  const hasPrice = result.fieldsFound.some(f => f.toLowerCase().includes('price'));
  const hasFloat = result.fieldsFound.some(f => f.toLowerCase().includes('float'));
  const hasShares = result.fieldsFound.some(f => f.toLowerCase().includes('shares'));
  const hasSector = result.fieldsFound.some(f => f.toLowerCase().includes('sector'));
  const hasDescription = result.fieldsFound.some(f => f.toLowerCase().includes('description') || f.toLowerCase().includes('summary') || f.toLowerCase().includes('business'));
  
  // Weight different aspects
  let score = fieldCoverage * 0.4; // 40% weight on field coverage
  if (hasMarketCap) score += 10;
  if (hasPrice) score += 10;
  if (hasFloat) score += 10;
  if (hasShares) score += 10;
  if (hasSector) score += 10;
  if (hasDescription) score += 10;
  
  return Math.min(100, score);
}

// Helper to format output
function formatResult(result: TestResult): string {
  const icon = result.success ? '✓' : '✗';
  const status = result.success ? 'SUCCESS' : 'FAILED';
  const time = `${result.executionTime}ms`;
  
  let output = `${icon} ${result.method} - ${status} (${time})`;
  
  if (result.success) {
    if (result.completenessScore !== undefined) {
      output += ` [Score: ${result.completenessScore.toFixed(1)}%]`;
    }
    if (result.fieldCoverage !== undefined) {
      output += ` [Coverage: ${result.fieldCoverage.toFixed(1)}%]`;
    }
    output += '\n';
    
    if (result.fieldsFound.length > 0) {
      output += `  Fields found (${result.fieldsFound.length}): ${result.fieldsFound.slice(0, 10).join(', ')}`;
      if (result.fieldsFound.length > 10) {
        output += ` ... and ${result.fieldsFound.length - 10} more`;
      }
      output += '\n';
    }
    
    // Show sample data for key fields
    const keyFields = ['marketCap', 'regularMarketPrice', 'floatShares', 'sharesOutstanding', 'sector', 'longName', 'ipoDate'];
    const foundKeyFields = keyFields.filter(f => result.fieldsFound.includes(f) || result.fieldsFound.some(ff => ff.includes(f)));
    if (foundKeyFields.length > 0) {
      output += `  Key fields: ${foundKeyFields.join(', ')}\n`;
    }
  } else {
    output += '\n';
    output += `  Error: ${result.error}\n`;
    if (result.errorType) {
      output += `  Error Type: ${result.errorType}\n`;
    }
  }
  
  return output;
}

// Test quoteSummary with individual modules
async function testQuoteSummaryModules(ticker: string): Promise<TestResult[]> {
  console.log(`\n=== Testing quoteSummary with Individual Modules for ${ticker} ===\n`);
  
  // All available modules from yahoo-finance2
  const modules = [
    // Core modules
    'price',
    'quoteType',
    'summaryDetail',
    'summaryProfile',
    
    // Statistics & Financials
    'defaultKeyStatistics',
    'financialData',
    'balanceSheetHistory',
    'balanceSheetHistoryQuarterly',
    'incomeStatementHistory',
    'incomeStatementHistoryQuarterly',
    'cashflowStatementHistory',
    'cashflowStatementHistoryQuarterly',
    
    // Ownership & Holders
    'institutionOwnership',
    'majorHoldersBreakdown',
    'majorDirectHolders',
    'insiderHolders',
    'insiderTransactions',
    'fundOwnership',
    
    // Profile & Events
    'assetProfile',
    'calendarEvents', // Important for IPO dates
    'secFilings',
    
    // Trends & Recommendations
    'earningsTrend',
    'earningsHistory',
    'recommendationTrend',
    'upgradeDowngradeHistory',
    'sectorTrend',
    'industryTrend',
    'indexTrend',
    
    // Other
    'esgScores',
    'pageViews',
    'netSharePurchaseActivity',
    'earnings',
    'fundProfile',
    'fundPerformance',
    'topHoldings',
  ];
  
  const results: TestResult[] = [];
  
  for (const module of modules) {
    const startTime = Date.now();
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: [module] as any,
      });
      
      const executionTime = Date.now() - startTime;
      const moduleData = (data as any)[module];
      const fields = extractFields(moduleData);
      const fieldCoverage = calculateFieldCoverage(fields);
      const completenessScore = calculateCompletenessScore({
        method: `quoteSummary(['${module}'])`,
        success: true,
        data: moduleData,
        fieldsFound: fields,
        executionTime,
        fieldCoverage,
      });
      
      const result: TestResult = {
        method: `quoteSummary(['${module}'])`,
        success: true,
        data: moduleData,
        fieldsFound: fields,
        executionTime,
        fieldCoverage,
        completenessScore,
      };
      
      results.push(result);
      console.log(formatResult(result));
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error?.message || String(error);
      const errorType = error?.name || 'Unknown';
      
      results.push({
        method: `quoteSummary(['${module}'])`,
        success: false,
        data: null,
        error: errorMessage,
        errorType,
        fieldsFound: [],
        executionTime,
      });
      
      console.log(formatResult(results[results.length - 1]));
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Test quoteSummary with module combinations
async function testQuoteSummaryCombinations(ticker: string): Promise<TestResult[]> {
  console.log(`\n=== Testing quoteSummary with Module Combinations for ${ticker} ===\n`);
  
  // Strategic combinations optimized for IPO stocks
  const combinations = [
    // Core price/quote combinations
    ['price', 'summaryDetail'],
    ['price', 'quoteType'],
    ['summaryDetail', 'quoteType'],
    ['price', 'summaryDetail', 'quoteType'],
    
    // Profile combinations
    ['summaryProfile', 'price'],
    ['assetProfile', 'price'],
    ['summaryProfile', 'assetProfile'],
    
    // Comprehensive IPO-focused combinations
    ['price', 'quoteType', 'summaryDetail', 'summaryProfile', 'calendarEvents'],
    ['price', 'quoteType', 'summaryDetail', 'defaultKeyStatistics', 'calendarEvents'],
    ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'summaryProfile'],
    
    // Ownership-focused combinations
    ['institutionOwnership', 'majorHoldersBreakdown', 'price'],
    ['insiderTransactions', 'insiderHolders', 'price'],
    
    // Maximum data combination (for completeness)
    ['price', 'quoteType', 'summaryDetail', 'summaryProfile', 'defaultKeyStatistics', 
     'financialData', 'calendarEvents', 'assetProfile', 'institutionOwnership', 'majorHoldersBreakdown'],
  ];
  
  const results: TestResult[] = [];
  
  for (const modules of combinations) {
    const startTime = Date.now();
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: modules as any,
      });
      
      const executionTime = Date.now() - startTime;
      const allFields: string[] = [];
      
      for (const module of modules) {
        const moduleData = (data as any)[module];
        if (moduleData) {
          allFields.push(...extractFields(moduleData, module));
        }
      }
      
      const fieldCoverage = calculateFieldCoverage(allFields);
      const completenessScore = calculateCompletenessScore({
        method: `quoteSummary([${modules.map(m => `'${m}'`).join(', ')}])`,
        success: true,
        data,
        fieldsFound: allFields,
        executionTime,
        fieldCoverage,
      });
      
      const result: TestResult = {
        method: `quoteSummary([${modules.map(m => `'${m}'`).join(', ')}])`,
        success: true,
        data,
        fieldsFound: allFields,
        executionTime,
        fieldCoverage,
        completenessScore,
      };
      
      results.push(result);
      console.log(formatResult(result));
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error?.message || String(error);
      const errorType = error?.name || 'Unknown';
      
      results.push({
        method: `quoteSummary([${modules.map(m => `'${m}'`).join(', ')}])`,
        success: false,
        data: null,
        error: errorMessage,
        errorType,
        fieldsFound: [],
        executionTime,
      });
      
      console.log(formatResult(results[results.length - 1]));
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Test quote method variations
async function testQuoteMethod(ticker: string): Promise<TestResult[]> {
  console.log(`\n=== Testing quote Method Variations for ${ticker} ===\n`);
  
  const results: TestResult[] = [];
  
  // Test 1: Basic quote
  {
    const startTime = Date.now();
    try {
      const data = await yahooFinance.quote(ticker);
      const executionTime = Date.now() - startTime;
      const fields = extractFields(data);
      const fieldCoverage = calculateFieldCoverage(fields);
      const completenessScore = calculateCompletenessScore({
        method: `quote(${ticker})`,
        success: true,
        data,
        fieldsFound: fields,
        executionTime,
        fieldCoverage,
      });
      
      results.push({
        method: `quote(${ticker})`,
        success: true,
        data,
        fieldsFound: fields,
        executionTime,
        fieldCoverage,
        completenessScore,
      });
      
      console.log(formatResult(results[results.length - 1]));
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      results.push({
        method: `quote(${ticker})`,
        success: false,
        data: null,
        error: error?.message || String(error),
        errorType: error?.name || 'Unknown',
        fieldsFound: [],
        executionTime,
      });
      
      console.log(formatResult(results[results.length - 1]));
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Test 2: Quote with specific fields (if supported)
  const fieldGroups = [
    ['marketCap', 'regularMarketPrice', 'longName'],
    ['marketCap', 'regularMarketPrice', 'regularMarketVolume'],
    ['regularMarketPrice', 'currency', 'exchange'],
  ];
  
  for (const fields of fieldGroups) {
    const startTime = Date.now();
    try {
      // Note: yahoo-finance2 quote may not support fields parameter
      // This will test if it does
      const data = await (yahooFinance.quote as any)(ticker, { fields });
      const executionTime = Date.now() - startTime;
      const extractedFields = extractFields(data);
      const fieldCoverage = calculateFieldCoverage(extractedFields);
      const completenessScore = calculateCompletenessScore({
        method: `quote(${ticker}, { fields: [${fields.map(f => `'${f}'`).join(', ')}] })`,
        success: true,
        data,
        fieldsFound: extractedFields,
        executionTime,
        fieldCoverage,
      });
      
      results.push({
        method: `quote(${ticker}, { fields: [${fields.map(f => `'${f}'`).join(', ')}] })`,
        success: true,
        data,
        fieldsFound: extractedFields,
        executionTime,
        fieldCoverage,
        completenessScore,
      });
      
      console.log(formatResult(results[results.length - 1]));
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      results.push({
        method: `quote(${ticker}, { fields: [${fields.map(f => `'${f}'`).join(', ')}] })`,
        success: false,
        data: null,
        error: error?.message || String(error),
        errorType: error?.name || 'Unknown',
        fieldsFound: [],
        executionTime,
      });
      
      // Don't log if it's just "fields not supported" - that's expected
      if (!error?.message?.includes('fields')) {
        console.log(formatResult(results[results.length - 1]));
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Test other methods
async function testOtherMethods(ticker: string): Promise<TestResult[]> {
  console.log(`\n=== Testing Other Methods for ${ticker} ===\n`);
  
  const results: TestResult[] = [];
  
  // Test search
  {
    const startTime = Date.now();
    try {
      const data = await yahooFinance.search(ticker);
      const executionTime = Date.now() - startTime;
      const fields = extractFields(data);
      const fieldCoverage = calculateFieldCoverage(fields);
      const completenessScore = calculateCompletenessScore({
        method: `search(${ticker})`,
        success: true,
        data,
        fieldsFound: fields,
        executionTime,
        fieldCoverage,
      });
      
      results.push({
        method: `search(${ticker})`,
        success: true,
        data,
        fieldsFound: fields,
        executionTime,
        fieldCoverage,
        completenessScore,
      });
      
      console.log(formatResult(results[results.length - 1]));
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      results.push({
        method: `search(${ticker})`,
        success: false,
        data: null,
        error: error?.message || String(error),
        errorType: error?.name || 'Unknown',
        fieldsFound: [],
        executionTime,
      });
      
      console.log(formatResult(results[results.length - 1]));
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return results;
}

// Generate recommendations
function generateRecommendations(allResults: TestResult[]): string {
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);
  
  let recommendations = '\n=== Recommendations ===\n\n';
  
  if (successful.length === 0) {
    recommendations += 'No methods succeeded. Ticker may not be available via yahoo-finance2 API.\n';
    return recommendations;
  }
  
  // Find methods with highest completeness scores
  const byCompleteness = [...successful]
    .filter(r => r.completenessScore !== undefined)
    .sort((a, b) => (b.completenessScore || 0) - (a.completenessScore || 0))
    .slice(0, 5);
  
  if (byCompleteness.length > 0) {
    recommendations += 'Top methods by completeness score:\n';
    byCompleteness.forEach(r => {
      recommendations += `  - ${r.method}\n`;
      recommendations += `    Score: ${r.completenessScore?.toFixed(1)}%, Coverage: ${r.fieldCoverage?.toFixed(1)}%, Time: ${r.executionTime}ms\n`;
    });
    recommendations += '\n';
  }
  
  // Find methods with most useful fields
  const methodsWithKeyFields = successful.filter(r => {
    const hasMarketCap = r.fieldsFound.some(f => f.includes('marketCap') || f.includes('market'));
    const hasPrice = r.fieldsFound.some(f => f.includes('Price') || f.includes('price'));
    const hasFloat = r.fieldsFound.some(f => f.includes('float') || f.includes('Float'));
    const hasIPO = r.fieldsFound.some(f => f.includes('ipo') || f.includes('IPO'));
    return hasMarketCap || hasPrice || hasFloat || hasIPO;
  });
  
  if (methodsWithKeyFields.length > 0) {
    recommendations += 'Methods with key IPO data:\n';
    methodsWithKeyFields.slice(0, 5).forEach(r => {
      recommendations += `  - ${r.method}\n`;
      const keyFields = r.fieldsFound.filter(f => 
        f.includes('marketCap') || f.includes('Price') || f.includes('float') || 
        f.includes('shares') || f.includes('sector') || f.includes('ipo')
      );
      if (keyFields.length > 0) {
        recommendations += `    Key fields: ${keyFields.slice(0, 5).join(', ')}\n`;
      }
    });
    recommendations += '\n';
  }
  
  // Find fastest successful methods with good scores
  const fastestWithGoodScore = [...successful]
    .filter(r => (r.completenessScore || 0) >= 50)
    .sort((a, b) => a.executionTime - b.executionTime)
    .slice(0, 3);
  
  if (fastestWithGoodScore.length > 0) {
    recommendations += 'Fastest methods with good completeness (>=50%):\n';
    fastestWithGoodScore.forEach(r => {
      recommendations += `  - ${r.method} (${r.executionTime}ms, Score: ${r.completenessScore?.toFixed(1)}%)\n`;
    });
    recommendations += '\n';
  }
  
  // Note about failed methods
  if (failed.length > 0) {
    const commonErrors = new Map<string, number>();
    failed.forEach(r => {
      if (r.error) {
        const errorKey = r.error.substring(0, 50);
        commonErrors.set(errorKey, (commonErrors.get(errorKey) || 0) + 1);
      }
    });
    
    if (commonErrors.size > 0) {
      recommendations += 'Common failure patterns:\n';
      Array.from(commonErrors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([error, count]) => {
          recommendations += `  - "${error}" (${count} occurrences)\n`;
        });
    }
  }
  
  return recommendations;
}

// Main test runner
async function runAllTests(ticker: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${ticker} data retrieval methods`);
  console.log(`${'='.repeat(60)}\n`);
  
  const allResults: TestResult[] = [];
  
  // Run all test suites
  const individualModules = await testQuoteSummaryModules(ticker);
  allResults.push(...individualModules);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const combinations = await testQuoteSummaryCombinations(ticker);
  allResults.push(...combinations);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const quoteTests = await testQuoteMethod(ticker);
  allResults.push(...quoteTests);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const otherMethods = await testOtherMethods(ticker);
  allResults.push(...otherMethods);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY for ${ticker}`);
  console.log('='.repeat(60));
  console.log(`Total tests: ${allResults.length}`);
  console.log(`Successful: ${allResults.filter(r => r.success).length}`);
  console.log(`Failed: ${allResults.filter(r => !r.success).length}`);
  console.log(`Success rate: ${((allResults.filter(r => r.success).length / allResults.length) * 100).toFixed(1)}%`);
  
  // Data quality summary
  const successful = allResults.filter(r => r.success);
  if (successful.length > 0) {
    const avgCompleteness = successful
      .filter(r => r.completenessScore !== undefined)
      .reduce((sum, r) => sum + (r.completenessScore || 0), 0) / 
      successful.filter(r => r.completenessScore !== undefined).length;
    const avgCoverage = successful
      .filter(r => r.fieldCoverage !== undefined)
      .reduce((sum, r) => sum + (r.fieldCoverage || 0), 0) / 
      successful.filter(r => r.fieldCoverage !== undefined).length;
    
    if (!isNaN(avgCompleteness)) {
      console.log(`Average completeness score: ${avgCompleteness.toFixed(1)}%`);
    }
    if (!isNaN(avgCoverage)) {
      console.log(`Average field coverage: ${avgCoverage.toFixed(1)}%`);
    }
    
    // Best method
    const bestMethod = [...successful]
      .filter(r => r.completenessScore !== undefined)
      .sort((a, b) => (b.completenessScore || 0) - (a.completenessScore || 0))[0];
    
    if (bestMethod) {
      console.log(`\nBest method: ${bestMethod.method}`);
      console.log(`  Completeness: ${bestMethod.completenessScore?.toFixed(1)}%`);
      console.log(`  Coverage: ${bestMethod.fieldCoverage?.toFixed(1)}%`);
      console.log(`  Execution time: ${bestMethod.executionTime}ms`);
    }
  }
  
  // Recommendations
  console.log(generateRecommendations(allResults));
  
  // Detailed results for top successful methods
  if (successful.length > 0) {
    console.log('\n=== Top 10 Methods by Completeness Score ===\n');
    const topMethods = [...successful]
      .filter(r => r.completenessScore !== undefined)
      .sort((a, b) => (b.completenessScore || 0) - (a.completenessScore || 0))
      .slice(0, 10);
    
    topMethods.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.method}`);
      console.log(`   Score: ${r.completenessScore?.toFixed(1)}%, Coverage: ${r.fieldCoverage?.toFixed(1)}%, Time: ${r.executionTime}ms`);
      console.log(`   Fields: ${r.fieldsFound.length}`);
      console.log('');
    });
  }
  
  return allResults;
}

// Run tests for all specified tickers
async function main() {
  const allTickerResults: Map<string, TestResult[]> = new Map();
  
  for (const ticker of TICKERS) {
    try {
      const results = await runAllTests(ticker);
      allTickerResults.set(ticker, results);
      
      // Add separator between tickers
      if (TICKERS.length > 1 && ticker !== TICKERS[TICKERS.length - 1]) {
        console.log('\n' + '='.repeat(60));
        console.log('='.repeat(60) + '\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to test ${ticker}:`, error);
    }
  }
  
  // Overall summary if multiple tickers
  if (TICKERS.length > 1) {
    console.log('\n' + '='.repeat(60));
    console.log('OVERALL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tickers tested: ${TICKERS.join(', ')}`);
    allTickerResults.forEach((results, ticker) => {
      const successCount = results.filter(r => r.success).length;
      const successRate = ((successCount / results.length) * 100).toFixed(1);
      console.log(`  ${ticker}: ${successCount}/${results.length} (${successRate}%)`);
    });
  }
}

// Run tests
main().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
