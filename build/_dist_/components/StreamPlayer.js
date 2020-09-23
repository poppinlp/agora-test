import React from '../../web_modules/react.js';
export default function (props) {
  const {
    title,
    prefix,
    streams
  } = props;
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("h1", null, title), streams.map(stream => {
    if (!stream) return null;
    const id = prefix + stream.getId();
    return /*#__PURE__*/React.createElement("div", {
      id: id,
      className: "stream_wrapper"
    });
  }));
}