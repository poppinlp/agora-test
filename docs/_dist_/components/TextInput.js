import React from '../../web_modules/react.js';
import { updateState } from '../helper/util.js';
export default function (props) {
  const {
    title,
    updater,
    dataKey,
    placeholder
  } = props;
  return /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, title), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: placeholder,
    onChange: e => {
      updateState(updater, {
        [dataKey]: e.currentTarget.value
      });
    }
  }));
}