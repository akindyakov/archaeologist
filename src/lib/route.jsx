import queryString from "query-string";

import { useParams } from "react-router-dom";

const kLogInPath = "/login";
const kSignUpPath = "/signup";
const kLogOutPath = "/logout";
const kSearchPath = "/search";
const kNodePathPrefix = "/n/";

const kNoticePathPrefix = "/notice/";

const kNoticeErrorPage = "error";
const kNoticeMissYouPage = "miss-you";

function gotoSearch({ history, query }) {
  history.push({
    pathname: kSearchPath,
    search: queryString.stringify({ q: query }),
  });
}

function getSearchAnchor({ location }) {
  const search =
    location && location.search ? location.search : window.location.search;
  const params = queryString.parse(search);
  return { query: params.q || "" };
}

function gotoPath(history, path) {
  if (history) {
    console.log("History push", path);
    history.push({ pathname: path });
  } else {
    console.log("Window location href", path);
    window.location.href = path;
  }
}

function gotoLogIn({ history }) {
  gotoPath(history, kLogInPath);
}

function gotoSignUp({ history }) {
  gotoPath(history, kSignUpPath);
}

function gotoLogOut({ history }) {
  gotoPath(history, kLogOutPath);
}

function gotoNode({ history, nid }) {
  gotoPath(history, kNodePathPrefix + nid);
}

function gotoMain({ history }) {
  console.log("Go to main");
  gotoPath(history, "/");
}

function gotoError({ history }) {
  console.log("Go to error");
  gotoPath(history, kNoticePathPrefix + kNoticeErrorPage);
}

function gotoMissYou({ history }) {
  gotoPath(history, kNoticePathPrefix + kNoticeMissYouPage);
}

function getNoticePage({ params }) {
  console.log("getNoticePage", params);
  return params;
}

export const routes = {
  login: kLogInPath,
  signup: kSignUpPath,
  logout: kLogOutPath,
  search: kSearchPath,
  node: kNodePathPrefix + ":id",
  notice: kNoticePathPrefix + ":page",
};

export const goto = {
  default: gotoMain,
  login: gotoLogIn,
  signup: gotoSignUp,
  logout: gotoLogOut,
  node: gotoNode,
  search: gotoSearch,
  notice: {
    error: gotoError,
    missYou: gotoMissYou,
  },
};

export const compass = {
  search: {
    get: getSearchAnchor,
  },
  notice: {
    get: getNoticePage,
  },
};

export const notice = {
  error: kNoticeErrorPage,
  missYou: kNoticeMissYouPage,
};
