export interface Webmention {
  id: number | string;
  source: string;
  verified_date: string;
  activity: {
    type: string;
    sentence_html?: string;
  };
  data: {
    url: string;
    published?: string | null;
    content?: string;
    author?: {
      name?: string | null;
      photo?: string | null;
    } | null;
  };
}
