export interface GPlaceIdOptions {
  apiKey: string;
}

export type Resolver = (
  url: string,
  options: GPlaceIdOptions
) => Promise<string | null>;
