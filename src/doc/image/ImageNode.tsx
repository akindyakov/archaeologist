import React, { useState, useCallback, useMemo, useEffect } from 'react'

import { Image, Button, ButtonGroup, Modal } from 'react-bootstrap'

import { ImgButton } from '../../lib/ImgButton'

import { jcss } from '../../util/jcss'
import { debug } from '../../util/log'

import ZoomInImg from '../../img/zoom-in-strip.svg'
import ZoomOutImg from '../../img/zoom-out-strip.svg'
import ZoomResetImg from '../../img/zoom-reset-strip.svg'

import styles from './ImageNode.module.css'

export const ImageNode = ({ className, nid, data }) => {
  const source = data.getBlobSource(nid)
  const [show, setShow] = useState(false)

  let imageRef
  const setImageRef = (element) => {
    imageRef = element
  }

  const handleZoomIn = () => {
    if (imageRef) {
      const newMaxWidth = imageRef.offsetWidth * 1.1
      imageRef.style.maxWidth = `${newMaxWidth}px`
    }
  }

  const handleZoomOut = () => {
    if (imageRef) {
      const newMaxWidth = imageRef.offsetWidth * 0.9091
      imageRef.style.maxWidth = `${newMaxWidth}px`
    }
  }

  const handleZoomReset = () => {
    if (imageRef) {
      imageRef.style.maxWidth = '100%'
    }
  }

  return (
    <div className={className}>
      <Image
        src={source}
        className={jcss(styles.image, styles.image_in_card)}
        ref={setImageRef}
      />
      <div className={styles.buttons_under_image}>
        <ImgButton onClick={() => setShow(true)}>
          <img
            src={ZoomInImg}
            className={styles.zoom_button_image}
            alt="Zoom image"
          />
        </ImgButton>
      </div>
      <Modal
        show={show}
        fullscreen
        scrollable
        size={'xl'}
        onHide={() => setShow(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title className={styles.zoom_image_title}>
            <ButtonGroup className={styles.zoom_button_group}>
              <ImgButton onClick={handleZoomOut}>
                <img
                  src={ZoomOutImg}
                  className={styles.zoom_button_image}
                  alt="Zoom out image"
                />
              </ImgButton>
              <ImgButton onClick={handleZoomReset}>
                <img
                  src={ZoomResetImg}
                  className={styles.zoom_button_image}
                  alt="Reset image zoom"
                />
              </ImgButton>
              <ImgButton onClick={handleZoomIn}>
                <img
                  src={ZoomInImg}
                  className={styles.zoom_button_image}
                  alt="Zoom in image"
                />
              </ImgButton>
            </ButtonGroup>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.image_full_modal_body}>
          <span className={styles.image_full_helper} />
          <Image
            src={source}
            className={jcss(styles.image, styles.image_full)}
            ref={setImageRef}
          />
        </Modal.Body>
      </Modal>
    </div>
  )
}
