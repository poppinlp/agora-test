import React from 'react';
import { updateState } from '../helper/util';

export default function (props: RadioProps) {
  const { title, updater, dataKey, options, current } = props;

  return (
    <fieldset>
      <legend>{title}</legend>
      {options.map((option) => {
        const name = `${title}-${option.name}`;
        const checked = option.value === current;
        return (
          <span key={name}>
            <input
              type="radio"
              name={option.name}
              value={option.value}
              id={name}
              checked={checked}
              onChange={(e) =>
                updateState(updater, {
                  [dataKey]: e.currentTarget.value,
                })
              }
            />
            <label htmlFor={name}>{option.name}</label>
          </span>
        );
      })}
    </fieldset>
  );
}
