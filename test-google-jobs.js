// ============================================================
// test-google-jobs.js — Test the Google Jobs search function
// ============================================================
// Purpose: Verify that searchGoogleJobs() works correctly.
//
// Run with:  node test-google-jobs.js
// ============================================================

// Load .env FIRST (so SERPAPI_KEY is available when serpapi.js loads)
require("dotenv").config();

// Import our function from the serpapi module
const { searchGoogleJobs } = require("./server/serpapi");

async function runTest() {
  console.log('🔍  Testing searchGoogleJobs("TCS jobs India") …\n');

  // Call our function
  const result = await searchGoogleJobs("TCS jobs India");

  // Check if it worked
  if (!result.success) {
    console.error("❌  Test FAILED:", result.error);
    process.exit(1);
  }

  // Print the summary
  console.log("========== Google Jobs Test Results ==========\n");
  console.log(`✅  Success! Found ${result.count} job listing(s).\n`);

  // Print each clean job object
  result.jobs.forEach((job, i) => {
    console.log(`--- Job ${i + 1} ---`);
    console.log(`  Title    : ${job.title}`);
    console.log(`  Company  : ${job.company}`);
    console.log(`  Location : ${job.location}`);
    console.log(`  Snippet  : ${job.description}`);
    console.log(`  Link     : ${job.link || "Not available"}`);
    // Print where the user can actually apply
    if (job.applyOptions.length > 0) {
      console.log(`  Apply at :`);
      job.applyOptions.forEach((opt) => {
        console.log(`    → ${opt.title}`);
        console.log(`      ${opt.link || "No link"}`);
      });
    } else {
      console.log(`  Apply at : No application links available`);
    }
    console.log();
  });

  console.log("==============================================");
  console.log("🎉  Google Jobs search test PASSED!");
}

runTest();
