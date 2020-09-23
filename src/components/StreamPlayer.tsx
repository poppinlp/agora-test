import React from 'react';

export default function (props: StreamPlayer) {
  const { title, prefix, streams } = props;

  return (
    <article>
      <h1>{title}</h1>
      {streams.map((stream) => {
        if (!stream) return null;
        const id = prefix + stream.getId();
        return (
          <div id={id} className="stream_wrapper"></div>
        );
      })}
    </article>
  );
}
