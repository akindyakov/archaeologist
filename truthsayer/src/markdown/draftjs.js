import moment from 'moment'

import {
  kBlockTypeUnorderedCheckItem,
  kBlockTypeUnorderedItem,
  kEntityImmutable,
  kEntityMutable,
  kEntityTypeImage,
  kEntityTypeLink,
  kEntityTypeTime,
  kBlockTypeHrule,
  generateRandomKey,
  makeLinkEntity,
  makeBlock,
} from './../doc/types'

import {
  markdownToDraft as libMarkdownToDraft,
  draftToMarkdown as libDraftToMarkdown,
} from 'markdown-draft-js'

import lodash from 'lodash'

function mdImageItemToEntity(item) {
  return {
    type: kEntityTypeImage,
    mutability: kEntityImmutable,
    data: {
      src: item.src,
      alt: item.alt,
    },
  }
}

function mdLinkToEntity(item) {
  const href = item.href
  const dtParts = href.match(/^@(-?[0-9]+)\/?(.*)/)
  if (dtParts) {
    const tm = dtParts[1] // Arguably unix timestamp (signed)
    let format = dtParts[2]
    if (format === 'day') {
      format = '"YYYY MMMM DD dddd"'
    }
    return {
      type: kEntityTypeTime,
      mutability: kEntityMutable,
      data: {
        tm,
        format,
      },
    }
  }
  return makeLinkEntity(href)
}

function mdHrToBlock(item) {
  return makeBlock({
    type: kBlockTypeHrule,
  })
}

export function markdownToDraft(source) {
  const rawObject = libMarkdownToDraft(source, {
    blockEntities: {
      image: mdImageItemToEntity,
      link_open: mdLinkToEntity,
    },
    blockTypes: {
      hr: mdHrToBlock,
      // TODO(akindyakov) There is a bugS in "markdown-draft-js" library,
      // basically tables are utterly unsupported there. Skip them for now.
    },
    remarkablePlugins: [],
    remarkablePreset: 'full',
    remarkableOptions: {
      disable: {},
      enable: {},
    },
  })
  rawObject.blocks = rawObject.blocks.map((block) => {
    if (block.type === kBlockTypeUnorderedItem) {
      const prefix = block.text.slice(0, 4).toLowerCase()
      const isChecked = prefix === '[x] '
      const isNotChecked = prefix === '[ ] '
      if (isChecked || isNotChecked) {
        block.type = kBlockTypeUnorderedCheckItem
        block.text = block.text.slice(4)
        block.data = lodash.merge(block.data || {}, {
          checked: isChecked,
        })
      }
    }
    if (block.key == null) {
      block.key = generateRandomKey()
    }
    if (!block.text) {
      block.text = '\n'
    }
    return block
  })
  return rawObject
}

function makeCustomEntityRenders() {
  return {
    [kEntityTypeLink]: {
      open: (entity) => {
        return '['
      },
      close: (entity) => {
        const url =
          (entity.data || {}).url || (entity.data || { href: '' }).href
        return `](${url})`
      },
    },
    [kEntityTypeTime]: {
      open: (entity) => {
        const tmStr = (entity.data || {}).tm
        if (tmStr) {
          const formatStr =
            (entity.data || {}).format || '"YYYY MMMM DD dddd hh:mm"'
          return moment.unix(tmStr).format(formatStr)
        }
      },
      close: (entity) => {
        return ''
      },
    },
    [kEntityTypeImage]: {
      open: (entity) => {
        const src = (entity.data || {}).src
        if (src) {
          const alt = (entity.data || {}).alt || ''
          return `![${alt}](${src})`
        }
        return ''
      },
      close: (entity) => {
        return ''
      },
    },
  }
}

function convertCheckItemsToUnorderedItem(doc) {
  doc.blocks = doc.blocks.map((block) => {
    if (block.type === kBlockTypeUnorderedCheckItem) {
      if (block.data && block.data.checked) {
        block.text = `[x] ${block.text}`
      } else {
        block.text = `[ ] ${block.text}`
      }
      block.type = kBlockTypeUnorderedItem
    }
    return block
  })
  return doc
}

export function draftToMarkdown(doc) {
  doc = convertCheckItemsToUnorderedItem(doc)
  return libDraftToMarkdown(doc, {
    entityItems: makeCustomEntityRenders(),
  })
}