import { Descendant } from 'slate'
import { serialize } from 'remark-slate'
import unified from 'unified'
import markdown from 'remark-parse'
import slate from 'remark-slate'
import { defaultNodeTypes } from 'remark-slate'

import moment from 'moment'

import {
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeDeleteMark,
  kSlateBlockTypeEmphasisMark,
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeInlineCodeMark,
  kSlateBlockTypeLink,
  kSlateBlockTypeImage,
  kSlateBlockTypeListItem,
  kSlateBlockTypeListCheckItem,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeStrongMark,
  kSlateBlockTypeUnorderedList,
} from '../doc/types'

import { debug } from '../util/log'

const lodash = require('lodash')

/**
 * Slate object to Markdown:
 * serialize slate state to a markdown string
 */
export function slateToMarkdown(state: Descendant[]): string {
  state = serializeExtraBlocks(state)
  return state.map((block) => serialize(block)).join('')
}

/**
 * Markdown to Slate object:
 */
export async function markdownToSlate(text: string): Promise<Descendant[]> {
  let { contents } = await unified().use(markdown).use(slate).process(text)
  contents = parseExtraBlocks(contents)
  contents = _moveOutImageBlocks(contents)
  return contents
}

/**
 * Slate blocks
 */

const kMazedBlockTypeToRemarkSlate: Record<string, string> = {
  [kSlateBlockTypeH1]: defaultNodeTypes.heading[1],
  [kSlateBlockTypeH2]: defaultNodeTypes.heading[2],
  [kSlateBlockTypeH3]: defaultNodeTypes.heading[3],
  [kSlateBlockTypeH4]: defaultNodeTypes.heading[4],
  [kSlateBlockTypeH5]: defaultNodeTypes.heading[5],
  [kSlateBlockTypeH6]: defaultNodeTypes.heading[6],
  [kSlateBlockTypeBreak]: defaultNodeTypes.thematic_break,
  [kSlateBlockTypeCode]: defaultNodeTypes.code_block,
  [kSlateBlockTypeOrderedList]: defaultNodeTypes.ol_list,
  [kSlateBlockTypeParagraph]: defaultNodeTypes.paragraph,
  [kSlateBlockTypeQuote]: defaultNodeTypes.block_quote,
  [kSlateBlockTypeUnorderedList]: defaultNodeTypes.ul_list,
  [kSlateBlockTypeListItem]: defaultNodeTypes.listItem,
  [kSlateBlockTypeLink]: defaultNodeTypes.link,
  [kSlateBlockTypeImage]: defaultNodeTypes.image,
  [kSlateBlockTypeEmphasisMark]: defaultNodeTypes.italic,
  [kSlateBlockTypeStrongMark]: defaultNodeTypes.bold,
  [kSlateBlockTypeDeleteMark]: defaultNodeTypes.strikeThrough,
  [kSlateBlockTypeInlineCodeMark]: defaultNodeTypes.code,
}
const kRemarkSlateBlockTypeToMazed: Record<string, string> = lodash.invert(
  kMazedBlockTypeToRemarkSlate
)

function _mazedBlockTypeToRemarkSlate(type: string): string {
  return kMazedBlockTypeToRemarkSlate[type] || defaultNodeTypes.paragraph
}

function _remarkSlateBlockTypeToMazed(type: string): string {
  return kRemarkSlateBlockTypeToMazed[type] || kSlateBlockTypeParagraph
}

/**
 * Implemtations
 * not to be exported
 */
function parseExtraBlocks(content: Descendant[]): Descendant[] {
  return content.map((item: Descendant) => {
    let { type } = item
    if (type) {
      type = _remarkSlateBlockTypeToMazed(type)
      item.type = type
    }
    switch (type) {
      case kSlateBlockTypeListItem:
        item = parseListItem(item)
        break
      case kSlateBlockTypeLink:
        item = parseLinkExtraSyntax(item)
        break
    }
    const { children } = item
    if (children) {
      item.children = parseExtraBlocks(children)
    }
    return item
  })
}

function parseListItem(item: Descendant): Descendant {
  const children: Descendant[] = flattenDescendants(item.children || [])
  const first: Descendant = lodash.head(children)
  if (first) {
    const { text, type } = first
    if (text && lodash.isUndefined(type)) {
      const prefix: string = text.slice(0, 4).toLowerCase()
      const isChecked: boolean = prefix === '[x] '
      const isNotChecked: boolean = prefix === '[ ] '
      if (isChecked || isNotChecked) {
        children[0].text = text.slice(4)
        item.type = kSlateBlockTypeListCheckItem
        item.checked = isChecked
      }
    }
  }
  item.children = children
  return item
}

/**
 * Make sure there is no nested elements
 */
const _kSlateBlocksToFlatten = new Set([
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeUnorderedList,
])

function flattenDescendants(elements: Descendant[]): Descendant[] {
  let flattened: Descendant[] = []
  elements.forEach((item: Descendant) => {
    const { type, children, text } = item
    if (_kSlateBlocksToFlatten.has(type)) {
      flattened = lodash.concat(flattened, flattenDescendants(children || []))
    } else {
      flattened.push(item)
    }
  })
  return flattened
}

function parseLinkExtraSyntax(item: Descendant): Descendant {
  let { link, children } = item
  const dtParts = link.match(/^@(-?[0-9]+)\/?(.*)/)
  if (dtParts) {
    // Arguably unix timestamp (signed)
    const timestamp = parseInt(dtParts[1], 10)
    if (isNaN(timestamp)) {
      return item
    }
    let format = dtParts[2]
    // Backward compatibility
    if (format === 'day') {
      format = 'YYYY MMMM DD, dddd'
    } else if (format === 'time') {
      format = 'YYYY MMMM DD, hh:mm:ss'
    }
    format = 'YYYY MMMM DD, dddd, hh:mm'
    const text = moment.unix(timestamp).format(format)
    children = [{ text }]
    return {
      children,
      format,
      timestamp,
      type: kSlateBlockTypeDateTime,
    }
  }
  return item
}

export function _moveOutImageBlocks(contents: Descendant[]): Descendant[] {
  const newContents: Descendant[] = []
  contents.forEach((item) => {
    const { children } = item
    if (lodash.isArray(children)) {
      const [images, newChildren] = _moveOutImageBlocksRec(children)
      newContents.push(...images)
      item.children = newChildren
    }
    newContents.push(item)
  })
  return newContents
}

export function _moveOutImageBlocksRec(
  content: Descendant[]
): [Descendant[], Descendant[]] {
  const images: Descendant[] = []
  content = content
    .map((item: Descendant) => {
      const { type, children } = item
      if (type === kSlateBlockTypeImage) {
        images.push(item)
        return null
      }
      if (children) {
        const [itemImages, itemChildren] = _moveOutImageBlocksRec(children)
        images.push(...itemImages)
        item.children = itemChildren
      }
      return item
    })
    .filter((item) => !lodash.isNull(item))
  return [images, content]
}

function serializeExtraBlocks(children: Descendant): Descendant {
  return children.map((item: Descendant) => {
    switch (item.type) {
      case kSlateBlockTypeListCheckItem:
        item = serializeExtraListCheckItem(item)
        break
      case kSlateBlockTypeDateTime:
        item = serializeExtraDateTime(item)
        break
    }
    const { children, type } = item
    if (children) {
      item.children = serializeExtraBlocks(children)
    }
    if (type) {
      item.type = _mazedBlockTypeToRemarkSlate(type)
    }
    return item
  })
}

function serializeExtraListCheckItem(item: Descendant): Descendant {
  const { children, checked } = item
  const prefix = checked ? '[x] ' : '[ ] '
  const first: Descendant = lodash.head(children || [])
  if (first && first.text) {
    let { text } = first
    text = prefix + first.text
    children[0] = { ...first, text }
  } else {
    children.unshift({
      text: `${prefix} `,
    })
  }
  return {
    type: kSlateBlockTypeListItem,
    children: [
      {
        type: kSlateBlockTypeParagraph,
        children,
      },
    ],
  }
}

function serializeExtraDateTime(item: Descendant): Descendant {
  let { children, format, timestamp } = item
  format = format || 'YYYY MMMM DD, dddd, hh:mm:ss'
  const date = moment.unix(timestamp)
  const text = date.format(format)
  return { text, children }
}
