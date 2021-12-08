import React from 'react'

import { jcss } from 'elementary'

import styles from './SmallCard.module.css'

function getShadowStyle(n: number) {
  switch (Math.max(0, n) /* treat negative numbers as 0 */) {
    case 0:
      return styles.small_card_shadow_0
    case 1:
      return styles.small_card_shadow_1
    case 2:
      return styles.small_card_shadow_2
    case 3:
      return styles.small_card_shadow_3
    case 4:
      return styles.small_card_shadow_4
    default:
      break
  }
  return styles.small_card_shadow_5
}

type SmallCardProps = React.PropsWithChildren<{
  onClick?: React.MouseEventHandler
  className: string
  stack_size?: number
}>

export const SmallCard = React.forwardRef<HTMLDivElement, SmallCardProps>(
  (
    {
      children,
      className,
      onClick,
      stack_size,
      // https://github.com/react-bootstrap/react-bootstrap/issues/3595
      // @ts-ignore: Property 'as' does not exist on type 'PropsWithChildren<...>'
      as: Component = 'div',
      ...kwargs
    },
    ref
  ) => {
    let clickableOnClick = null
    let clickableStyle = undefined
    if (onClick) {
      clickableStyle = styles.clickable_chunks
      clickableOnClick = onClick
    }
    const shadowStyle = getShadowStyle(stack_size || 0)
    return (
      <Component
        className={jcss(
          styles.small_card,
          clickableStyle,
          shadowStyle,
          className
        )}
        ref={ref}
        onClick={clickableOnClick}
        {...kwargs}
      >
        {children}
      </Component>
    )
  }
)

export default SmallCard
