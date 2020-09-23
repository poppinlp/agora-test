import AgoraRTC from '../../web_modules/agora-rtc-sdk.js';
import { promisify, log } from './util.js';
import { FIELD_AUDIO_INPUT, FIELD_VIDEO_INPUT } from './constraint.js';
export async function getDevices() {
  const pGetDevices = promisify(AgoraRTC.getDevices);
  const devices = await pGetDevices();
  const cameras = [];
  const mics = [];
  const prefix = {
    [FIELD_AUDIO_INPUT]: 'mic-',
    [FIELD_VIDEO_INPUT]: 'camera-'
  };
  const targetKinds = new Set([FIELD_VIDEO_INPUT, FIELD_AUDIO_INPUT]);
  devices.forEach((device, idx) => {
    if (!targetKinds.has(device.kind)) return;
    const id = device.deviceId || device.groupId;
    const name = device.label || prefix[device.kind] + idx;
    (device.kind === FIELD_AUDIO_INPUT ? mics : cameras).push({
      name,
      value: id
    });
  });
  return {
    cameras,
    mics
  };
}
export async function getCodecs() {
  const allCodecs = await AgoraRTC.getSupportedCodec();
  const codecs = allCodecs.video.map(codec => {
    const formatCodec = codec.toLowerCase();
    return {
      name: formatCodec,
      value: formatCodec
    };
  });
  return codecs;
}

async function initClient(data) {
  try {
    const client = AgoraRTC.createClient({
      mode: data.mode,
      codec: data.codec
    });
    const pInit = promisify(client.init);
    await pInit(data.appId);
    log('init client succ');
    const pJoin = promisify(client.join);
    const uid = await pJoin(data.token, data.channel, data.uid);
    log('join channel succ');
    return {
      client,
      uid
    };
  } catch (err) {
    throw `init client failed: ${err.message}`;
  }
}

async function initLocalStream(data) {
  try {
    const localStream = AgoraRTC.createStream({
      streamID: data.uid,
      audio: true,
      video: true,
      screen: false,
      microphoneId: data.mic,
      cameraId: data.camera
    });
    const pStreamInit = promisify(localStream.init);
    await pStreamInit();
    log('init local stream success');
    return localStream;
  } catch (err) {
    throw `init local stream failed: ${err.message}`;
  }
}

export async function join(data) {
  log('join start');
  const {
    client,
    uid
  } = await initClient(data);
  const localStream = await initLocalStream(data);
  log('join end');
  return {
    client,
    uid,
    localStream
  };
}
export async function leave(rtc) {
  log('leave start');
  const client = rtc.client;
  const pLeave = promisify(client.leave);
  await pLeave();
  const localStream = rtc.localStream;
  localStream.isPlaying() && localStream.stop();
  localStream.close();
  rtc.remoteStreams.forEach(remoteStream => {
    remoteStream.isPlaying() && remoteStream.stop();
  });
  log('leave succ');
}
export async function publish(client, localStream) {
  log('publish start');
  const pPublish = promisify(client.publish, false);
  await pPublish(localStream);
}
export async function unpublish(client, localStream) {
  log('unpublish start');
  const pUnpublish = promisify(client.unpublish, false);
  await pUnpublish(localStream);
}