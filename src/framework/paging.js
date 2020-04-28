export function previousUrl(pageInfo, host = '') {
  if (!pageInfo.hasPreviousPage) {
    return undefined;
  }

  if (pageInfo.currentPage == 2) {
    return `${host}/`;
  }

  return `${host}/${pageInfo.currentPage - 1}/`;
}

export function nextUrl(pageInfo, host = '') {
  if (!pageInfo.hasNextPage) {
    return undefined;
  }

  return `${host}/${pageInfo.currentPage + 1}/`;
}
