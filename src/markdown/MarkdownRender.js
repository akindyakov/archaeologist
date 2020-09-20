import React from "react";
import PropTypes from "prop-types";

import {
  Badge,
  Button,
  Overlay,
  Popover,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

import moment from "moment";

import "./MarkdownRender.css";
import list_style from "./MarkdownList.module.css";

// https://github.com/rexxars/react-markdown
import ReactMarkdown from "react-markdown";
import Emoji from "./../Emoji";

const emoji = require("node-emoji");

function MarkdownHeading({ level, children, sourcePosition, ...rest }) {
  var hdr_el;
  // TODO(akindyakov): add markdown title anchors
  switch (level) {
    case 1:
      hdr_el = <h1 {...rest}> {children} </h1>;
      break;
    case 2:
      hdr_el = <h2 {...rest}> {children} </h2>;
      break;
    case 3:
      hdr_el = <h3 {...rest}> {children} </h3>;
      break;
    case 4:
      hdr_el = <h4 {...rest}> {children} </h4>;
      break;
    case 5:
      hdr_el = <h5 {...rest}> {children} </h5>;
      break;
    case 6:
    default:
      hdr_el = <h6 {...rest}> {children} </h6>;
      break;
  }
  return hdr_el;
}

export class DateBadge extends React.Component {
  constructor(props) {
    super(props);
  }

  handleClick = (event) => {};

  render() {
    const date_str = this.props.tm.calendar({
      sameDay: "[Today]",
      nextDay: "[Tomorrow]",
      nextWeek: "dddd",
      lastDay: "[Yesterday]",
      lastWeek: "[Last] dddd",
      sameElse: "YYYY MMMM DD, dddd",
    });
    return (
      <Badge variant="secondary" pill>
        {date_str}
      </Badge>
    );
  }
}

export class TimeBadge extends React.Component {
  constructor(props) {
    super(props);
  }

  handleClick = (event) => {};

  render() {
    var date_str;
    if (!this.props.format || this.props.format === "time") {
      const timeFmt = ", hh:mm";
      date_str = this.props.tm.calendar({
        sameDay: "[Today]" + timeFmt,
        nextDay: "[Tomorrow]" + timeFmt,
        nextWeek: "dddd" + timeFmt,
        lastDay: "[Yesterday]" + timeFmt,
        lastWeek: "[Last] dddd" + timeFmt,
        sameElse: "YYYY MMMM DD, dddd" + timeFmt,
      });
    } else {
      date_str = this.props.tm.format(this.props.format);
    }
    return (
      <Badge variant="secondary" pill>
        {date_str}
      </Badge>
    );
  }
}

TimeBadge.propTypes = {
  format: PropTypes.string,
};

export function DateTimeBadge({ tm, format, children, ...rest }) {
  if (format === "day") {
    return <DateBadge tm={tm} />;
  }
  return <TimeBadge tm={tm} format={format} />;
}

function MarkdownLink({ href, children, ...rest }) {
  href = href.trim();

  if (href.startsWith("@")) {
    const parts = href.match(/^@([0-9]+)\/?(.*)/);
    if (parts) {
      const tm = moment.unix(parts[1]);
      const format = parts[2];
      return <DateTimeBadge tm={tm} format={format} />;
    }
  }

  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

function MarkdownText({ children, sourcePosition, ...rest }) {
  return <>{children}</>;
}

var _DEPTH = 0;
const _LIST_POINT_OPTIONS = [
  <Emoji symbol="&#9679;" label="-" />,
  <Emoji symbol="&#9654;" label="-" />,
  <Emoji symbol="&#9655;" label="-" />,
  <Emoji symbol="&#9658;" label="-" />,
  <Emoji symbol="&#9659;" label="-" />,
  <Emoji symbol="&#9656;" label="-" />,
  <Emoji symbol="&#9657;" label="-" />,
  //(<Emoji symbol="&#9675;" label="-" />),
  //(<Emoji symbol="&#9673;" label="-" />),
  //(<Emoji symbol="&#9678;" label="-" />),
  //(<Emoji symbol="&#9677;" label="-" />),
  //(<Emoji symbol="&#9676;" label="-" />),
];

function genListPointStyle(d) {
  const i = Math.min(Math.max(0, d), _LIST_POINT_OPTIONS.length - 1);
  return _LIST_POINT_OPTIONS[i];
}

function MarkdownList({ children, ordered, start, depth, ...rest }) {
  _DEPTH = depth;
  if (ordered) {
    return (
      <ol start={start} className={list_style.ordered_list}>
        {children}
      </ol>
    );
  }
  return <ul className={list_style.unordered_list}>{children}</ul>;
}

function MarkdownListItem({
  children,
  ordered,
  index,
  sourcePosition,
  ...rest
}) {
  if (!ordered && children.length && children.length > 0) {
    const firstItem = children[0];
    if (firstItem.props && firstItem.props.value) {
      const value = firstItem.props.value;
      const chArr = [...value.trim()];
      const ch = chArr[0];
      if (ch !== emoji.unemojify(ch)) {
        const firstKid = MarkdownText({
          children: value.replace(ch, "").trim(),
          sourcePosition: {},
        });
        children.shift();
        return (
          <>
            <div className={list_style.emoji_list_item_before}>{ch}</div>
            <li>
              {firstKid} {children}
            </li>
          </>
        );
      } else {
        const depth =
          sourcePosition.indent.length > 0
            ? Math.floor(sourcePosition.indent[0] / 2)
            : 0;
        const pt = genListPointStyle(depth);
        return (
          <>
            <div className={list_style.emoji_list_item_before}> {pt} </div>
            <li> {children} </li>
          </>
        );
      }
    }
  }
  return <li>{children}</li>;
}

export function MdCardRender({ source }) {
  return (
    <ReactMarkdown
      source={source}
      rawSourcePos={true}
      renderers={{
        heading: MarkdownHeading,
        text: MarkdownText,
        link: MarkdownLink,
        list: MarkdownList,
        listItem: MarkdownListItem,
        root: MarkdownRoot,
      }}
    />
  );
}

function MarkdownRoot({ children, sourcePosition, ...rest }) {
  return (
    <div {...rest} className="markdown-body markdown-full-note-body">
      {children}
    </div>
  );
}

function MarkdownSmallRoot({ children, sourcePosition, ...rest }) {
  return (
    <div {...rest} className="markdown-body markdown-small-card-body">
      {children}
    </div>
  );
}

export function MdSmallCardRender({ source }) {
  return (
    <ReactMarkdown
      source={source}
      rawSourcePos={true}
      renderers={{
        heading: MarkdownHeading,
        text: MarkdownText,
        link: MarkdownLink,
        list: MarkdownList,
        listItem: MarkdownListItem,
        root: MarkdownSmallRoot,
      }}
    />
  );
}

export default MdCardRender;