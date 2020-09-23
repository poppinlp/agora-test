import React, { useState, useEffect, SyntheticEvent } from 'react';
import TextInput from './components/TextInput';
import SelectInput from './components/SelectInput';
import RadioInput from './components/RadioInput';
import StreamPlayer from './components/StreamPlayer';
import {
  getDevices,
  getCodecs,
  join,
  leave,
  publish,
  unpublish,
} from './helper/agora';
import {
  makeDefaultRtc,
  makeDefaultRtcData,
  makeDefaultRtcOptions,
  updateState,
  validate,
  showError,
  log,
  promisify,
} from './helper/util';
import {
  ELEMENT_LOCAL_STREAM_PREFIX,
  ELEMENT_REMOTE_STREAM_PREFIX,
} from './helper/constraint';
import './App.css';

function App({}: AppProps) {
  const [rtc, setRtc] = useState(makeDefaultRtc());
  const [rtcData, setRtcData] = useState(makeDefaultRtcData());
  const [rtcOpts, setRtcOpts] = useState(makeDefaultRtcOptions());

  const textFields = [
    { title: 'App ID', key: 'appId' },
    { title: 'Channel', key: 'channel' },
    { title: 'Token', key: 'token' },
    { title: 'UID', key: 'uid' },
  ];
  const selectFields = [
    { title: 'Camera', key: 'camera', options: 'cameras' },
    { title: 'Mic', key: 'mic', options: 'mics' },
    { title: 'Camera Resolution', key: 'resolution', options: 'resolutions' },
  ];
  const radioFields = [
    { title: 'Mode', key: 'mode', options: 'modes' },
    { title: 'Codec', key: 'codec', options: 'codecs' },
  ];
  const buttons = [
    { text: 'JOIN', onClick: onJoin, disabled: rtc.loading || rtc.joined },
    {
      text: 'LEAVE',
      onClick: onLeave,
      disabled: rtc.loading || !rtc.client || !rtc.joined,
    },
    {
      text: 'PUBLISH',
      onClick: onPublish,
      disabled: rtc.loading || !rtc.client || rtc.published,
    },
    {
      text: 'UNPUBLISH',
      onClick: onUnpublish,
      disabled: rtc.loading || !rtc.client || !rtc.published,
    },
  ];

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (!rtc.localStream) return;
    const id = ELEMENT_LOCAL_STREAM_PREFIX + rtc.localStream.getId();
    rtc.localStream.play(id);
  }, [rtc.localStream]);

  useEffect(() => {
    rtc.remoteStreams.forEach(stream => {
      const id = ELEMENT_REMOTE_STREAM_PREFIX + stream.getId();
      stream.play(id);
    });
  }, [rtc.remoteStreams]);

  return (
    <>
      <header>Agora React Demo</header>
      <main>
        <aside>
          <form onSubmit={(e) => e.preventDefault()}>
            {textFields.map((field) => (
              <TextInput
                key={field.title}
                title={field.title}
                updater={setRtcData}
                dataKey={field.key}
                placeholder={rtcData[field.key]}
              />
            ))}
            {selectFields.map((field) => (
              <SelectInput
                key={field.title}
                title={field.title}
                updater={setRtcData}
                dataKey={field.key}
                options={rtcOpts[field.options]}
              />
            ))}
            {radioFields.map((field) => (
              <RadioInput
                key={field.title}
                title={field.title}
                updater={setRtcData}
                dataKey={field.key}
                options={rtcOpts[field.options]}
                current={rtcData[field.key]}
              />
            ))}
            {buttons.map((button) => (
              <button
                onClick={button.onClick}
                disabled={button.disabled}
                key={button.text}
              >
                {button.text}
              </button>
            ))}
          </form>
        </aside>
        <section>
          <StreamPlayer
            title="Local Stream"
            prefix={ELEMENT_LOCAL_STREAM_PREFIX}
            streams={[rtc.localStream]}
          />
          <StreamPlayer
            title="Remote Stream"
            prefix={ELEMENT_REMOTE_STREAM_PREFIX}
            streams={rtc.remoteStreams}
          />
        </section>
      </main>
    </>
  );

  async function initData() {
    try {
      const [{ cameras, mics }, codecs] = await Promise.all([
        getDevices(),
        getCodecs(),
      ]);
      updateState(setRtcOpts, {
        cameras,
        mics,
        codecs,
      });
      updateState(setRtcData, {
        codec: codecs[0].name,
        camera: cameras[0].value,
        mic: mics[0].value,
      });
    } catch (err) {
      showError(`fetch devices info error: ${err}`);
    }
  }

  function bindClientEvent(client: AgoraRTC.Client) {
    client.on('error', (err) => {
      showError(`client error: ${err}`);
      updateState(setRtc, { loading: false });
    });
    client.on('stream-published', () => {
      updateState(setRtc, { published: true, loading: false });
      log('publish succ');
    });
    client.on('stream-unpublished', () => {
      updateState(setRtc, { published: false, loading: false });
      log('unpublish succ');
    });
    client.on('stream-subscribed', (e) => {
      const { stream } = e;
      log('on stream subscribed');
      updateState(setRtc, (prevRtc: RTC) => ({
        ...prevRtc,
        remoteStreams: [...prevRtc.remoteStreams, stream],
      }));
    });
    client.on('stream-added', (e) => {
      log('on stream added');
      const { stream } = e;
      const id = stream.getId();
      if (id === rtcData.uid) return;
      client.subscribe(stream);
    });
    client.on('stream-removed', (e) => {
      log('on stream removed');
      const { stream } = e;
      const id = stream.getId();
      stream.isPlaying() && stream.stop();
      updateState(setRtc, (prevRtc: RTC) => ({
        ...prevRtc,
        remoteStreams: prevRtc.remoteStreams.filter(
          (stream) => stream.getId() !== id,
        ),
      }));
    });
    client.on('peer-leave', (e) => {
      log('on peer leave');
      const id = e.uid;
      const peerStream = rtc.remoteStreams.find(stream => id === stream.getId());
      peerStream && peerStream.isPlaying() && peerStream.stop()
      updateState(setRtc, (prevRtc: RTC) => ({
        ...prevRtc,
        remoteStreams: prevRtc.remoteStreams.filter(
          (stream) => stream.getId() !== id,
        ),
      }));
    });
  }

  async function onJoin() {
    try {
      validate(rtcData);
      log('on join', rtcData);
      updateState(setRtc, { loading: true });
      const { client, uid, localStream } = await join(rtcData);
      bindClientEvent(client);
      updateState(setRtc, {
        client,
        localStream,
        joined: true,
        loading: false,
      });
      updateState(setRtcData, { uid });
    } catch (err) {
      showError(`join failed: ${err}`);
      updateState(setRtc, { loading: false });
    }
  }

  async function onLeave() {
    try {
      updateState(setRtc, { loading: true });
      await leave(rtc);
      updateState(setRtc, makeDefaultRtc);
    } catch (err) {
      showError(`leave failed: ${err}`);
      updateState(setRtc, { loading: false });
    }
  }

  async function onPublish() {
    try {
      updateState(setRtc, { loading: true });
      await publish(rtc.client, rtc.localStream);
    } catch (err) {
      showError(`publish failed: ${err}`);
    }
  }

  async function onUnpublish() {
    try {
      updateState(setRtc, { loading: true });
      await unpublish(rtc.client, rtc.localStream);
      updateState(setRtc, {
        published: false,
      });
    } catch (err) {
      showError(`unpublish failed: ${err}`);
    }
  }
}

export default App;
