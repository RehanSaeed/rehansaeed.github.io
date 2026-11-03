export interface PageInfo {
  /** Current one-based page number. */
  currentPage: number;
  /** Total number of available pages. */
  totalPages: number;
  /** Whether a previous page is available. */
  hasPreviousPage: boolean;
  /** Whether a next page is available. */
  hasNextPage: boolean;
}

export function previousUrl(pageInfo: PageInfo, host = "") {
  if (!pageInfo.hasPreviousPage) {
    return undefined;
  }

  if (pageInfo.currentPage == 2) {
    return `${host}/`;
  }

  return `${host}/${pageInfo.currentPage - 1}/`;
}

export function nextUrl(pageInfo: PageInfo, host = "") {
  if (!pageInfo.hasNextPage) {
    return undefined;
  }

  return `${host}/${pageInfo.currentPage + 1}/`;
}
