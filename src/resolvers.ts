import { GPlaceIdOptions, Resolver } from "./types";

// ==========================================
// Types & Interfaces (formerly in utils)
// ==========================================

interface PlaceResult {
  name: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface SearchResponse {
  results?: PlaceResult[];
  candidates?: PlaceResult[];
  status: string;
}

// ==========================================
// Resolvers
// ==========================================

// ==========================================
// Resolvers
// ==========================================

export const searchIntentResolver: Resolver = async (url, options) => {
  if (!url.includes("pvq=") && !url.includes("lqi=")) {
    return null;
  }

  console.log("Processing Search Intent URL:", url);
  
  try {
    const urlObj = new URL(url);
    const pvq = urlObj.searchParams.get("pvq");
    const lqi = urlObj.searchParams.get("lqi");
    const targetParam = pvq || lqi; 

    if (!targetParam) return null;

    // 1. Extract Query
    const query = extractQueryFromProtobuf(targetParam);
    if (!query) {
      console.log("Could not extract query from pvq/lqi");
      return null;
    }
    console.log("Extracted query:", query);

    // 2. Extract Coordinates (Need to fetch page)
    const coords = await extractCoordinatesFromPage(url);
    if (!coords) {
      console.log("Could not extract coordinates from page");
      return await findPlaceFromText(query, options);
    }
    
    console.log(`Extracted coordinates: ${coords.lat}, ${coords.lng}`);
    
    // 3. Search
    return await searchByTextAndLocation(query, coords.lat, coords.lng, options);

  } catch (error) {
    console.error("Error in searchIntentResolver:", error);
    return null;
  }
};

function extractQueryFromProtobuf(base64: string): string | null {
  try {
    const decoded = Buffer.from(base64, 'base64').toString('binary');
    const matches = decoded.match(/[\x20-\x7E]{3,}/g);
    
    if (!matches) return null;

    const candidates = matches.filter(m => !m.startsWith("/g/") && !m.startsWith("http"));
    return candidates.reduce((a, b) => a.length > b.length ? a : b, "");
  } catch (e) {
    return null;
  }
}

async function extractCoordinatesFromPage(url: string): Promise<{lat: number, lng: number} | null> {
  try {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });
    const text = await response.text();
    
    const matches = text.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/g);
    
    if (matches) {
       for (const match of matches) {
          const parts = match.split(",").map(p => parseFloat(p.trim()));
          if (parts.length === 2) {
             const [v1, v2] = parts;
             if (Math.abs(v1) <= 90 && Math.abs(v2) <= 180) {
                 return { lat: v1, lng: v2 };
             }
             if (Math.abs(v2) <= 90 && Math.abs(v1) <= 180) {
                 return { lat: v2, lng: v1 };
             }
          }
       }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export const directResolver: Resolver = async (url) => {
  console.log("Processing URL (Direct Resolver):", url);

  const directPlaceIdMatch = url.match(/place_id[=:]([^&]+)/);
  if (directPlaceIdMatch && directPlaceIdMatch[1]) {
    console.log("Found direct place_id:", directPlaceIdMatch[1]);
    return directPlaceIdMatch[1];
  }

  return null;
};

export async function isShortUrl(url: string): Promise<boolean> {
  return url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps");
}

export async function expandShortUrl(url: string): Promise<string> {
  console.log("Processing short URL:", url);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      method: "HEAD", // Try HEAD first to save bandwidth
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    
    // If HEAD didn't follow redirect (sometimes servers don't serve redirect on HEAD), try GET
    if (response.url === url) {
       const getResponse = await fetch(url, {
        redirect: "follow",
        headers: {
            "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      return getResponse.url;
    }

    return response.url;
  } catch (error) {
    console.error("Error expanding short URL:", error);
    return url;
  }
}

export const regularResolver: Resolver = async (url, options) => {
  // Handle regular Google Maps URLs
  const regularPlaceMatch = url.match(/\/place\/([^/?]+)/);
  
  if (regularPlaceMatch && regularPlaceMatch[1]) {
    console.log("Processing regular place URL:", regularPlaceMatch[1]);
    const placeNameRaw = regularPlaceMatch[1];

    // Try to extract coordinates from data parameters first
    // Look for patterns like !3d-33.867!4d151.206
    const dataCoordMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);

    if (dataCoordMatch && dataCoordMatch[1] && dataCoordMatch[2]) {
      console.log(
        "Found place coordinates in regular URL, searching by location..."
      );
      const lat = parseFloat(dataCoordMatch[1]);
      const lng = parseFloat(dataCoordMatch[2]);
      const placeName = decodeURIComponent(placeNameRaw.replace(/\+/g, " "));

      const placeId = await searchByTextAndLocation(placeName, lat, lng, options);
      if (placeId) {
        console.log("Found place ID via coordinate search:", placeId);
        return placeId;
      }
    }

    // Fallback to text search if no coordinates found or no match found with coordinates
    console.log("Falling back to Find Place from Text API...");
    const placeName = decodeURIComponent(placeNameRaw.replace(/\+/g, " "));
    return await findPlaceFromText(placeName, options);
  }

  return null;
};

// ==========================================
// Utils (formerly in googleMapsApi.ts)
// ==========================================

async function searchByTextAndLocation(
  query: string,
  lat: number,
  lng: number,
  options: GPlaceIdOptions
): Promise<string | null> {
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&location=${lat},${lng}&key=${options.apiKey}`;

  const response = await fetch(searchUrl);
  const searchData = (await response.json()) as SearchResponse;

  if (searchData.results && searchData.results.length > 0) {
    let bestMatch = searchData.results[0];
    let bestScore = 0;

    for (const result of searchData.results) {
      // Exact name match gets highest priority
      const exactNameMatch =
        result.name.toLowerCase() === query.toLowerCase();

      // Partial name match (one contains the other)
      const partialNameMatch =
        result.name.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(result.name.toLowerCase());

      // Calculate distance in degrees (roughly meters)
      const distance = Math.sqrt(
        Math.pow(result.geometry.location.lat - lat, 2) +
          Math.pow(result.geometry.location.lng - lng, 2)
      );

      // Convert distance to approximate meters (1 degree ≈ 111,000 meters)
      const distanceInMeters = distance * 111000;

      // Scoring system:
      // - Exact name match: 1000 points
      // - Partial name match: 100 points
      // - Distance bonus: up to 50 points (closer = higher)
      // - Maximum distance penalty: 50 meters
      const nameScore = exactNameMatch ? 1000 : partialNameMatch ? 100 : 0;
      const distanceScore = Math.max(0, 50 - distanceInMeters / 10); // 50 points at 0m, 0 points at 500m+

      const totalScore = nameScore + distanceScore;

      console.log(
        `Candidate: "${result.name}" at ${distanceInMeters.toFixed(
          0
        )}m - Score: ${totalScore} (name: ${nameScore}, distance: ${distanceScore.toFixed(
          1
        )})`
      );

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = result;
      }
    }

    console.log(`Selected: "${bestMatch.name}" with score ${bestScore}`);

    // Validate the selection - ensure it's a good match
    const selectedDistance =
      Math.sqrt(
        Math.pow(bestMatch.geometry.location.lat - lat, 2) +
          Math.pow(bestMatch.geometry.location.lng - lng, 2)
      ) * 111000; // Convert to meters

    const isExactNameMatch =
      bestMatch.name.toLowerCase() === query.toLowerCase();
    const isCloseEnough = selectedDistance < 100; // Within 100 meters
    
    // Warn if match is questionable
    if (!isExactNameMatch && !isCloseEnough) {
      console.log(
        `Warning: Selected place "${
          bestMatch.name
        }" is ${selectedDistance.toFixed(
          0
        )}m away and name doesn't match exactly. Score: ${bestScore}`
      );
    }

    if (bestScore < 50) {
      console.log(
        `Warning: Low confidence match. Score ${bestScore} is below threshold.`
      );
    }

    return bestMatch.place_id;
  }
  
  return null;
}

async function findPlaceFromText(
  input: string,
  options: GPlaceIdOptions
): Promise<string | null> {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      input
    )}&inputtype=textquery&key=${options.apiKey}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = (await searchResponse.json()) as SearchResponse;

    if (searchData.candidates && searchData.candidates.length > 0) {
      console.log(
        "Found place ID via text search:",
        searchData.candidates[0].place_id
      );
      return searchData.candidates[0].place_id;
    }
    return null;
}
