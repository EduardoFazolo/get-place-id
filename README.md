# get-gplace-id

A robust TypeScript library to extract the **Google Place ID** from various types of Google Maps URLs.

This package handles standard URLs, short URLs, mobile share links, and complex search intent URLs by using a combination of direct extraction, URL expansion, and the Google Places API.

## Installation

```bash
npm install get-gplace-id
```

```bash
bun install get-gplace-id
```

```bash
pnpm install get-gplace-id
```

## Usage

You must provide a valid **Google Maps API Key** with access to the **Places API** (specifically *Text Search* and *Find Place from Text*).

```typescript
import { getGPlaceId } from "get-gplace-id";

async function main() {
  const apiKey = "YOUR_GOOGLE_MAPS_API_KEY";
  const url = "https://goo.gl/maps/YOUR_SHORT_URL";

  const placeId = await getGPlaceId(url, { apiKey });

  if (placeId) {
    console.log("Found Place ID:", placeId);
  } else {
    console.log("Could not extract Place ID.");
  }
}

main();
```

## Supported URL Formats

The library supports a wide range of URL types:

1.  **Direct Place ID**: URLs that explicitly contain `place_id=...` parameters.
2.  **Short URLs**: `maps.app.goo.gl`, `goo.gl/maps`, and `share.google` links (handles redirects automatically).
3.  **Regular Maps URLs**:
    *   Extracts coordinates (`!3d...!4d...`) and uses the **Text Search API** with name matching and distance scoring.
    *   Uses **Find Place from Text API** if no coordinates are found.
4.  **Search Intent URLs**: Handles complex URLs containing `pvq` or `lqi` parameters (often from mobile apps) by decoding the query intent and scraping coordinates from the page signature to perform a precise search.
5.  **Search Redirects**: Handles URLs that redirect to `google.com/search?q=...` (common with `share.google` links).

## API Reference

### `getGPlaceId(url: string, options: GPlaceIdOptions): Promise<string | null>`

*   `url`: The Google Maps URL string to parse.
*   `options`: Configuration object.
    *   `apiKey`: **Required**. Your Google Cloud API Key.

Returns a `Promise` that resolves to the **Place ID** string if found, or `null` if not.

## How it works

1.  **Direct Check**: Checks if the URL already contains a Place ID.
2.  **Expansion**: If it's a short URL (`maps.app.goo.gl`, `share.google`), it follows HTTP redirects to get the final canonical URL.
3.  **Search Intent**: If it's a "search intent" URL (protobuf parameters), it decodes the query and location to perform a targeted API search.
4.  **Regular Resolution**: Parses the URL path (e.g., place name) and coordinates. It then queries the Google Places API and scores results based on:
    *   **Name Match**: Exact vs. Partial match.
    *   **Distance**: Proximity to the coordinates found in the URL.

## License

ISC
