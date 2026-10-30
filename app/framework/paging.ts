export interface PageInfo {
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
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
