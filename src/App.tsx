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

const CODECS = [
  { name: 'h264', value: 'h264' },
  { name: 'vp8', value: 'vp8' },
];

const DEFAULT_UID = 0;
const DEFAULT_MODE = MODES[0].name;
const DEFAULT_CODEC = CODECS[0].name;
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
    uid: DEFAULT_UID,
    mode: DEFAULT_MODE,
    codec: DEFAULT_CODEC,
    camera: '',
    mic: '',
    resolution: DEFAULT_RESOLUTION,
    modes: MODES,
    codecs: CODECS,
    cameras: [],
    mics: [],
    resolutions: RESOLUTIONS,
  } as RTCOptions);

  useEffect(() => {
    // TODO: get device and codec
    console.log('init effect');
    getDevices();
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

    setRTCOpts({ ...rtcOpts, cameras, mics });
  }

  async function onJoin(rtc: RTC, opts: RTCOptions) {
    if (rtc.joined) {
      alert('Already joined');
      return;
    }

    try {
      const client = AgoraRTC.createClient({
        mode: opts.mode,
        codec: opts.codec,
      });
      const pInit = promisify(client.init);

      await pInit(APPID);
      console.log('client init');
      join(client, opts);
    } catch (err) {
      console.error('client init error', err);
    }
  }

  async function join(client: AgoraRTC.Client, opts: RTCOptions) {
    try {
      const pJoin = promisify(client.join);
      const uid = await pJoin(TEMP_TOKEN, CHANNEL, opts.uid);
      const localStream = AgoraRTC.createStream({
        streamID: uid,
        audio: true,
        video: true,
        screen: false,
        microphoneId: opts.mic,
        cameraId: opts.camera,
      });
      const pInit = promisify(localStream.init);

      await pInit();
      console.log('init local stream success');
      localStream.play('local_stream');
    } catch (err) {
      console.error('client join failed', err);
    }
  }

  async function onLeave(rtc: RTC, opts: RTCOptions) {}

  async function onPublish(rtc: RTC, opts: RTCOptions) {}

  async function onUnpublish(rtc: RTC, opts: RTCOptions) {}

  return (
    <>
      <header>Agora Demo</header>
      <main>
        <aside>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset>
              <legend>App ID</legend>
              <input type="text" placeholder={APPID}
              ></input>
            </fieldset>
            <fieldset>
              <legend>Channel</legend>
              <input type="text" placeholder={CHANNEL}></input>
            </fieldset>
            <fieldset>
              <legend>Token</legend>
              <input type="password" placeholder={TEMP_TOKEN}></input>
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
                  setRTCOpts({
                    ...rtcOpts,
                    uid: Number(e.currentTarget.value),
                  })
                }
              />
            </fieldset>
            <fieldset>
              <legend>Camera</legend>
              <select
                onChange={(e) =>
                  setRTCOpts({
                    ...rtcOpts,
                    camera: e.currentTarget.value,
                  })
                }
              >
                {rtcOpts.cameras.map((device) => (
                  <option
                    key={device.deviceId}
                    value={device.deviceId}
                  >{device.label}</option>
                ))}
              </select>
            </fieldset>
            <fieldset>
              <legend>Mic</legend>
              <select
                onChange={(e) =>
                  setRTCOpts({
                    ...rtcOpts,
                    mic: e.currentTarget.value,
                  })
                }
              >
                {rtcOpts.mics.map((device) => (
                  <option
                    key={device.deviceId}
                    value={device.deviceId}
                  >{device.label}</option>
                ))}
              </select>
            </fieldset>
            <fieldset>
              <legend>Camera Resolution</legend>
              <select
                onChange={(e) =>
                  setRTCOpts({
                    ...rtcOpts,
                    resolution: e.currentTarget.value,
                  })
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
                        setRTCOpts({
                          ...rtcOpts,
                          mode: e.currentTarget.value,
                        })
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
                        setRTCOpts({
                          ...rtcOpts,
                          codec: e.currentTarget.value,
                        })
                      }
                      checked={checked}
                    />
                    <label htmlFor={name}>{item.name}</label>
                  </span>
                );
              })}
            </fieldset>
            <button onClick={() => onJoin(rtc, rtcOpts)}>JOIN</button>
            <button onClick={() => onLeave(rtc, rtcOpts)}>LEAVE</button>
            <button onClick={() => onPublish(rtc, rtcOpts)}>PUBLISH</button>
            <button onClick={() => onUnpublish(rtc, rtcOpts)}>UNPUBLISH</button>
          </form>
        </aside>
        <section>
          <article>
            <h1>Local Stream</h1>
            <div id="local_stream" className="stream_wrapper"></div>
          </article>
          <article>
            <h1>Remote Stream</h1>
            <div id="remote_stream" className="stream_wrapper"></div>
          </article>
        </section>
      </main>
    </>
  );
}

export default App;
