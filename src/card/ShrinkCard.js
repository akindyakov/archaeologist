import React from 'react'

import styles from './ShrinkCard.module.css'

import { jcss } from './../util/jcss'

/**
 * +-------------------+
 * | Card outstyle     |
 * |+-----------------+|
 * || ShrinkCard      ||
 * ||+---------------+||
 * ||| Document card |||
 * |||               |||
 * ||+---------------+||
 * |+-----------------+|
 * +-------------------+
 */

export const XxsCard = React.forwardRef(({ children }, ref) => {
  return (
    <div className={jcss(styles.card_xxs, styles.shrinkable)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
})

export const XsCard = React.forwardRef(({ children }, ref) => {
  return (
    <div className={jcss(styles.card_xs, styles.shrinkable)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
})

export const SCard = React.forwardRef(({ children }, ref) => {
  return (
    <div className={jcss(styles.card_s, styles.shrinkable)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
})

const SeeMoreButton = React.forwardRef(
  ({ onClick, className, disabled, on }, ref) => {
    return (
      <div
        className={jcss(styles.a_see_more, className)}
        ref={ref}
        onClick={onClick}
        disabled={disabled}
      >
        {on ? 'See less' : 'See more'}
      </div>
    )
  }
)

export class ShrinkCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      opened: false,
    }
  }

  toggleMoreLess = () => {
    this.setState({
      opened: !this.state.opened,
    })
  }

  render() {
    const shrinkStyle = this.state.opened
      ? styles.everything_xxs
      : styles.card_xxs
    return (
      <>
        <div className={jcss(styles.shrinkable, shrinkStyle)}>
          {this.props.children}
          <div className={styles.fade} />
        </div>
        <SeeMoreButton onClick={this.toggleMoreLess} on={this.state.opened} />
      </>
    )
  }
}
