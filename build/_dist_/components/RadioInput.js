import React from '../../web_modules/react.js';
import { updateState } from '../helper/util.js';
export default function (props) {
  const {
    title,
    updater,
    dataKey,
    options,
    current
  } = props;
  return /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, title), options.map(option => {
    const name = `${title}-${option.name}`;
    const checked = option.value === current;
    return /*#__PURE__*/React.createElement("span", {
      key: name
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: option.name,
      value: option.value,
      id: name,
      checked: checked,
      onChange: e => updateState(updater, {
        [dataKey]: e.currentTarget.value
      })
    }), /*#__PURE__*/React.createElement("label", {
      htmlFor: name
    }, option.name));
  }));
}