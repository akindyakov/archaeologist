// @ts-ignore: Do not remove this import, it's somewhat needed for jsdom
import type React from 'react' // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * @jest-environment jsdom
 */
import jsdom from 'jsdom'

import {
  _cureTitle,
  _exctractPageAuthor,
  _exctractPageLanguage,
  _exctractPagePublisher,
  _exctractPageText,
  _exctractPageTitle,
  _exctractYouTubeVideoObjectSchema,
  _extractPageAttributes,
  _extractPageThumbnailUrls,
  _extractPlainTextFromContentHtml,
  _postProcessPagePlainTextSpecialPages,
  exctractPageContent,
} from './webPageContent'

const { JSDOM } = jsdom

test('_exctractPageText - main', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <div>
    <div>
      <main id="content" class="social social-popover">
        <div id="1" class="eng export 1">First and second</div>
        <div id="2" class="eng export 2">Third and forth</div>
      </main>
    </div>
  </div>
</body>
</html>
`)
  const text = _exctractPageText(dom.window.document)
  expect(text).toStrictEqual('First and second Third and forth')
})

test('_exctractPageText - article', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <div>
    <article id="content" class="social social-popover" >
      <p id="1" class="eng export 1">First and second</p>
      <p id="2" class="eng export 2">Third and forth</p>
    </article>
  </div>
</body>
</html>
`)
  const text = _exctractPageText(dom.window.document)
  expect(text).toStrictEqual('First and second Third and forth')
})

test('_exctractPageText - <div role="main">', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <div>
    <div role="main">
      <p id="1" class="eng export 1">First and second</p>
      <p id="2" class="eng export 2">Third and forth</p>
    </div>
  </div>
</body>
</html>
`)
  const text = _exctractPageText(dom.window.document)
  expect(text).toStrictEqual('First and second Third and forth')
})

test('_exctractPageText - nested elements', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <div role="main">
    <div role="article">
      <p id="1" class="eng export 1">First and second</p>
      <p id="2" class="eng export 2">Third and forth</p>
    </div>
  </div>
</body>
</html>
`)
  const text = _exctractPageText(dom.window.document)
  expect(text).toStrictEqual('First and second Third and forth')
})

test('_exctractPageTitle - <title>', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<head>
<title>Correct title</title>
</head>
<body >
  <title>Wrong title</title>
</body>
</html>
`)
  const text = _exctractPageTitle(dom.window.document)
  expect(text).toStrictEqual('Correct title')
})

test('_exctractPageTitle - <meta property="og:title">', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<head>
<meta property="og:title" content="Correct title">
</head>
<body >
</body>
</html>
`)
  const text = _exctractPageTitle(dom.window.document)
  expect(text).toStrictEqual('Correct title')
})

test('_exctractPageAuthor', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<head>
<meta property="author" content="Correct First Author">
<meta property="author" content="Correct Second Author">
</head>
<body >
  <div property="author" content="Wrong Author" />
</body>
</html>
`)
  const author = _exctractPageAuthor(dom.window.document)
  expect(author).toStrictEqual([
    'Correct First Author',
    'Correct Second Author',
  ])
})

test('_exctractPageLanguage', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
</head>
<body >
</body>
</html>
`)
  const lang = _exctractPageLanguage(dom.window.document)
  expect(lang).toStrictEqual('en')
})

test('_exctractPagePublisher', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
<meta property="og:site_name" content="The Publisher \n\n Abc">
</head>
<body >
</body>
</html>
`)
  const head = dom.window.document.getElementsByTagName('head')[0]
  const publisher = _exctractPagePublisher(head)
  expect(publisher).toStrictEqual(['The Publisher Abc'])
})

test('exctractPageContent - main', async () => {
  const originalUrl = 'https://example.org/test.html'
  const origin = 'https://example.org'
  const dom = new JSDOM(
    `<!DOCTYPE html>
<html class="responsive" lang="en">
<head>
  <title>Some title</title>
  <meta property="author" content="Correct First Author">
  <meta property="author" content="Correct Second Author">
  <meta property="og:site_name" content="The Publisher">
  <meta name="twitter:description" content="A JavaScript implementation">
  <link rel="icon" class="js-site-favicon" type="image/svg+xml" href="https://example.com/favicons/favicon-dark.svg">
</head>
<body >
  <div>
    <div>
      <main id="content" class="social social-popover">
        <div id="1" class="eng export 1">First and second</div>
        <div id="2" class="eng export 2">Third and forth</div>
      </main>
    </div>
  </div>
</body>
</html>
`,
    { url: originalUrl }
  )

  const content = exctractPageContent(dom.window.document, origin)
  expect(content.text).toStrictEqual('First and second Third and forth')
  expect(content.url).toStrictEqual(originalUrl)
  expect(content.title).toStrictEqual('Some title')
  expect(content.author).toStrictEqual([
    'Correct First Author',
    'Correct Second Author',
  ])
  expect(content.publisher).toStrictEqual(['The Publisher'])
  expect(content.description).toStrictEqual('A JavaScript implementation')
  expect(content.lang).toStrictEqual('en')
  expect(content.previewImageUrls).toStrictEqual([
    'https://example.com/favicons/favicon-dark.svg',
    'https://example.org/favicon.ico',
  ])
})

const kYoutubeBase = 'https://www.youtube.com'
const kYoutubeUrl = 'https://www.youtube.com/watch?v=AsDabC'
const kYoutubeDom = new JSDOM(
  `<!DOCTYPE html>
<html lang="en">
<head></head>
<body><div>
<ytd-player-microformat-renderer class="style-scope ytd-watch-flexy"><!--css-build:shady--><script type="application/ld+json" id="scriptTag" nonce="SRMkA" class="style-scope ytd-player-microformat-renderer">{"@context":"https://schema.org","@type":"VideoObject","description":"Lorem Ipsum is simply dummy text of the printing and typesetting industry.","duration":"PT6302S","embedUrl":"https://www.youtube.com/embed/WAIcDx8B1_0","interactionCount":"7","name":"Lorem Ipsum","thumbnailUrl":["https://i.ytimg.com/vi/WAIcDx8B1_0/hqdefault.jpg"],"uploadDate":"2021-04-12","genre":"Nonprofits & Activism","author":"Finibus Bonorum et Malorum"}</script></ytd-player-microformat-renderer>
</div></body></html>`,
  { url: kYoutubeUrl }
)
test('YouTube special extractor', () => {
  const videoObject = _exctractYouTubeVideoObjectSchema(
    kYoutubeDom.window.document
  )
  expect(videoObject?.name).toStrictEqual('Lorem Ipsum')
  expect(videoObject?.description).toStrictEqual(
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
  )
  expect(videoObject?.author).toStrictEqual('Finibus Bonorum et Malorum')
  expect(videoObject?.thumbnailUrl).toStrictEqual([
    'https://i.ytimg.com/vi/WAIcDx8B1_0/hqdefault.jpg',
  ])
})

test('YouTube special extractor has a priority', () => {
  let { title, description, lang, author, publisher, thumbnailUrls } =
    _extractPageAttributes(kYoutubeDom.window.document, kYoutubeBase)
  expect(title).toStrictEqual('Lorem Ipsum')
  expect(description).toStrictEqual(
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
  )
  expect(author).toStrictEqual(['Finibus Bonorum et Malorum'])
  expect(lang).toStrictEqual('en')
  expect(publisher).toStrictEqual(['YouTube'])
  expect(thumbnailUrls).toStrictEqual([
    'https://i.ytimg.com/vi/WAIcDx8B1_0/hqdefault.jpg',
    `${kYoutubeBase}/favicon.ico`,
  ])
})

test('_extractPageThumbnailUrls', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="shortcut icon" href="https://www.youtube.com/s/e69b/img/favicon.ico" type="image/x-icon">
<meta property="og:image" content="https://og.ytimg.com/vi/p3bdV/og.jpg">
<meta name="twitter:image" content="https://twitter.ytimg.com/vi/kKGRQ/twitter.jpg">
<meta name="vk:image" content="https://vk.ytimg.com/vi/ddd/vk.jpg">
<link rel="apple-touch-icon" href="/apple-touch-icon-1024.png">
<link rel="image_src" href="https://abc.abc/images/007/qOoFNK6Z7.png">
<link itemprop="thumbnailUrl" href="https://thumb.ytimg.com/vi/RQ/df.jpg">
</head>
<body >
</body>
</html>
`)
  const refs = _extractPageThumbnailUrls(
    dom.window.document,
    'https://base.ytimg.com'
  )
  // Order of elements does mater here, the best options come first.
  expect(refs).toStrictEqual([
    'https://og.ytimg.com/vi/p3bdV/og.jpg',
    'https://twitter.ytimg.com/vi/kKGRQ/twitter.jpg',
    'https://vk.ytimg.com/vi/ddd/vk.jpg',
    'https://abc.abc/images/007/qOoFNK6Z7.png',
    'https://thumb.ytimg.com/vi/RQ/df.jpg',
    'https://base.ytimg.com/apple-touch-icon-1024.png',
    'https://www.youtube.com/s/e69b/img/favicon.ico',
    'https://base.ytimg.com/favicon.ico',
  ])
})

test('_cureTitle', () => {
  expect(
    _cureTitle(
      '☕ Checkmate - x926453253@gmail.com - Gmail',
      'https://mail.google.com/mail/u/0/'
    )
  ).toStrictEqual('☕ Checkmate - x926453253@gmail.com')
})

test('_extractPlainTextFromContentHtml - put extra dot after header and table rows', () => {
  expect(
    _extractPlainTextFromContentHtml(
      '<div><h2>From the Crew</h2><h3> </h3><h3></h3><p>Just one extra message</p></div>',
      '',
      'https://example.com'
    )
  ).toStrictEqual('From the Crew. Just one extra message')
  expect(
    _extractPlainTextFromContentHtml(
      `<table><tbody>
        <tr><td>Born</td><td>15 March 1813</td></tr>
        <tr></tr>
        <tr><td>Alma mater</td><td>	University of London (MD)</td></tr>
      </tbody></table>
      `,
      '',
      'https://example.com'
    )
  ).toStrictEqual('Born 15 March 1813. Alma mater University of London (MD).')
})
test('_postProcessPagePlainTextSpecialPages', () => {
  expect(
    _postProcessPagePlainTextSpecialPages(
      'New Guinea, to Hainan.[2]',
      'https://en.exsmple.com'
    )
  ).toStrictEqual('New Guinea, to Hainan.[2]')
  expect(
    _postProcessPagePlainTextSpecialPages(
      '[edit] the former Australian territory of New Guinea, to Hainan.[2] The sinking',
      'https://en.wikipedia.org/wiki/Montevideo'
    )
  ).toStrictEqual(
    '[edit] the former Australian territory of New Guinea, to Hainan. The sinking'
  )
})
