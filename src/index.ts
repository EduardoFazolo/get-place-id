import { GPlaceIdOptions } from "./types";
import { cidResolver, directResolver, expandShortUrl, isShortUrl, regularResolver, searchIntentResolver, searchUrlResolver } from "./resolvers";

export * from "./types";

export async function getGPlaceId(
  url: string,
  options: GPlaceIdOptions
): Promise<string | null> {
  try {
    let currentUrl = url;
    console.log("getGPlaceId processing:", currentUrl);

    // 1. Direct Match on original URL
    const directMatch = await directResolver(currentUrl, options);
    if (directMatch) return directMatch;

    // 2. Expand Short URL if necessary
    if (await isShortUrl(currentUrl)) {
      currentUrl = await expandShortUrl(currentUrl);
      console.log("Expanded URL to:", currentUrl);

      // 2a. Check Direct Match again on expanded URL
      const expandedDirectMatch = await directResolver(currentUrl, options);
      if (expandedDirectMatch) return expandedDirectMatch;
    }

    // 3. Search Intent Resolver (for lqi/pvq URLs)
    const searchMatch = await searchIntentResolver(currentUrl, options);
    if (searchMatch) return searchMatch;
    
    // 4. Search URL Resolver (for google.com/search?q=...)
    const searchUrlMatch = await searchUrlResolver(currentUrl, options);
    if (searchUrlMatch) return searchUrlMatch;

    // 5. CID Resolver (for maps.google.com/?cid=...)
    const cidMatch = await cidResolver(currentUrl, options);
    if (cidMatch) return cidMatch;

    // 6. Regular URL Resolver (Coordinates parsing + Text Search)
    const regularMatch = await regularResolver(currentUrl, options);
    if (regularMatch) return regularMatch;

    return null;
  } catch (error) {
    console.error("Error in getGPlaceId:", error);
    return null;
  }
}
