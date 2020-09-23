import AgoraRTC from 'agora-rtc-sdk';
import { promisify, log } from './util';
import {
  FIELD_AUDIO_INPUT,
  FIELD_VIDEO_INPUT,
} from './constraint';

export async function getDevices(): Promise<{
  cameras: Array<SelectOption>;
  mics: Array<SelectOption>;
}> {
  const pGetDevices = promisify(AgoraRTC.getDevices);
  const devices = await pGetDevices();
  const cameras: Array<SelectOption> = [];
  const mics: Array<SelectOption> = [];
  const prefix: {
    [index: string]: string;
  } = {
    [FIELD_AUDIO_INPUT]: 'mic-',
    [FIELD_VIDEO_INPUT]: 'camera-',
  };
  const targetKinds = new Set([FIELD_VIDEO_INPUT, FIELD_AUDIO_INPUT]);

  devices.forEach((device: Device, idx: number) => {
    if (!targetKinds.has(device.kind)) return;
    const id = device.deviceId || device.groupId;
    const name = device.label || prefix[device.kind] + idx;
    (device.kind === FIELD_AUDIO_INPUT ? mics : cameras).push({
      name,
      value: id,
    });
  });

  return { cameras, mics };
}

export async function getCodecs(): Promise<Array<SelectOption>> {
  const allCodecs = await AgoraRTC.getSupportedCodec();
  const codecs: Array<SelectOption> = allCodecs.video.map((codec: string) => {
    const formatCodec = codec.toLowerCase();
    return { name: formatCodec, value: formatCodec };
  });

  return codecs;
}

async function initClient(
  data: RTCData,
): Promise<{
  client: AgoraRTC.Client;
  uid: string;
}> {
  try {
    const client: AgoraRTC.Client = AgoraRTC.createClient({
      mode: data.mode,
      codec: data.codec,
    });
    const pInit = promisify(client.init);

    await pInit(data.appId);
    log('init client succ');

    const pJoin = promisify(client.join);
    const uid: string = await pJoin(data.token, data.channel, +data.uid);
    log('join channel succ');

    return { client, uid };
  } catch (err) {
    throw `init client failed: ${err.message}`;
  }
}

async function initLocalStream(data: RTCData): Promise<AgoraRTC.Stream> {
  try {
    const localStream: AgoraRTC.Stream = AgoraRTC.createStream({
      streamID: data.uid,
      audio: true,
      video: true,
      screen: false,
      microphoneId: data.mic,
      cameraId: data.camera,
    });
    const pStreamInit = promisify(localStream.init);

    await pStreamInit();
    log('init local stream success');

    return localStream;
  } catch (err) {
    throw `init local stream failed: ${err.message}`;
  }
}

export async function join(
  data: RTCData,
): Promise<{
  client: AgoraRTC.Client;
  uid: string;
  localStream: AgoraRTC.Stream;
}> {
  log('join start');
  const { client, uid } = await initClient(data);
  const localStream = await initLocalStream(data);
  log('join end');
  return { client, uid, localStream };
}

export async function leave(rtc: RTC): Promise<void> {
  log('leave start');
  const client: AgoraRTC.Client = rtc.client;
  const pLeave = promisify(client.leave);
  await pLeave();

  const localStream: AgoraRTC.Stream = rtc.localStream;
  localStream.isPlaying() && localStream.stop();
  localStream.close();

  rtc.remoteStreams.forEach((remoteStream: AgoraRTC.Stream) => {
    remoteStream.isPlaying() && remoteStream.stop();
  });
  log('leave succ');
}

export async function publish(
  client: AgoraRTC.Client,
  localStream: AgoraRTC.Stream,
): Promise<void> {
  log('publish start');
  const pPublish = promisify(client.publish, false);
  await pPublish(localStream);
}

export async function unpublish(
  client: AgoraRTC.Client,
  localStream: AgoraRTC.Stream,
): Promise<void> {
  log('unpublish start');
  const pUnpublish = promisify(client.unpublish, false);
  await pUnpublish(localStream);
}
