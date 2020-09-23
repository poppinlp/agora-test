import React, { useState, useEffect, FormEvent, SyntheticEvent } from 'react';
import AgoraRTC from 'agora-rtc-sdk';
import { promisify } from './util';
import './App.css';

interface AppProps {}

interface SelectOption {
  name: string;
  value: string;
}

interface Device {
  deviceId: string;
  groupId: string;
  kind: string;
  label: string;
}

interface RTC {
  client: AgoraRTC.Client | null;
  localStream: AgoraRTC.Stream | null;
  remoteStreams: Array<AgoraRTC.Stream>;
  joined: boolean;
  published: boolean;
}

interface RTCOptions {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  mode: string;
  codec: string;
  camera: string;
  mic: string;
  resolution: string;
  modes: Array<SelectOption>;
  codecs: Array<SelectOption>;
  cameras: Array<Device>;
  mics: Array<Device>;
  resolutions: Array<SelectOption>;
}

const APPID = '78dfd6ed076849a8a67e7eb1e10af5a7';
const CHANNEL = 'poppinl-test';
const TEMP_TOKEN =
  '00678dfd6ed076849a8a67e7eb1e10af5a7IACScR7d5rzAjz2eQYX8dmiz97u9oKBk01RBHihUZhWs8oRqKDEAAAAAEAAQz9mbNHhrXwEAAQA0eGtf';

const FIELD_AUDIO_INPUT = 'audioinput';
const FIELD_VIDEO_INPUT = 'videoinput';
const ELEMENT_LOCAL_STREAM = 'local_stream';
const ELEMENT_REMOTE_STREAM = 'remote_stream';

const RESOLUTIONS = [
  { name: 'default', value: 'default' },
  { name: '480p', value: '480p' },
  { name: '720p', value: '720p' },
  { name: '1080p', value: '1080p' },
];

const MODES = [
  { name: 'live', value: 'live' },
  { name: 'rtc', value: 'rtc' },
];

const DEFAULT_UID = 0;
const DEFAULT_MODE = MODES[0].name;
const DEFAULT_RESOLUTION = RESOLUTIONS[0].name;

function App({}: AppProps) {
  const [rtc, setRTC] = useState({
    client: null,
    localStream: null,
    remoteStreams: [],
    joined: false,
    published: false,
  } as RTC);
  const [rtcOpts, setRTCOpts] = useState({
    appId: APPID,
    channel: CHANNEL,
    token: TEMP_TOKEN,
    uid: DEFAULT_UID,
    mode: DEFAULT_MODE,
    codec: '',
    camera: '',
    mic: '',
    resolution: DEFAULT_RESOLUTION,
    modes: MODES,
    codecs: [],
    cameras: [],
    mics: [],
    resolutions: RESOLUTIONS,
  } as RTCOptions);

  useEffect(() => {
    // TODO: get device and codec
    console.log('init effect');
    window.AgoraRTC = AgoraRTC;

    getDevices();
    getCodecs();
  }, []);

  useEffect(() => {
    console.log('useEffect', rtc, rtcOpts);
  });

  async function getDevices() {
    const pGetDevices = promisify(AgoraRTC.getDevices);
    const devices = await pGetDevices();
    const cameras: Array<Device> = [];
    const mics: Array<Device> = [];

    devices.forEach((device: Device) => {
      device.kind === FIELD_AUDIO_INPUT && mics.push(device);
      device.kind === FIELD_VIDEO_INPUT && cameras.push(device);
    });

    setRTCOpts((rtcOpts) => ({ ...rtcOpts, cameras, mics }));
  }

  async function getCodecs() {
    const allCodecs = await AgoraRTC.getSupportedCodec();
    const codecs: Array<SelectOption> = allCodecs.video.map(
      (codec: string) => ({
        name: codec,
        value: codec,
      }),
    );

    setRTCOpts((rtcOpts) => ({ ...rtcOpts, codecs, codec: codecs[0].name }));
  }

  async function initClient(opts: RTCOptions) {
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

      setRTC((rtc) => ({ ...rtc, client, joined: true }));
      setRTCOpts((rtcOpts) => ({ ...rtcOpts, uid }));
    } catch (err) {
      alert(`init client failed: ${err}`);
    }
  }

  async function initLocalStream(opts: RTCOptions) {
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

      setRTC(rtc => ({...rtc, localStream}));
      localStream.play(ELEMENT_LOCAL_STREAM);
    } catch (err) {
      alert(`init local stream failed: ${err}`);
    }
  }

  async function publish(rtc: RTC) {
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
      setRTC((rtc) => ({ ...rtc, publish: true }));
    } catch (err) {
      alert(`publish failed: ${err}`);
    }
  }

  async function unpublish(rtc: RTC) {
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
      setRTC((rtc) => ({ ...rtc, publish: false }));
    } catch (err) {
      alert(`unpublish failed: ${err}`);
    }
  }

  async function leave(rtc: RTC) {
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

      setRTC((rtc) => ({
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

  async function join(rtc: RTC, opts: RTCOptions) {
    if (rtc.joined) {
      alert('Already joined');
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
                  setRTCOpts((rtcOpts) => ({
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
                  setRTCOpts((rtcOpts) => ({
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
                  setRTCOpts((rtcOpts) => ({
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
                  setRTCOpts((rtcOpts) => ({
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
                  setRTCOpts((rtcOpts) => ({
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
                  setRTCOpts((rtcOpts) => ({
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
                  setRTCOpts((rtcOpts) => ({
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
                        setRTCOpts((rtcOpts) => ({
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
                        setRTCOpts((rtcOpts) => ({
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
