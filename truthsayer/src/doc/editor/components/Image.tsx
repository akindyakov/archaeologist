import React from 'react'

import { useSelected, useFocused } from 'slate-react'

import { jcss } from '../../../util/jcss'

import './components.css'

import styles from './Image.module.css'

import { debug } from '../../../util/log'

export const Image = React.forwardRef(
  ({ attributes, children, element }, ref) => {
    let { link, url } = element
    url = url || link
    let className = styles.image
    const selected = useSelected()
    const focused = useFocused()
    if (selected && focused) {
      className = jcss(className, styles.image_selected)
    }
    return (
      <div {...attributes}>
        <div contentEditable={false}>
          <img src={url} className={className} ref={ref} />
        </div>
        {children}
      </div>
    )
  }
)