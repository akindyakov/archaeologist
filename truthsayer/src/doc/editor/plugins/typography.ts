import { Editor, Element, Transforms, Path, Node } from 'slate'

import {
  kSlateBlockTypeBreak,
  kSlateBlockTypeImage,
  kSlateBlockTypeParagraph,
  isHeaderSlateBlock,
} from '../../types'
import { makeParagraph } from '../../doc_util'

import { debug } from '../../../util/log'
import { CustomEditor, CustomElement } from '../../types'

const lodash = require('lodash')

const TYPES_NOT_TO_BE_LAST = new Set([
  kSlateBlockTypeBreak,
  kSlateBlockTypeImage,
])

function pathsEqual(lhs: Path | undefined, rhs: Path | undefined): boolean {
  if (lhs === undefined || rhs === undefined) {
    return false
  }
  return Path.equals(lhs, rhs)
}

function elementAtCurrentFocus(
  editor: CustomEditor
): [CustomElement, Path] | undefined {
  for (const [node, path] of Editor.levels(editor, {
    at: editor.selection?.focus,
    reverse: true,
  })) {
    if (Element.isElement(node)) {
      return [node, path]
    }
  }
  return undefined
}

export const withTypography = (editor: CustomEditor) => {
  const { isVoid, normalizeNode, insertBreak } = editor

  editor.normalizeNode = ([node, path]) => {
    if (path.length === 0) {
      const lastChild = lodash.last(editor.children)
      // Insert empty paragraph at the end, if last child is "void"
      if (editor.isVoid(lastChild)) {
        const at: Path = [editor.children.length]
        const paragraph = makeParagraph([])
        Transforms.insertNodes(editor, paragraph, { at })
      }
    }
    return normalizeNode([node, path])
  }

  editor.isVoid = (element: CustomElement) => {
    return element.type === kSlateBlockTypeBreak ? true : isVoid(element)
  }

  editor.insertBreak = () => {
    const elementEntryBeforeBreak: [CustomElement, Path] | undefined =
      elementAtCurrentFocus(editor)

    insertBreak()

    if (
      elementEntryBeforeBreak &&
      isHeaderSlateBlock(elementEntryBeforeBreak[0])
    ) {
      // insertBreak() adds a new node and sets selection to its start
      // and Transforms.setNodes() by default works on the currently selected
      // node
      Transforms.setNodes(
        editor,
        { type: kSlateBlockTypeParagraph },
        { match: (node: Node) => Element.isElement(node) }
      )
    }
  }

  return editor
}