import { getGPlaceId } from "../src/index";

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Please set GOOGLE_MAPS_API_KEY environment variable");
    process.exit(1);
  }

  const urls = [
    "https://maps.app.goo.gl/uX3a...", // Replace with real short URL for manual testing
    "https://www.google.com/maps/place/Sydney+Opera+House/@-33.8567844,151.2152967,17z/data=!3m1!4b1!4m5!3m4!1s0x6b12ae665a8a2525:0x3103c631277242fd!8m2!3d-33.8567844!4d151.2152967",
  ];

  for (const url of urls) {
    console.log(`\nTesting: ${url}`);
    const placeId = await getGPlaceId(url, { apiKey });
    console.log(`Result: ${placeId}`);
  }
}

// main().catch(console.error);
console.log("Run this script with: ts-node examples/demo.ts");
