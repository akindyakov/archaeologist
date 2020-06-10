import React from "react";

import "./FullNodeView.css";

import NodeSmallCard from "./NodeSmallCard";

import maze from "./maze.png";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import remoteErrorHandler from "./remoteErrorHandler";

import {
  Card,
  Button,
  ButtonGroup,
  InputGroup,
  Form,
  Container,
  Row,
  Col,
  CardColumns,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";

// https://github.com/rexxars/react-markdown
import ReactMarkdown from "react-markdown";

import axios from "axios";
import moment from "moment";
import queryString from "query-string";

const hash = require("object-hash");

const NEW_NODE_FAKE_ID = ".new";

class RefNodeCardImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      offer: this.props.offer,
      preface: "",
      crtd: moment().unix(),
      upd: moment().unix(),
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.nid !== prevProps.nid) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  fetchData = () => {
    if (this.props.nid === NEW_NODE_FAKE_ID) {
      return;
    }
    axios
      .get(
        "/api/node/" +
          this.props.nid +
          "?" +
          queryString.stringify({ preview: true }),
        {
          cancelToken: this.fetchCancelToken.token,
        }
      )
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({
            preface: res.data,
            crtd: moment(res.headers["x-created-at"]).unix(),
            upd: moment(res.headers["last-modified"]).unix(),
          });
        }
      });
  };

  onHover = () => {
    this.setState({ hover: true });
  };

  offHover = () => {
    this.setState({ hover: false });
  };

  handleRefAdd = () => {
    var to_nid = this.props.nid;
    var from_nid = this.props.partner_nid;
    if (this.props.direction === "to") {
      [to_nid, from_nid] = [from_nid, to_nid];
    }
    const req = {
      from_nid: from_nid,
      txt: "next",
      weight: 100,
    };
    axios
      .post("/api/node/" + to_nid + "/to", req, {
        cancelToken: this.fetchCancelToken.token,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({ offer: false });
        }
      });
  };

  handleRefCutOff = () => {
    var to_nid = this.props.nid;
    var from_nid = this.props.partner_nid;
    if (this.props.direction === "to") {
      [to_nid, from_nid] = [from_nid, to_nid];
    }
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
          this.setState({ offer: true });
        }
      });
  };

  render() {
    var toolbar;
    if (this.state.offer) {
      toolbar = (
        <ButtonGroup>
          <Button
            variant="outline-success"
            size="sm"
            onClick={this.handleRefAdd}
          >
            &#43;
          </Button>
        </ButtonGroup>
      );
    } else {
      if (this.state.hover) {
        toolbar = (
          <ButtonGroup>
            <Button variant="outline-dark" size="sm">
              &#9998;
            </Button>
            <Button
              variant="outline-dark"
              size="sm"
              onClick={this.handleRefCutOff}
            >
              &#9988;
            </Button>
            <DropdownButton
              as={ButtonGroup}
              title="&#x22EE;&nbsp;"
              id="bg-vertical-dropdown-1"
              variant="outline-dark"
              size="sm"
            >
              <Dropdown.Item eventKey="1">&#x2602;</Dropdown.Item>
              <Dropdown.Item eventKey="2">&#x263C;</Dropdown.Item>
              <Dropdown.Item eventKey="3">&#x263D;</Dropdown.Item>
            </DropdownButton>
          </ButtonGroup>
        );
      }
    }
    return (
      <div
        className="meta-fluid-container"
        onMouseEnter={this.onHover}
        onMouseLeave={this.offHover}
      >
        <NodeSmallCard
          nid={this.props.nid}
          preface={this.state.preface}
          crtd={this.state.crtd}
          upd={this.state.upd}
        />
        <div className="meta-fluid-el-top-left">{toolbar}</div>
      </div>
    );
  }
}

RefNodeCardImpl.defaultProps = { offer: false };

const RefNodeCard = withRouter(RefNodeCardImpl);

class ExtClickDetector extends React.Component {
  constructor(props) {
    super(props);
    this.selfRef = React.createRef();
  }
  componentDidMount() {
    document.addEventListener("mousedown", this.handleClick, false);
  }
  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClick, false);
  }
  handleClick = (event) => {
    if (!this.selfRef.current.contains(event.target)) {
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
    };
    this.textAreaRef = React.createRef();
  }

  componentDidMount() {
    this.textAreaRef.current.focus();
  }

  handleChange = (event) => {
    this.setState({
      value: event.target.value,
      height: this.getHeightForText(event.target.value),
    });
    // this.props.onChange(event.target.value);
  };

  getHeightForText = (txt) => {
    // FIXME
    var lines = 2;
    txt.split("\n").forEach(function (item, index) {
      lines = lines + 1 + item.length / 80;
    });
    return Math.max(16, lines * 1.7);
  };

  _onExit = () => {
    this.props.onExit(this.state.value);
  };

  render() {
    return (
      <ExtClickDetector callback={this._onExit}>
        <InputGroup>
          <Form.Control
            as="textarea"
            aria-label="With textarea"
            className="border-0"
            value={this.state.value}
            onChange={this.handleChange}
            style={{ height: this.state.height + "em" }}
            ref={this.textAreaRef}
          />
        </InputGroup>
      </ExtClickDetector>
    );
  }
}

class SearchNewRefToolkitImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search_value: "",
      should_show_search: false,
    };
    // this.props.offers_callback
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  handleChange = (event) => {
    const q = event.target.value;
    this.setState({ search_value: q });
    if (q.length > 2) {
      this.fetchData(q);
    }
  };

  handleSumbit = (event) => {
    event.preventDefault();
    this.fetchData(this.state.search_value);
  };

  fetchData = (q) => {
    const req = {
      q: q,
      upd_after: 512,
      limit: 32,
    };
    axios
      .post("/api/node-search", req, {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.props.offers_callback(res.data.nodes);
        }
      })
      .catch(remoteErrorHandler(this.props.history));
  };

  handleNextClick = () => {
    this.props.history.push("/node/" + NEW_NODE_FAKE_ID, {
      from: this.props.nid,
    });
  };

  handleShowSearchClick = () => {
    if (this.state.should_show_search) {
      this.props.offers_callback([]);
    }
    this.setState({ should_show_search: !this.state.should_show_search });
  };

  render() {
    // Flashlight: &#x1F526;
    var search_input_group;
    if (this.state.should_show_search) {
      search_input_group = (
        <InputGroup className="p-0">
          <Form.Control
            aria-label="Search-to-link"
            aria-describedby="basic-addon1"
            onChange={this.handleChange}
            onSubmit={this.handleSumbit}
            value={this.state.search_value}
            placeholder="Search to offer"
          />
        </InputGroup>
      );
    }
    return (
      <Card className="rounded">
        <ButtonGroup
          aria-label="connect-note-toolkit"
          className="connect-toolkit-btn-group"
        >
          <Button
            variant="outline-secondary"
            onClick={this.handleNextClick}
            className="connect-toolkit-btn"
          >
            <span role="img" aria-label="next">
              &#x2192; &#x2b;
            </span>
          </Button>
          <Button
            variant="outline-secondary"
            onClick={this.handleShowSearchClick}
            className="connect-toolkit-btn"
          >
            <span role="img" aria-label="next">
              &#x1F50D; &#x2b;
            </span>
          </Button>
        </ButtonGroup>
        {search_input_group}
      </Card>
    );
  }
}
const SearchNewRefToolkit = withRouter(SearchNewRefToolkitImpl);

class NodeRefs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      offers: [],
      refs: [],
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchData();
    }
  }

  fetchData = () => {
    if (this.props.nid === NEW_NODE_FAKE_ID) {
      this.setState({
        refs: [],
        offers: [],
      });
      return;
    }
    axios
      .get("/api/node/" + this.props.nid + "/" + this.props.direction, {
        cancelToken: this.fetchCancelToken.token,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({
            refs: res.data.edges,
            offers: [],
          });
        }
      });
  };

  addOffersCallback = (nodes) => {
    this.setState({
      offers: nodes,
    });
  };

  render() {
    const offers = this.state.offers.map((item) => {
      var nid, partner_nid;
      if (this.props.direction === "to") {
        nid = this.props.nid;
        partner_nid = item.nid;
      } else {
        nid = item.nid;
        partner_nid = this.props.nid;
      }
      return (
        <RefNodeCard
          nid={nid}
          partner_nid={partner_nid}
          direction={this.props.direction}
          offer={true}
          key={"n:" + item.nid}
        />
      );
    });
    const refs = this.state.refs.map((item) => {
      var nid, partner_nid;
      if (this.props.direction === "to") {
        nid = item.from_nid;
        partner_nid = item.to_nid;
      } else {
        partner_nid = item.from_nid;
        nid = item.to_nid;
      }
      return (
        <RefNodeCard
          nid={nid}
          partner_nid={partner_nid}
          direction={this.props.direction}
          offer={false}
          key={item.eid}
        />
      );
    });

    var new_ref_toolkit;
    if (this.props.direction === "from") {
      new_ref_toolkit = (
        <SearchNewRefToolkit
          nid={this.props.nid}
          offers_callback={this.addOffersCallback}
        />
      );
    }
    const style_class = "meta-node-refs-" + this.props.direction;
    return (
      <CardColumns className={style_class}>
        {new_ref_toolkit}
        {offers}
        {refs}
      </CardColumns>
    );
  }
}

class NodeCardImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      crtd: moment(),
      upd: moment(),
      edit: this.isNew(),
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
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidMount() {
    this.fetchData();
  }

  isNew() {
    return this.props.nid === NEW_NODE_FAKE_ID;
  }

  fetchData = () => {
    if (!this.isNew()) {
      axios
        .get("/api/node/" + this.props.nid, {
          cancelToken: this.fetchCancelToken.token,
        })
        .catch(remoteErrorHandler(this.props.history))
        .then((res) => {
          if (res) {
            this.setState({
              text: res.data,
              crtd: moment(res.headers["x-created-at"]),
              upd: moment(res.headers["last-modified"]),
            });
          }
        });
    } else {
      this.setState({
        text: "",
        crtd: moment(),
        upd: moment(),
        edit: true,
      });
    }
  };

  onEditExit_ = (value) => {
    this.setState({
      text: value,
      edit: false,
    });
    const config = {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      cancelToken: this.fetchCancelToken.token,
    };
    if (!this.isNew()) {
      axios
        .patch("/api/node/" + this.props.nid, value, config)
        .catch(remoteErrorHandler(this.props.history))
        .then((_res) => {});
    } else {
      axios
        .post("/api/node/new", value, config)
        .catch(remoteErrorHandler(this.props.history))
        .then((res) => {
          if (res) {
            const nid = res.data.nid;
            if (this.props.location.state && this.props.location.state.from) {
              // That means we have to add an edge
              const req = {
                from_nid: this.props.location.state.from,
                txt: "next",
                weight: 100,
              };
              axios
                .post("/api/node/" + nid + "/to", req, {
                  cancelToken: this.fetchCancelToken.token,
                })
                .catch(remoteErrorHandler(this.props.history))
                .then((res) => {
                  if (res) {
                    this.props.history.push({
                      pathname: "/node/" + nid,
                    });
                  }
                });
            } else {
              this.props.history.push({
                pathname: "/node/" + nid,
              });
            }
          }
        });
    }
  };

  toggleEditMode = () => {
    this.setState({ edit: !this.state.edit });
  };

  render() {
    const upd = this.state.upd.fromNow();
    const toolbar = (
      <ButtonGroup>
        <Button
          variant="outline-secondary"
          size="sm"
          disabled={this.state.edit}
          onClick={this.toggleEditMode}
        >
          &#9998;
        </Button>
        <DropdownButton
          as={ButtonGroup}
          title="&#x22EE;&nbsp;"
          id="bg-vertical-dropdown-1"
          variant="outline-secondary"
          size="sm"
        >
          <Dropdown.Item eventKey="1">&#x2602;</Dropdown.Item>
          <Dropdown.Item eventKey="2">&#x263C;</Dropdown.Item>
          <Dropdown.Item eventKey="3">&#x263D;</Dropdown.Item>
        </DropdownButton>
      </ButtonGroup>
    );

    var text_el;
    if (this.state.edit) {
      text_el = (
        <TextEditor value={this.state.text} onExit={this.onEditExit_} />
      );
    } else {
      text_el = <ReactMarkdown source={this.state.text} />;
    }
          // <div className="d-flex justify-content-center mp-0">
          //   <Card.Img variant="top" className="w-25 p-3 m-1" src={maze} />
          // </div>
    return (
      <Card className="meta-fluid-container">
        <div className="meta-fluid-el-top-rigth">{toolbar}</div>
        <Card.Body className="p-3 m-2">
          {text_el}
        </Card.Body>
        <footer className="text-right m-2">
          <small className="text-muted">
            <i>Updated {upd}</i>
          </small>
        </footer>
      </Card>
    );
  }
}

const NodeCard = withRouter(NodeCardImpl);

class FullNodeView extends React.Component {
  constructor(props) {
    super(props);
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {};

  render() {
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col
            xl={2}
            lg={3}
            md={3}
            sm={12}
            xs={10}
            className="meta-refs-col-to"
          >
            <NodeRefs nid={this.props.nid} direction="to" />
          </Col>
          <Col
            xl={4}
            lg={6}
            md={6}
            sm={12}
            xs={12}
            className="meta-refs-col-node"
          >
            <NodeCard nid={this.props.nid} />
          </Col>
          <Col
            xl={4}
            lg={3}
            md={3}
            sm={12}
            xs={10}
            className="meta-refs-col-from"
          >
            <NodeRefs nid={this.props.nid} direction="from" />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default withRouter(FullNodeView);
