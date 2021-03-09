import React from "react";

import styles from "./doc.module.css";

import PropTypes from "prop-types";
import { withRouter, useHistory } from "react-router-dom";

import { renderMdSmallCard } from "./../markdown/MarkdownRender";
import { smugler } from "./../smugler/api";

import { joinClasses } from "../util/elClass.js";
import { Loader } from "../lib/loader";

import LockedImg from "./../img/locked.png";
import DownloadButtonImg from "./../img/download.png";

import {
  ChunkRender,
  ChunkView,
  parseRawSource,
  createEmptyChunk,
} from "./chunks";

import { mergeChunks, trimChunk, getChunkSize } from "./chunk_util";
import { extractDocAsMarkdown } from "./doc_util.jsx";

import { HoverTooltip } from "./../lib/tooltip";

import { Card, Button, ButtonGroup } from "react-bootstrap";

import { FullCardFootbar } from "./../card/FullCardFootbar";

import moment from "moment";
import axios from "axios";

export class DocRenderImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit_chunk_opts: {
        index: this.isEditingStart() ? 0 : -1,
        begin: 0,
        end: 0,
      },
    };
    this.fetchCancelToken = axios.CancelToken.source();
    this.updateCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
  };

  updateNode = (doc, toIndex, selectionStart) => {
    const length = doc.chunks.length;
    if (toIndex != null) {
      if (length > 0 && toIndex >= length) {
        toIndex = length - 1;
      }
    } else {
      toIndex = -1;
    }
    const editOpts = {
      index: toIndex,
      begin: selectionStart || 0,
      end: selectionStart || 0,
    };
    this.setState({
      edit_chunk_opts: editOpts,
    });
    return this.props.updateNode(doc);
  };

  editChunk = (index, begin, end) => {
    index = index || 0;
    const length = this.props.node.doc.chunks.length;
    if (length > 0 && index >= length) {
      index = length - 1;
    }
    this.setState({
      edit_chunk_opts: {
        index: index,
        begin: begin || 0,
        end: end || 0,
      },
    });
  };

  // Chunks operations:
  // - Save and exit
  // - Go to the chunk above
  // - Go to the chunk below
  // - Split the chunk into two
  // - Merge the chunk with one above
  //
  // Basic opetaions:
  // - Insert
  // - Merge
  // - Go to or exit editing mode

  /**
   * Repace the chunk with index [index] with new chunks
   */
  replaceChunk = (chunks, index, toIndex, selectionStart) => {
    const newChunks = this.props.node.doc.chunks
      .slice(0, index)
      .concat(chunks)
      .concat(this.props.node.doc.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    return this.updateNode(newDoc, toIndex, selectionStart);
  };

  /**
   * Merge the chunk with one above
   */
  mergeChunkUp = (chunk, index, toIndex, selectionStart) => {
    if (index === 0) {
      // Nothing to merge with, just replace the current one
      return this.replaceChunk([chunk], index, toIndex, selectionStart);
    }
    const prevIndex = index - 1;
    const newChunk = mergeChunks(this.props.node.doc.chunks[prevIndex], chunk);
    if (selectionStart !== null && selectionStart < 0) {
      selectionStart = newChunk.source.length + selectionStart;
    }
    const newChunks = this.props.node.doc.chunks
      .slice(0, prevIndex)
      .concat([newChunk])
      .concat(this.props.node.doc.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    return this.updateNode(newDoc, toIndex, selectionStart);
  };

  isEditingStart() {
    return false; // this.props.location.state && this.props.location.state.edit;
  }

  getDocAsMarkdown = () => {
    const md = extractDocAsMarkdown(this.props.node.doc);
    return md;
  };

  makeCardToolbar() {
    return (
      <div className={styles.doc_card_toolbar}>
        <ButtonGroup>
          <HoverTooltip tooltip={"Copy as markdown text"}>
            <Button
              variant="light"
              className={joinClasses(styles.doc_card_toolbar_btn)}
              onClick={this.copyDocAsMarkdown}
            >
              <img
                src={DownloadButtonImg}
                className={styles.doc_card_toolbar_btn_img}
                alt={"Copy as markdown text"}
              />
            </Button>
          </HoverTooltip>
        </ButtonGroup>
      </div>
    );
  }

  render() {
    const footer =
      this.props.node && this.props.node.upd ? (
        <small className="text-muted">
          <i>
            Created {moment(this.props.node.crtd).fromNow()}, updated{" "}
            {moment(this.props.node.upd).fromNow()}
          </i>
        </small>
      ) : null;
    let body = null;
    // if (this.state.crypto && !this.state.crypto.success) {
    //   body = (
    //     <>
    //       <img src={LockedImg} className={styles.locked_img} alt={"locked"} />
    //       Encrypted with an unknown secret:
    //       <code className={styles.locked_secret_id}>
    //         {this.state.crypto.secret_id}
    //       </code>
    //     </>
    //   );
    // } else
    if (this.props.node && this.props.node.doc) {
      const chunks =
        this.props.node.doc.chunks && this.props.node.doc.chunks.length > 0
          ? this.props.node.doc.chunks
          : [createEmptyChunk()];
      const edit_chunk_opts = this.state.edit_chunk_opts;
      body = chunks.map((chunk, index) => {
        if (chunk == null) {
          chunk = createEmptyChunk();
        }
        const key = index.toString();
        const editOpts =
          index === edit_chunk_opts.index ? edit_chunk_opts : null;
        return (
          <ChunkRender
            chunk={chunk}
            key={key}
            nid={this.props.nid}
            index={index}
            replaceChunks={this.replaceChunk}
            mergeChunkUp={this.mergeChunkUp}
            editChunk={this.editChunk}
            editOpts={editOpts}
            account={this.props.account}
          />
        );
      });
    } else {
      // TODO(akindyakov): Add loading animation here
      body = <Loader />;
    }

    const footbar =
      this.props.node && this.props.node.meta ? (
        <FullCardFootbar
          addRef={this.props.addRef}
          nid={this.props.nid}
          meta={this.props.node.meta}
          account={this.props.account}
          stickyEdges={this.props.stickyEdges}
          getMarkdown={this.getDocAsMarkdown}
          reloadNode={this.fetchNode}
        />
      ) : null;
    // {this.makeCardToolbar()}
    return (
      <Card
        className={joinClasses(styles.fluid_container, styles.doc_render_card)}
      >
        <Card.Body className={joinClasses(styles.doc_render_card_body)}>
          {body}
        </Card.Body>
        <footer className="text-right m-2">{footer}</footer>
        {footbar}
      </Card>
    );
  }
}

export const DocRender = withRouter(DocRenderImpl);

const kMaxTrimSmallCardSize = 320;
const kMaxTrimSmallCardChunksNum = 4;

export function SmallCardRender({ nid, doc, trim, ...rest }) {
  var els = [];
  if (doc && doc.chunks) {
    var fullTextSize = 0;
    var chunksNum = 0;
    for (var index in doc.chunks) {
      var chunk = doc.chunks[index] ?? createEmptyChunk();
      const chunkSize = getChunkSize(chunk);
      if (trim && fullTextSize + chunkSize > kMaxTrimSmallCardSize) {
        chunk = trimChunk(chunk, kMaxTrimSmallCardSize - fullTextSize);
      }
      fullTextSize += getChunkSize(chunk);
      chunksNum += 1;
      const key = index.toString();
      els.push(
        <ChunkView
          nid={nid}
          chunk={chunk}
          key={key}
          render={renderMdSmallCard}
        />
      );
      if (
        fullTextSize > kMaxTrimSmallCardSize ||
        chunksNum >= kMaxTrimSmallCardChunksNum
      ) {
        break;
      }
    }
  }
  return <div {...rest}>{els}</div>;
}

export function exctractDoc(source, nid) {
  // TODO(akindyakov): add encryption here - decrypt
  if (typeof source === "object") {
    return source;
  }
  try {
    return JSON.parse(source);
  } catch (e) {
    // console.log("Old style doc without mark up", nid);
  }
  return parseRawSource(source);
}

export function createEmptyDoc() {
  let doc: TDoc = {
    chunks: [],
    encrypted: false,
  };
  return doc;
}
