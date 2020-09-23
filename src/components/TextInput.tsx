import React from 'react';
import { updateState } from '../helper/util';

export default function (props: TextInputProps) {
  const { title, updater, dataKey, placeholder } = props;

  return (
    <fieldset>
      <legend>{title}</legend>
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => {
          updateState(updater, {
            [dataKey]: e.currentTarget.value,
          });
        }}
      ></input>
    </fieldset>
  );
}
