import React, { useState, useEffect, SyntheticEvent } from 'react';
import AgoraRTC from 'agora-rtc-sdk';
import { getDevices, getCodecs} from './agora';
import {
  makeDefaultRtc,
  makeDefaultRtcData,
  makeDefaultRtcOptions,
  promisify,
  updateState,
} from './util';
import './App.css';

function App({}: AppProps) {
  const [rtc, setRtc] = useState(makeDefaultRtc());
  const [rtcData, setRtcData] = useState(makeDefaultRtcData());
  const [rtcOpts, setRtcOpts] = useState(makeDefaultRtcOptions());

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    console.log('useEffect', rtc, rtcOpts);
  });

  async function initData() {
    try {
      const [{ cameras, mics }, codecs] = await Promise.all([
        getDevices(),
        getCodecs(),
      ]);
      updateState(setRtcOpts, {
        cameras, mics, codecs
      });
      updateState(setRtcData, {
        codec: codecs[0].name
      });
    } catch (err) {
      alert(`fetch devices info error: ${err}`);
    }
  }

  async function initClient(opts: RTCOptions): Promise<void> {
    try {
      const client = AgoraRTC.createClient({
        mode: opts.mode,
        codec: opts.codec,
      });
      const pInit = promisify(client.init);

      await pInit(opts.appId);
      console.log('init client succ');

      const pJoin = promisify(client.join);
      const uid = await pJoin(opts.token, opts.channel, opts.uid);
      console.log('join channel succ');

      setRtc((rtc) => ({ ...rtc, client, joined: true }));
      setRtcOpts((rtcOpts) => ({ ...rtcOpts, uid }));
    } catch (err) {
      alert(`init client failed: ${err}`);
    }
  }

  async function initLocalStream(opts: RTCOptions): Promise<void> {
    try {
      const localStream: AgoraRTC.Stream = AgoraRTC.createStream({
        streamID: opts.uid,
        audio: true,
        video: true,
        screen: false,
        microphoneId: opts.mic,
        cameraId: opts.camera,
      });
      const pStreamInit = promisify(localStream.init);

      await pStreamInit();
      console.log('init local stream success');

      setRtc(rtc => ({...rtc, localStream}));
      localStream.play(ELEMENT_LOCAL_STREAM);
    } catch (err) {
      alert(`init local stream failed: ${err}`);
    }
  }

  async function publish(rtc: RTC): Promise<void> {
    try {
      if (!rtc.client) {
        alert('Please join channel first');
        return;
      }
      if (rtc.published) {
        alert('Published already');
        return;
      }

      const pPublish = promisify(rtc.client.publish);
      await publish(rtc.localStream);
      console.log('publish succ');
      setRtc((rtc) => ({ ...rtc, publish: true }));
    } catch (err) {
      alert(`publish failed: ${err}`);
    }
  }

  async function unpublish(rtc: RTC): Promise<void> {
    try {
      if (!rtc.client) {
        alert("Please join channel first")
        return
      }
      if (!rtc.published) {
        alert("Haven't published");
        return
      }

      const pUnpublish = promisify(rtc.client.unpublish);
      await pUnpublish(rtc.localStream);
      console.log("unpublish succ")
      setRtc((rtc) => ({ ...rtc, publish: false }));
    } catch (err) {
      alert(`unpublish failed: ${err}`);
    }
  }

  async function leave(rtc: RTC): Promise<void> {
    try {
      if (!rtc.client) {
        alert("Please join channel first")
        return
      }
      if (!rtc.joined) {
        alert("You are not in channel")
        return
      }

      const pLeave = promisify(rtc.client.leave);
      await pLeave();
      rtc.localStream.isPlaying() && rtc.localStream.stop();
      rtc.localStream.close();

      rtc.remoteStreams.forEach(remoteStream => {
        remoteStream.isPlaying() && remoteStream.stop();
        // removeRemoteView(remoteStream.getId());
      });

      setRtc((rtc) => ({
        ...rtc,
        localStream: null,
        remoteStreams: [],
        client: null,
        published: false,
        joined: false,
      }));
      console.log("leave success")
    } catch (err) {
      alert(`leave failed: ${err}`);
    }
  }

  function validate(data: any, fields: Array<string>): string | boolean {
    for (const field of fields) {
      if (data[field] === undefined || data[field] === '') {
        return `${field} should not be empty`;
      }
    }
    return false;
  }

  async function join(rtc: RTC, opts: RTCOptions): Promise<void> {
    if (rtc.joined) {
      alert('Already joined');
      return;
    }
    const fields = ['appId', 'channel', 'token', 'uid', 'mode', 'codec', 'camera', 'mic', 'resolution'];
    const msg = validate(opts, fields);
    if (msg) {
      alert(msg);
      return;
    }

    try {
      await initClient(opts);
      await initLocalStream(opts);
      await publish(rtc);
    } catch (err) {
      alert(`unknow error: ${err}`);
    }
  }

  return (
    <>
      <header>Agora Demo</header>
      <main>
        <aside>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset>
              <legend>App ID</legend>
              <input
                type="text"
                placeholder={APPID}
                onChange={(e) => {
                  setRtcOpts((rtcOpts) => ({
                    ...rtcOpts,
                    appId: e.currentTarget.value,
                  }));
                }}
              ></input>
            </fieldset>
            <fieldset>
              <legend>Channel</legend>
              <input
                type="text"
                placeholder={CHANNEL}
                onChange={(e) => {
                  setRtcOpts((rtcOpts) => ({
                    ...rtcOpts,
                    channel: e.currentTarget.value,
                  }));
                }}
              ></input>
            </fieldset>
            <fieldset>
              <legend>Token</legend>
              <input
                type="password"
                placeholder={TEMP_TOKEN}
                onChange={(e) => {
                  setRtcOpts((rtcOpts) => ({
                    ...rtcOpts,
                    token: e.currentTarget.value,
                  }));
                }}
              ></input>
            </fieldset>
            <fieldset>
              <legend>UID</legend>
              <input
                type="number"
                min="0"
                max="10000"
                step="1"
                value={rtcOpts.uid}
                onChange={(e) =>
                  setRtcOpts((rtcOpts) => ({
                    ...rtcOpts,
                    uid: Number(e.currentTarget.value),
                  }))
                }
              />
            </fieldset>
            <fieldset>
              <legend>Camera</legend>
              <select
                onChange={(e) =>
                  setRtcOpts((rtcOpts) => ({
                    ...rtcOpts,
                    camera: e.currentTarget.value,
                  }))
                }
              >
                {rtcOpts.cameras.map((device, idx) => {
                  const id = device.deviceId || device.groupId;
                  const name = device.label || `mic-${idx}`;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </fieldset>
            <fieldset>
              <legend>Mic</legend>
              <select
                onChange={(e) =>
                  setRtcOpts((rtcOpts) => ({
                    ...rtcOpts,
                    mic: e.currentTarget.value,
                  }))
                }
              >
                {rtcOpts.mics.map((device, idx) => {
                  const id = device.deviceId || device.groupId;
                  const name = device.label || `mic-${idx}`;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </fieldset>
            <fieldset>
              <legend>Camera Resolution</legend>
              <select
                onChange={(e) =>
                  setRtcOpts((rtcOpts) => ({
                    ...rtcOpts,
                    resolution: e.currentTarget.value,
                  }))
                }
              >
                {rtcOpts.resolutions.map((resolution) => (
                  <option key={resolution.value} value={resolution.value}>
                    {resolution.name}
                  </option>
                ))}
              </select>
            </fieldset>
            <fieldset>
              <legend>Mode</legend>
              {rtcOpts.modes.map((mode) => {
                const name = `mode-${mode.name}`;
                const checked = mode.name === rtcOpts.mode;
                return (
                  <span key={name}>
                    <input
                      type="radio"
                      name="mode"
                      value={mode.value}
                      id={name}
                      checked={checked}
                      onChange={(e) =>
                        setRtcOpts((rtcOpts) => ({
                          ...rtcOpts,
                          mode: e.currentTarget.value,
                        }))
                      }
                    />
                    <label htmlFor={name}>{mode.name}</label>
                  </span>
                );
              })}
            </fieldset>
            <fieldset>
              <legend>Codec</legend>
              {rtcOpts.codecs.map((item) => {
                const name = `codec-${item.name}`;
                const checked = item.name === rtcOpts.codec;
                return (
                  <span key={name}>
                    <input
                      type="radio"
                      name="codec"
                      value={item.value}
                      id={name}
                      onChange={(e) =>
                        setRtcOpts((rtcOpts) => ({
                          ...rtcOpts,
                          codec: e.currentTarget.value,
                        }))
                      }
                      checked={checked}
                    />
                    <label htmlFor={name}>{item.name}</label>
                  </span>
                );
              })}
            </fieldset>
            <button onClick={() => join(rtc, rtcOpts)}>JOIN</button>
            <button onClick={() => leave(rtc)}>LEAVE</button>
            <button onClick={() => publish(rtc)}>PUBLISH</button>
            <button onClick={() => unpublish(rtc)}>UNPUBLISH</button>
          </form>
        </aside>
        <section>
          <article>
            <h1>Local Stream</h1>
            <div id={ELEMENT_LOCAL_STREAM} className="stream_wrapper"></div>
          </article>
          <article>
            <h1>Remote Stream</h1>
            <div id={ELEMENT_REMOTE_STREAM} className="stream_wrapper"></div>
          </article>
        </section>
      </main>
    </>
  );
}

export default App;
