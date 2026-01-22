// import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGPlaceId } from '../src/index';

// Mock fetch global
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('getGPlaceId', () => {
  const apiKey = 'TEST_API_KEY';

  beforeEach(() => {
    fetchMock.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {}); 
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null for invalid URLs', async () => {
    const result = await getGPlaceId('invalid-url', { apiKey });
    expect(result).toBeNull();
  });

  it('should extract place_id from direct URL parameter', async () => {
    const url = 'https://www.google.com/maps/search/?api=1&query=Centennial+Park&query_place_id=ChIJ3S-JXmauEmsRunMqck0Kd3s';
    const result = await getGPlaceId(url, { apiKey });
    expect(result).toBe('ChIJ3S-JXmauEmsRunMqck0Kd3s');
  });

  it('should handle short URLs (redirect)', async () => {
    // Mock the short URL redirect
    fetchMock.mockResolvedValueOnce({
      url: 'https://www.google.com/maps/place/Some+Place/data=!3m1!4b1!4m6!3m5!1s0x0:0x12345!8m2!3d-33.8!4d151.2?place_id=ChIJ_TEST_ID',
      status: 200,
      json: async () => ({})
    });

    const url = 'https://maps.app.goo.gl/SHORT_CODE';
    // This assumes the short URL resolver sees the redirect URL in response.url
    // Our implementation uses HEAD request response.url
    
    // Actually, our implementation does:
    // fetch(url, { redirect: 'follow' }) -> returns response.url
    
    // We need to verify if the expanded URL has place_id=... it matches directly
    // The implementation of `isShortUrl` checks for maps.app.goo.gl
    // `expandShortUrl` does fetch.

    // Let's refine the mock to return the expanded URL in `response.url`
    const expandedUrl = 'https://www.google.com/maps/place/Testing/@-33.8,151.2,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d-33.8!4d151.2?place_id=ChIJ_EXPANDED_ID';
    
    fetchMock.mockImplementation(async (input) => {
      if (input.toString().includes('maps.app.goo.gl')) {
        return {
          url: expandedUrl,
          status: 200,
          json: async () => ({})
        } as Response;
      }
      return {
        json: async () => ({})
      } as Response;
    });

    const result = await getGPlaceId(url, { apiKey });
    expect(result).toBe('ChIJ_TEST_ID');
  });

  it('should handle regular URLs with coordinates and text search logic', async () => {
    const url = 'https://www.google.com/maps/place/My+Restaurant/@-33.867,151.206,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d-33.867!4d151.206';
    
    // Mock the text search API response
    const mockSearchResponse = {
      results: [
        {
          name: 'My Restaurant',
          place_id: 'ChIJ_COORDS_MATCH',
          geometry: {
            location: {
              lat: -33.867,
              lng: 151.206
            }
          }
        }
      ],
      status: 'OK'
    };

    fetchMock.mockImplementation(async (input) => {
      if (input.toString().includes('place/textsearch/json')) {
        return {
          ok: true,
          json: async () => mockSearchResponse
        } as Response;
      }
      return { url: input } as Response;
    });

    const result = await getGPlaceId(url, { apiKey });
    expect(result).toBe('ChIJ_COORDS_MATCH');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('place/textsearch/json'));
  });

    it('should handle regular URLs with text search fallback (no coords)', async () => {
    const url = 'https://www.google.com/maps/place/Some+Place'; 
    // This URL doesn't have !3d...!4d... so it should fall back to findPlaceFromText or similar
    
    // In our implementation:
    // regularResolver -> match /place/([^/?]+) -> "Some Place"
    // check data coords -> None.
    // Fallback -> findPlaceFromText
    
    const mockFindPlaceResponse = {
      candidates: [
        {
          place_id: 'ChIJ_TEXT_MATCH'
        }
      ],
      status: 'OK'
    };

    fetchMock.mockImplementation(async (input) => {
        if (input.toString().includes('place/findplacefromtext/json')) {
             return {
                ok: true,
                json: async () => mockFindPlaceResponse
            } as Response;
        }
        return { url: input } as Response;
    });

    const result = await getGPlaceId(url, { apiKey });
    expect(result).toBe('ChIJ_TEXT_MATCH');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('place/findplacefromtext/json'));
  });
});
