// ============================================================
// test-google-news.js — Test the Google News search function
// ============================================================
// Purpose: Verify that searchGoogleNews() works correctly.
//
// Run with:  node test-google-news.js
// ============================================================

// Load .env FIRST (so SERPAPI_KEY is available when serpapi.js loads)
require("dotenv").config();

// Import our function from the serpapi module
const { searchGoogleNews } = require("./server/serpapi");

async function runTest() {
  console.log('🔍  Testing searchGoogleNews("TCS scam fraud jobs") …\n');

  // Call our function
  const result = await searchGoogleNews("TCS scam fraud jobs");

  // Check if it worked
  if (!result.success) {
    console.error("❌  Test FAILED:", result.error);
    process.exit(1);
  }

  // Print the summary
  console.log("========== Google News Test Results ==========\n");
  console.log(`✅  Success! Found ${result.count} news article(s).\n`);

  // Print each clean result (show first 10 only to keep output readable)
  result.results.slice(0, 10).forEach((item, i) => {
    console.log(`--- Article ${i + 1} ---`);
    console.log(`  Title  : ${item.title}`);
    console.log(`  Source : ${item.source}`);
    console.log(`  Date   : ${item.date || "Not available"}`);
    console.log(`  Link   : ${item.link || "Not available"}`);
    console.log();
  });

  if (result.count > 10) {
    console.log(`  … and ${result.count - 10} more article(s) not shown.\n`);
  }

  console.log("===============================================");
  console.log("🎉  Google News search test PASSED!");
}

runTest();
