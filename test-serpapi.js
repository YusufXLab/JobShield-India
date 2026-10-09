// ============================================================
// test-serpapi.js — Quick SerpApi Connection Test
// ============================================================
// Purpose: Verify that our SerpApi key works by making ONE
//          simple Google Search request.
//
// What it does:
//   1. Reads SERPAPI_KEY from the .env file (never prints it)
//   2. Searches Google for "TCS jobs India"
//   3. Prints a small, safe summary of the results
//
// Run with:  node test-serpapi.js
// ============================================================

// Load environment variables from .env
require("dotenv").config();

// Import the SerpApi helper — getJson sends a request and
// returns a Promise with the parsed JSON response.
const { getJson } = require("serpapi");

async function runTest() {
  // --- 1. Check that the key exists (don't reveal it) ---
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.error("❌  SERPAPI_KEY is missing from .env — cannot run the test.");
    process.exit(1);
  }

  console.log("✅  SERPAPI_KEY found in .env (hidden for security).");
  console.log('🔍  Searching Google for "TCS jobs India" …\n');

  try {
    // --- 2. Make one Google Search request ---
    const result = await getJson({
      engine: "google",          // standard Google web search
      q: "TCS jobs India",       // the search query
      gl: "in",                  // country: India
      hl: "en",                  // language: English
      num: 5,                    // only ask for 5 results (keep it small)
      api_key: apiKey,
    });

    // --- 3. Show a safe summary ---
    console.log("========== SerpApi Test Results ==========\n");

    // 3a. Search metadata (proves the request went through)
    if (result.search_metadata) {
      console.log("Request status :", result.search_metadata.status);
      console.log("Search engine  :", result.search_metadata.engine);
      console.log("Total time     :", result.search_metadata.total_time_taken, "seconds");
      console.log();
    }

    // 3b. Top organic results (titles + links only — safe to show)
    const organicResults = result.organic_results || [];
    console.log(`Organic results returned: ${organicResults.length}\n`);

    organicResults.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.title}`);
      console.log(`     ${item.link}\n`);
    });

    console.log("==========================================");
    console.log("🎉  SerpApi connection test PASSED!");

  } catch (err) {
    console.error("❌  SerpApi request failed:\n");
    console.error("   ", err.message || err);
    process.exit(1);
  }
}

runTest();
