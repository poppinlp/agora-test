import React from '../../web_modules/react.js';
import { updateState } from '../helper/util.js';
export default function (props) {
  const {
    title,
    updater,
    dataKey,
    options
  } = props;
  return /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, title), /*#__PURE__*/React.createElement("select", {
    onChange: e => updateState(updater, {
      [dataKey]: e.currentTarget.value
    })
  }, options.map(option => /*#__PURE__*/React.createElement("option", {
    key: option.value,
    value: option.value
  }, option.name))));
}