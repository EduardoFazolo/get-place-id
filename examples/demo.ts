import { getGPlaceId } from "../src/index";

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Please set GOOGLE_MAPS_API_KEY environment variable");
    process.exit(1);
  }

  const urls = [
    // 1. Direct Place ID
    "https://www.google.com/maps/search/?api=1&query=Centennial+Park&query_place_id=ChIJ3S-JXmauEmsRunMqck0Kd3s",
    
    // 2. Regular URL with Coordinates
    "https://www.google.com/maps/place/Sydney+Opera+House/@-33.8567844,151.2152967,17z/data=!3m1!4b1!4m5!3m4!1s0x6b12ae665a8a2525:0x3103c631277242fd!8m2!3d-33.8567844!4d151.2152967",
    
    // 3. Share Short URL (requires network call)
    "https://share.google/BJ6jxXfET9tsyo1S3",
    
    // 4. Complex Intent URL (Ippai Ramen example)
    "https://www.google.com/maps?vet=10CAAQoqAOahcKEwiwyqOT0Z-SAxUAAAAAHQAAAAAQBg..i&pvq=Cg0vZy8xMXN3cnNobTh5IhEKC2lwcGFpIHJhbWVuEAIYAw&lqi=CgtpcHBhaSByYW1lbkidmp_87riAgAhaHRAAEAEYABgBIgtpcHBhaSByYW1lbioGCAIQABABkgETamFwYW5lc2VfcmVzdGF1cmFudA&fvr=1&cs=1&um=1&ie=UTF-8&fb=1&gl=br&sa=X&ftid=0x94dce398dd5cc993:0x3b7d4080271c9512"
  ];

  console.log(`Running examples with API Key: ${apiKey.substring(0, 5)}...`);

  for (const url of urls) {
    console.log(`\n-----------------------------------`);
    console.log(`Testing: ${url.substring(0, 60)}...`);
    try {
      const placeId = await getGPlaceId(url, { apiKey });
      if (placeId) {
        console.log(`✅ Success: ${placeId}`);
      } else {
        console.log(`❌ Failed: No Place ID found`);
      }
    } catch (e) {
      console.error(`❌ Error:`, e);
    }
  }
}

main().catch(console.error);
