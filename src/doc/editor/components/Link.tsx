import React from 'react'

import { Badge } from 'react-bootstrap'

import moment from 'moment'

import { jcss } from '../../../util/jcss'
import { Optional } from '../../../util/types'
import { debug } from '../../../util/log'

import './components.css'

export const Link = React.forwardRef(
  ({ attributes, children, element }, ref) => {
    let { link, url } = element
    url = url || link
    const className = jcss('doc_block_inline_link', 'doc_block_inline_link_ext')
    return (
      <a ref={ref} href={url} {...attributes} className={className}>
        {children}
      </a>
    )
  }
)