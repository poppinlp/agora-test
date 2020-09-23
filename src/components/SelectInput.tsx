import React from 'react';
import { updateState } from '../helper/util';

export default function (props: SelectProps) {
  const { title, updater, dataKey, options } = props;

  return (
    <fieldset>
      <legend>{title}</legend>
      <select
        onChange={(e) =>
          updateState(updater, {
            [dataKey]: e.currentTarget.value,
          })
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
