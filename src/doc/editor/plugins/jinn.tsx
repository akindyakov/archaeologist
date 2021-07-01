import React from 'react'

import {
  Editable,
  ReactEditor,
  Slate,
  useReadOnly,
  useSlateStatic,
  withReact,
} from 'slate-react'
import {
  Descendant,
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
  createEditor,
} from 'slate'

import { debug } from '../../../util/log'
import { Optional } from '../../../util/types'

import { Modal, Form, ListGroup } from 'react-bootstrap'

import { SearchGrid } from '../../../grid/SearchGrid'

import { makeLink, exctractDocTitle, getDocSlate } from '../../doc_util'

import { dateTimeJinnSearch } from './jinn-datetime'

import styles from './jinn.module.css'

const lodash = require('lodash')

type JinnModalProps = {
  nid: string
  editor: Editor
  selection: Range
  setShow: (show: boolean) => void
}

type JinnModalState = {
  input: string
  q: string
  cursor: number
}

class JinnModal extends React.Component<JinnModalProps, JinnModalState> {
  state: JinnModalState = {
    input: '',
    q: '',
    cursor: 0,
  }

  constructor(props) {
    super(props)
    this.inputRef = React.createRef()
  }

  handleChange = (event) => {
    const { value } = event.target
    this.startSmartSearch.cancel() // Do we need it?
    this.setState(
      {
        input: value,
      },
      () => {
        this.startSmartSearch(value)
      }
    )
  }

  handleSumbit = (event) => {}

  startSmartSearch = lodash.debounce((value) => {
    this.setState({ cards: [], q: value }, () => {
      // if (this.props.suggestNewRef) {
      this.dateTimeSearch(value)
    })
  }, 800)

  componentDidMount() {
    this.inputRef.current.focus()
  }

  dateTimeSearch = async function (value) {
    const { editor, selection, setShow } = this.props
    //* dbg*/ console.log("dateTimeSearch", this.props.nid);
    const item = dateTimeJinnSearch(value, this.props.on_insert)
    if (item != null) {
      this.addCards([item])
    }
  }

  addCards = (cards) => {
    this.setState((state) => {
      return {
        cards: lodash.concat(state.cards, cards),
      }
    })
  }

  onNodeCardClick = (node) => {
    const { nid, doc } = node
    const { editor, selection, setShow } = this.props
    getDocSlate(doc).then((slate) => {
      const title = exctractDocTitle(slate)
      const element = makeLink(title, nid)
      // Delete key '//' first of all
      Transforms.delete(editor, {
        distance: 2,
        unit: 'character',
        reverse: true,
        at: selection,
      })
      const start = Range.start(selection)
      Transforms.insertNodes(editor, element, { at: start })
      setShow(false)
    })
  }

  render() {
    const { q, input, cards } = this.state
    // extCards={this.state.cards}
    return (
      <div className={styles.autocomplete_modal}>
        <Form.Control
          aria-label="Search-to-link"
          aria-describedby="basic-addon1"
          onChange={this.handleChange}
          onSubmit={this.handleSumbit}
          value={input}
          placeholder="Type something"
          ref={this.inputRef}
        />
        <SearchGrid
          q={q}
          defaultSearch={false}
          onCardClick={this.onNodeCardClick}
          portable
        >
          {cards}
        </SearchGrid>
      </div>
    )
  }
}

export const Jinn = ({ show, setShow, nid, editor }) => {
  // Preserve editor selection to pass it to modal
  const { selection } = editor
  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      keyboard
      restoreFocus={false}
      animation={false}
      dialogClassName={''}
      scrollable
      enforceFocus
    >
      <JinnModal
        nid={nid}
        setShow={setShow}
        editor={editor}
        selection={selection}
      />
    </Modal>
  )
}

function movePoint(point: Point, num: number): Optional<Point> {
  const { path, offset } = point
  const newOffset = offset + num
  if (newOffset < 0) {
    return null
  }
  return {
    offset: newOffset,
    path,
  }
}

export const withJinn = (setShowJinn, editor) => {
  const { insertText } = editor

  editor.insertText = (text) => {
    const { selection } = editor
    if (text === '/' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const start = movePoint(anchor, -1)
      if (start) {
        const block = Editor.above(editor, {
          match: (n) => Editor.isBlock(editor, n),
        })
        const path = block ? block[1] : []
        const range = { anchor, focus: start }
        const beforeText = Editor.string(editor, range)
        if (beforeText === '/') {
          setShowJinn(true)
        }
      }
    }
    insertText(text)
  }

  return editor
}
