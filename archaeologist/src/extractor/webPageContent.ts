/**
 * To avoid extracting all visible text from web page we are looking for
 * the special signs in HTML to find page main content in following order:
 *   - Tag: `main`, `article`.
 *   - Element class: `content`, `main`.
 *   - ARIA element role: `article`, `main`.
 *
 *  Extract page meta information:
 *   - head.title : innerText
 *   - head.meta[property="author"] : [content]
 *   - head.meta[name="description"] : [content]
 */

import lodash from 'lodash'

import { PreviewImageSmall } from 'smuggler-api'

import { Readability as MozillaReadability } from '@mozilla/readability'

import { MimeType, Mime, log, isAbortError, stabiliseUrl } from 'armoury'

async function fetchImagePreviewAsBase64(
  url: string,
  document_: Document,
  dstSquareSize: number
): Promise<PreviewImageSmall | null> {
  console.log('fetchImagePreviewAsBase64', url)
  // Load the image
  return new Promise((resolve, reject) => {
    const image = document_.createElement('img')
    if (process.env.CHROME) {
      image.setAttribute('crossorigin', 'anonymous')
    }
    image.onerror = reject
    image.onload = (_ev) => {
      console.log('fetchImagePreviewAsBase64 image.onload', _ev)
      // Crop image, getting the biggest square from the center
      // and resize it down to [dstSquareSize] - we don't need more for preview
      const { width, height } = image
      const toCut = Math.floor((width - height) / 2)
      const srcDeltaX = toCut > 0 ? toCut : 0
      const srcDeltaY = toCut < 0 ? -toCut : 0
      const srcSquareSize = Math.min(width, height)
      const canvas = document_.createElement('canvas')
      canvas.width = dstSquareSize
      canvas.height = dstSquareSize
      canvas.getContext('2d')?.drawImage(
        image,
        srcDeltaX,
        srcDeltaY,
        srcSquareSize,
        srcSquareSize,
        0, // dstDeltaX
        0, // dstDeltaY
        dstSquareSize,
        dstSquareSize
      )
      const content_type = Mime.IMAGE_JPEG
      try {
        const data = canvas.toDataURL(content_type)
        resolve(data ? { data, content_type } : null)
      } catch (err) {
        if (!isAbortError(err)) {
          log.exception(err)
        }
      }
    }
    image.src = url
  })
}

export interface WebPageContentImage {
  content_type: MimeType
  data: string // Base64 encoded image
}

export interface WebPageContent {
  url: string
  title: string | null
  description: string | null
  lang: string | null
  author: string[]
  publisher: string[]
  text: string | null
  image: PreviewImageSmall | null
}

export function exctractPageUrl(document_: Document): string {
  return document_.URL || document_.documentURI
}

export async function exctractPageContent(
  document_: Document,
  baseURL: string
): Promise<WebPageContent> {
  const url = stabiliseUrl(document_.URL || document_.documentURI)
  const head = document_.head
  const body = document_.body

  // The parse() method of @mozilla/readability works by modifying the DOM. This
  // removes some elements in the web page. We avoid this by passing the clone
  // of the document object to the Readability constructor.
  const article = new MozillaReadability(
    document_.cloneNode(true) as Document,
    {
      keepClasses: false,
    }
  ).parse()

  let title: string | null = null
  let text: string | null = null
  let description: string | null = null
  const author: string[] = []
  const publisher: string[] = []
  const lang = _exctractPageLanguage(document_)

  if (article) {
    // Do a best effort with what @mozilla/readability gives us here
    title = article.title
    const { textContent, excerpt, byline, siteName } = article
    text = _stripWhitespaceInText(textContent)
    description = excerpt
    if (byline) {
      author.push(_stripWhitespaceInText(byline))
    }
    if (siteName) {
      publisher.push(siteName)
    }
  }
  if (title) {
    title = _stripWhitespaceInText(title)
  } else {
    title = head ? _exctractPageTitle(head) : null
  }
  if (description) {
    description = _stripWhitespaceInText(description)
  } else {
    description = head ? _exctractPageDescription(head) : null
  }
  if (text == null) {
    text = body ? _exctractPageText(body) : null
  }
  if (text != null) {
    // Cut string by length 10KiB to avoid blowing up backend with huge JSON.
    // Later on we can and perhaps should reconsider this limit.
    text = text.substr(0, 10240)
  }
  if (author.length === 0 && head) {
    author.push(..._exctractPageAuthor(head))
  }
  return {
    url,
    title,
    author,
    publisher,
    description,
    lang,
    text,
    image: await _exctractPageImage(document_, baseURL),
  }
}

const isSameOrDescendant = function (parent: Element, child: Element) {
  if (parent === child) {
    return true
  }
  let node = child.parentNode
  while (node) {
    if (node === parent) {
      return true
    }
    // Traverse up to the parent
    node = node.parentNode
  }
  // Go up until the root but couldn't find the `parent`
  return false
}

// Strip whitespace characters at the beginning and the end of the text, also
// replace any consecutive row of whitespace characters with a single space.
export function _stripWhitespaceInText(text: string): string {
  text = text.trim()
  text = text.replace(/[\u00B6\u2202\s]{2,}/g, ' ')
  return text
}

/**
 * To avoid extracting all visible text from web page we are looking for
 * the special signs in HTML to find page main content in following order:
 *   - Tag: `main`, `article`.
 *   - ARIA element role: `article`, `main`.
 *   - ? Element class: `content`, `main`
 */
export function _exctractPageText(body: HTMLElement): string {
  const ret: string[] = []
  const addedElements: Element[] = []
  for (const elementsGroup of [
    body.getElementsByTagName('article'),
    body.getElementsByTagName('main'),
  ]) {
    for (const element of elementsGroup) {
      const textContent = (element.innerText || element.textContent)?.trim()
      if (!textContent) {
        // Skip empty text content
        continue
      }
      // If any of found elements is a child to one of added - skip it,
      // because we already added text from it with parent textContent
      const isAdded = addedElements.find((addedEl) => {
        return isSameOrDescendant(addedEl, element)
      })
      if (isAdded) {
        continue
      }
      ret.push(_stripWhitespaceInText(textContent))
      addedElements.push(element)
    }
  }
  if (ret.length > 0) {
    return ret.join(' ')
  }
  for (const elementsGroup of [
    body.querySelectorAll('[role="main"]'),
    body.querySelectorAll('[role="article"]'),
    body.querySelectorAll('[role="presentation"]'),
    body.getElementsByClassName('post-header'),
    body.getElementsByClassName('post-content'),
  ]) {
    for (const element of elementsGroup) {
      const textContent = element.textContent?.trim()
      if (!textContent) {
        continue
      }
      const isAdded = addedElements.find((addedEl) => {
        return isSameOrDescendant(addedEl, element)
      })
      if (isAdded) {
        continue
      }
      ret.push(_stripWhitespaceInText(textContent))
      addedElements.push(element)
    }
  }
  return ret.join(' ')
}

/**
 * Extract pate title defined within <head>
 *
 * Possible options:
 * - <head><title>Page title</title></head>
 * - <meta name="twitter:title" content="Page title">
 * - <meta property="og:title" content="Page title">
 */
export function _exctractPageTitle(head: HTMLHeadElement): string | null {
  const headTitles = head.getElementsByTagName('title')
  if (headTitles.length > 0) {
    for (const element of headTitles) {
      const title = (element.innerText || element.textContent)?.trim()
      if (title) {
        return _stripWhitespaceInText(title)
      }
    }
  }
  // Last resort
  for (const elementsGroup of [
    head.querySelectorAll('meta[property="og:title"]'),
    head.querySelectorAll('meta[property="twitter:title"]'),
  ]) {
    for (const element of elementsGroup) {
      const title = element.getAttribute('content')?.trim()
      if (title) {
        return _stripWhitespaceInText(title)
      }
    }
  }
  return null
}

export function _exctractPageAuthor(head: HTMLHeadElement): string[] {
  const authors: string[] = []
  for (const elementsGroup of [
    head.querySelectorAll('meta[property="author"]'),
  ]) {
    for (const element of elementsGroup) {
      const title = element.getAttribute('content')?.trim()
      if (title) {
        authors.push(_stripWhitespaceInText(title))
      }
    }
  }
  return authors
}

export function _exctractPageDescription(head: HTMLHeadElement): string | null {
  for (const elementsGroup of [
    head.querySelectorAll('meta[name="description"]'),
    head.querySelectorAll('meta[property="og:description"]'),
    head.querySelectorAll('meta[name="twitter:description"]'),
  ]) {
    for (const element of elementsGroup) {
      const title = element.getAttribute('content')?.trim()
      if (title) {
        return _stripWhitespaceInText(title)
      }
    }
  }
  return null
}

export function _exctractPageLanguage(document_: Document): string | null {
  const html = lodash.head(document_.getElementsByTagName('html'))
  if (html) {
    return html.lang || html.getAttribute('lang') || null
  }
  return null
}

export function _exctractPagePublisher(head: HTMLHeadElement): string[] {
  const publisher: string[] = []
  for (const elementsGroup of [
    head.querySelectorAll('meta[property="og:site_name"]'),
    head.querySelectorAll('meta[property="article:publisher"]'),
    head.querySelectorAll('meta[name="apple-mobile-web-app-title"]'),
  ]) {
    for (const element of elementsGroup) {
      const p = element.getAttribute('content')?.trim()
      if (p) {
        publisher.push(_stripWhitespaceInText(p))
      }
    }
    if (publisher.length > 0) {
      break
    }
  }
  return publisher
}

function ensureAbsRef(ref: string, baseURL: string): string {
  if (ref.startsWith('/')) {
    return `${baseURL}${ref}`
  }
  return ref
}

export async function _exctractPageImage(
  document_: Document,
  baseURL: string
): Promise<WebPageContentImage | null> {
  const head = document_.head
  let favicon = null
  let og = null
  if (head == null) {
    return null
  }
  for (const elementsGroup of [
    head.querySelectorAll('meta[property="og:image"]'),
    head.querySelectorAll('meta[name="twitter:image"]'),
  ]) {
    for (const element of elementsGroup) {
      const ref = element.getAttribute('content')?.trim()
      if (ref) {
        og = ensureAbsRef(ref, baseURL)
        break
      }
    }
    if (og !== null) {
      break
    }
  }
  for (const element of head.querySelectorAll('link[rel="icon"]')) {
    const ref = element.getAttribute('href')?.trim()
    if (ref) {
      favicon = ensureAbsRef(ref, baseURL)
      break
    }
  }
  const icon = og
    ? await fetchImagePreviewAsBase64(og, document_, 240)
    : favicon
    ? await fetchImagePreviewAsBase64(favicon, document_, 240)
    : null
  return icon ? icon : null
}