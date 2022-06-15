const makeUrl = ({
  pathname,
  query,
}: {
  pathname?: string
  query?: Record<string, string>
}): URL => {
  let url = new URL(process.env.REACT_APP_SMUGGLER_API_URL || '')
  if (pathname != null) {
    url.pathname = pathname
  }
  if (query != null) {
    for (const key in query) {
      url.searchParams.append(key, query[key])
    }
  }
  return url
}

const makeNodeUrl = (nid: string): URL => {
  return makeUrl({ pathname: `/n/${nid}` })
}

const makeSearchUrl = (text: string): URL => {
  return makeUrl({ pathname: '/search', query: { q: text } })
}

export const mazed = {
  makeUrl,
  makeNodeUrl,
  makeSearchUrl,
}
