// ============================================================
// test-google-search.js — Test the Google Search (complaints) function
// ============================================================
// Purpose: Verify that searchGoogleComplaints() works correctly.
//
// Run with:  node test-google-search.js
// ============================================================

// Load .env FIRST (so SERPAPI_KEY is available when serpapi.js loads)
require("dotenv").config();

// Import our function from the serpapi module
const { searchGoogleComplaints } = require("./server/serpapi");

async function runTest() {
  console.log('🔍  Testing searchGoogleComplaints("TCS scam fraud complaints jobs") …\n');

  // Call our function
  const result = await searchGoogleComplaints("TCS scam fraud complaints jobs");

  // Check if it worked
  if (!result.success) {
    console.error("❌  Test FAILED:", result.error);
    process.exit(1);
  }

  // Print the summary
  console.log("========== Google Search Test Results ==========\n");
  console.log(`✅  Success! Found ${result.count} organic result(s).\n`);

  // Print each clean result
  result.results.forEach((item, i) => {
    console.log(`--- Result ${i + 1} ---`);
    console.log(`  Title   : ${item.title}`);
    console.log(`  Link    : ${item.link || "Not available"}`);
    console.log(`  Snippet : ${item.snippet}`);
    console.log();
  });

  console.log("================================================");
  console.log("🎉  Google Search (complaints) test PASSED!");
}

runTest();
