import React from "react";

import "./FullNodeView.css";

import NodeSmallCard from "./NodeSmallCard";
import { MdCardRender } from "./markdown/MarkdownRender";

import Emoji from "./Emoji";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import remoteErrorHandler from "./remoteErrorHandler";
import AutocompleteWindow from "./smartpoint/AutocompleteWindow";

import { LeftToolBar, RightToolBar } from "./full_node_view/ToolBars.js";
import { MarkdownToolbar } from "./full_node_view/MarkdownToolBar.js";

import {
  Card,
  Button,
  ButtonGroup,
  InputGroup,
  Form,
  Container,
  Row,
  Col,
} from "react-bootstrap";

import axios from "axios";
import moment from "moment";

class RefNodeCardImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      preface: "",
      crtd: moment().unix(),
      upd: moment().unix(),
      is_deleted: false,
      is_sticky: props.is_sticky,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  onHover = () => {
    this.setState({ hover: true });
  };

  offHover = () => {
    this.setState({ hover: false });
  };

  handleRefCutOff = () => {
    var to_nid = this.props.to_nid != null ? this.props.to_nid : this.props.nid;
    var from_nid =
      this.props.from_nid != null ? this.props.from_nid : this.props.nid;
    const req = {
      from: from_nid,
    };
    axios
      .delete("/api/node/" + to_nid + "/to", {
        cancelToken: this.fetchCancelToken.token,
        data: req,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({ is_deleted: true });
        }
      });
  };

  handleToggleStickiness = () => {
    this.setState((state) => {
      return { is_sticky: !state.is_sticky };
    });
  };

  render() {
    if (this.state.is_deleted) {
      return <></>;
    }
    var toolbar;
    if (this.state.hover) {
      const stickinessEl = this.state.is_sticky ? (
        <Emoji symbol="🔒" label="lock" />
      ) : (
        <Emoji symbol="🔓" label="unlock" />
      );
      toolbar = (
        <ButtonGroup>
          <Button variant="outline-dark" onClick={this.handleRefCutOff}>
            <Emoji symbol="✂" label="cut off" />
          </Button>
          <Button variant="outline-dark" onClick={this.handleToggleStickiness}>
            {stickinessEl}
          </Button>
        </ButtonGroup>
      );
    }
    return (
      <div
        className="meta-fluid-container"
        onMouseEnter={this.onHover}
        onMouseLeave={this.offHover}
      >
        <div className="meta-fluid-el-top-right">{toolbar}</div>
        <NodeSmallCard
          nid={this.props.nid}
          preface={null}
          crtd={null}
          upd={null}
          skip_input_edge={true}
        />
      </div>
    );
  }
}

const RefNodeCard = withRouter(RefNodeCardImpl);

export const NO_EXT_CLICK_DETECTION = "ignoreextclick";

class ExtClickDetector extends React.Component {
  constructor(props) {
    super(props);
    this.selfRef = React.createRef();
  }
  componentDidMount() {
    document.addEventListener("mousedown", this.handleClick, {
      capture: false,
      passive: true,
    });
  }
  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClick, {
      capture: false,
    });
  }
  handleClick = (event) => {
    if (
      this.props.isActive &&
      !this.selfRef.current.contains(event.target) &&
      !event.target.classList.contains("ignoreextclick")
    ) {
      this.props.callback(event);
    }
  };
  render() {
    return <div ref={this.selfRef}>{this.props.children}</div>;
  }
}

class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      height: this.getHeightForText(this.props.value),
      modalShow: false,
      modSlashCounter: 0,
    };
    this.textAreaRef = React.createRef();
  }

  componentDidMount() {
    this.props.resetAuxToolbar(this.createEditorToolbar());
    this.textAreaRef.current.focus();
  }

  componentWillUnmount() {
    this.props.resetAuxToolbar();
  }

  createEditorToolbar() {
    return (
      <MarkdownToolbar
        textAreaRef={this.textAreaRef}
        updateText={this.updateText}
      />
    );
  }

  handleChange = (event) => {
    const value = event.target.value;
    const diff = event.nativeEvent.data;
    this.setState({
      value: value,
      height: this.getAdjustedHeight(event.target, 20),
    });
    this.setState((state) => {
      // Check if it's a smartpoint
      var modSlashCounter = 0;
      var modalShow = false;
      if (diff === "/") {
        if (state.modSlashCounter === 0) {
          modSlashCounter = state.modSlashCounter + 1;
        } else {
          modalShow = true;
        }
      }
      return {
        modSlashCounter: modSlashCounter,
        modalShow: modalShow,
      };
    });
  };

  updateText = (value, cursorPosBegin, cursorPosEnd) => {
    this.setState(
      {
        value: value,
        height: this.getAdjustedHeight(this.textAreaRef.current, 20),
      },
      () => {
        this.textAreaRef.current.focus();
        if (cursorPosBegin) {
          if (!cursorPosEnd) {
            cursorPosEnd = cursorPosBegin;
          }
          this.textAreaRef.current.setSelectionRange(
            cursorPosBegin,
            cursorPosEnd
          );
        }
      }
    );
  };

  handleReplaceSmartpoint = (replacement) => {
    if (this.textAreaRef.current && this.textAreaRef.current.selectionStart) {
      const cursorPosEnd = this.textAreaRef.current.selectionStart;
      const cursorPosBegin = cursorPosEnd - 2;
      const replacementLen = replacement.length;
      this.setState(
        (state) => {
          // A beginning without smarpoint spell (//)
          const beginning = state.value.slice(0, cursorPosBegin);
          // Just an ending
          const ending = state.value.slice(cursorPosEnd);
          return {
            value: beginning + replacement + ending,
            modalShow: false,
          };
        },
        () => {
          this.textAreaRef.current.focus();
          this.textAreaRef.current.setSelectionRange(
            cursorPosBegin,
            cursorPosBegin + replacementLen
          );
        }
      );
    }
  };

  componentDidUpdate(prevProps, prevState) {}

  getHeightForText = (txt) => {
    // It's a black magic for initial calculation of textarea height
    // Fix it, if you know how
    var lines = 2;
    txt.split("\n").forEach(function (item, index) {
      lines = lines + item.length / 71 + 1;
    });
    return Math.max(250, lines * 25);
  };

  getAdjustedHeight = (el, minHeight) => {
    // compute the height difference which is caused by border and outline
    var outerHeight = parseInt(window.getComputedStyle(el).height, 10);
    var diff = outerHeight - el.clientHeight;
    // set the height to 0 in case of it has to be shrinked
    // el.style.height = 0;
    // el.scrollHeight is the full height of the content, not just the visible part
    return Math.max(minHeight, el.scrollHeight + diff);
  };

  _onExit = () => {
    this.props.onExit(this.state.value);
  };

  showModal = () => {
    this.setState({ modalShow: true });
  };

  hideModal = () => {
    this.setState({ modalShow: false });
    this.textAreaRef.current.focus();
  };

  render() {
    return (
      <>
        <AutocompleteWindow
          show={this.state.modalShow}
          onHide={this.hideModal}
          on_insert={this.handleReplaceSmartpoint}
          nid={this.props.nid}
        />
        <ExtClickDetector
          callback={this._onExit}
          isActive={!this.state.modalShow}
        >
          <InputGroup>
            <Form.Control
              as="textarea"
              aria-label="With textarea"
              className="mazed_editor"
              value={this.state.value}
              onChange={this.handleChange}
              style={{
                height: this.state.height + "px",
                resize: null,
              }}
              ref={this.textAreaRef}
            />
          </InputGroup>
        </ExtClickDetector>
      </>
    );
  }
}

class NodeRefsImpl extends React.Component {
  render() {
    const refs = this.props.edges.map((edge) => {
      var to_nid = null;
      var from_nid = null;
      var nid = null;
      if (edge.from_nid === this.props.nid) {
        from_nid = edge.from_nid;
        nid = edge.to_nid;
      } else {
        to_nid = edge.to_nid;
        nid = edge.from_nid;
      }
      return (
        <RefNodeCard
          nid={nid}
          to_nid={to_nid}
          from_nid={from_nid}
          key={edge.eid}
          is_sticky={edge.is_sticky}
        />
      );
    });
    return <>{refs}</>;
  }
}

const NodeRefs = withRouter(NodeRefsImpl);

class NodeCardImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      crtd: moment(),
      upd: moment(),
      edit: this.isEditingStart(),
      aux_toolbar: <></>,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchEdges();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidMount() {
    this.fetchEdges();
  }

  isEditingStart() {
    return this.props.location.state && this.props.location.state.edit
      ? true
      : false;
  }

  fetchEdges = () => {
    axios
      .get("/api/node/" + this.props.nid, {
        cancelToken: this.fetchCancelToken.token,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({
            text: res.data.toString(),
            crtd: moment(res.headers["x-created-at"]),
            upd: moment(res.headers["last-modified"]),
            edit: this.isEditingStart(),
          });
        }
      });
  };

  onEditExit_ = (value) => {
    const config = {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      cancelToken: this.fetchCancelToken.token,
    };
    axios
      .patch("/api/node/" + this.props.nid, value, config)
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({
            text: value,
            edit: false,
          });
          this.props.history.push("/node/" + this.props.nid);
        }
      });
  };

  toggleEditMode = () => {
    this.setState({ edit: !this.state.edit });
  };

  resetAuxToolbar = (el) => {
    if (el) {
      this.setState({ aux_toolbar: el });
    } else {
      this.setState({ aux_toolbar: <></> });
    }
  };

  render() {
    const upd = this.state.upd.fromNow();
    const toolbar = (
      <ButtonGroup>
        <Button variant="outline-secondary" onClick={this.toggleEditMode}>
          &#9998;
        </Button>
      </ButtonGroup>
    );

    var text_el;
    if (this.state.edit) {
      text_el = (
        <TextEditor
          value={this.state.text}
          nid={this.props.nid}
          onExit={this.onEditExit_}
          resetAuxToolbar={this.resetAuxToolbar}
        />
      );
    } else {
      text_el = <MdCardRender source={this.state.text} />;
    }
    return (
      <Row className="d-flex justify-content-center p-0">
        <Col className="mazed_note_toolbar_col">
          <LeftToolBar nid={this.props.nid} />
        </Col>
        <Col className="mazed_note_card_col">
          <Card className="meta-fluid-container mazed_note_card">
            <div className="meta-fluid-el-top-right">{toolbar}</div>
            <Card.Body className="p-3 m-2">{text_el}</Card.Body>
            <footer className="text-right m-2">
              <small className="text-muted">
                <i>Updated {upd}</i>
              </small>
            </footer>
          </Card>
        </Col>
        <Col className="mazed_note_toolbar_col">
          <RightToolBar nid={this.props.nid}>
            {this.state.aux_toolbar}
          </RightToolBar>
        </Col>
      </Row>
    );
  }
}

const NodeCard = withRouter(NodeCardImpl);

class FullNodeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edges_left: [],
      edges_right: [],
      edges_sticky: [],
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.fetchEdges();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchEdges();
    }
  }

  fetchEdges = () => {
    axios
      .get("/api/node/" + this.props.nid + "/edge", {
        cancelToken: this.fetchCancelToken.token,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          var edges_left = [];
          var edges_right = [];
          var edges_sticky = [];
          res.data.edges.map((edge) => {
            if (edge.from_nid === this.props.nid) {
              edges_right.push(edge);
            } else {
              edges_left.push(edge);
            }
            if (edge.is_sticky) {
              edges_sticky.push(edge);
            }
          });
          this.setState({
            edges_left: edges_left,
            edges_right: edges_right,
            edges_sticky: edges_sticky,
          });
        }
      });
  };

  render() {
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col xl={2} lg={2} md={3} sm={12} xs={10}>
            <NodeRefs nid={this.props.nid} edges={this.state.edges_left} />
          </Col>
          <Col xl={6} lg={8} md={6} sm={12} xs={12}>
            <NodeCard nid={this.props.nid} />
          </Col>
          <Col xl={2} lg={2} md={3} sm={12} xs={10}>
            <NodeRefs nid={this.props.nid} edges={this.state.edges_right} />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default withRouter(FullNodeView);
