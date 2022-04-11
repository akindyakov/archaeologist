/** @jsxImportSource @emotion/react */

import React, { useState, useRef } from 'react'
import { Image, ButtonGroup, Modal } from 'react-bootstrap'
import styled from '@emotion/styled'

import { TNode } from 'smuggler-api'
import { MdiFitScreen, MdiZoomIn, MdiZoomOut } from '../MaterialIcons'

import { ImgButton } from '../ImgButton'

const ImageBase = styled(Image)`
  height: auto;
  display: block;
  margin: auto;
`

const ImageInCard = styled(ImageBase)`
  max-width: 100%;
  border-style: none;
  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  cursor: zoom-in;
`

const ImageFull = styled(ImageBase)`
  max-width: 100%;
  vertical-align: middle;
  display: inline;
`

const ZoomImageTitle = styled(Modal.Title)`
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
`

const ImageFullModalBody = styled(Modal.Body)`
  white-space: nowrap;
  text-align: center;
`

const ImageFullHelper = styled.span`
  display: inline-block;
  height: 100%;
  vertical-align: middle;
`

export const ImageNode = ({
  className,
  node,
}: {
  className?: string
  node: TNode
}) => {
  const source = node.getBlobSource()
  const [show, setShow] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)
  const handleZoomIn = () => {
    const current = imageRef?.current
    if (current != null) {
      const newMaxWidth = current.offsetWidth * 1.1
      current.style.maxWidth = `${newMaxWidth}px`
    }
  }

  const handleZoomOut = () => {
    const current = imageRef?.current
    if (current != null) {
      const newMaxWidth = current.offsetWidth * 0.9091
      current.style.maxWidth = `${newMaxWidth}px`
    }
  }

  const handleZoomReset = () => {
    const current = imageRef?.current
    if (current != null) {
      current.style.maxWidth = '100%'
    }
  }

  if (source == null) {
    return null
  }
  return (
    <>
      <ImageInCard
        src={source}
        className={className}
        onClick={() => setShow(true)}
      />
      <Modal show={show} fullscreen scrollable onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <ZoomImageTitle>
            <ButtonGroup>
              <ImgButton onClick={handleZoomOut}>
                <MdiZoomOut
                  css={{ fontSize: '24px', verticalAlign: 'middle' }}
                />
              </ImgButton>
              <ImgButton onClick={handleZoomReset}>
                <MdiFitScreen
                  css={{ fontSize: '24px', verticalAlign: 'middle' }}
                />
              </ImgButton>
              <ImgButton onClick={handleZoomIn}>
                <MdiZoomIn
                  css={{ fontSize: '24px', verticalAlign: 'middle' }}
                />
              </ImgButton>
            </ButtonGroup>
          </ZoomImageTitle>
        </Modal.Header>
        <ImageFullModalBody>
          <ImageFullHelper />
          <ImageFull src={source} ref={imageRef} />
        </ImageFullModalBody>
      </Modal>
    </>
  )
}