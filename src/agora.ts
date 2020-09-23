import AgoraRTC from 'agora-rtc-sdk';
import { validate, promisify } from './util';
import {
  FIELD_AUDIO_INPUT,
  FIELD_VIDEO_INPUT,
  ELEMENT_LOCAL_STREAM,
} from './constraint';

export async function getDevices(): Promise<{
  cameras: Array<Device>;
  mics: Array<Device>;
}> {
  const pGetDevices = promisify(AgoraRTC.getDevices);
  const devices = await pGetDevices();
  const cameras: Array<Device> = [];
  const mics: Array<Device> = [];

  devices.forEach((device: Device) => {
    device.kind === FIELD_AUDIO_INPUT && mics.push(device);
    device.kind === FIELD_VIDEO_INPUT && cameras.push(device);
  });

  return { cameras, mics };
}

export async function getCodecs(): Promise<Array<SelectOption>> {
  const allCodecs = await AgoraRTC.getSupportedCodec();
  const codecs: Array<SelectOption> = allCodecs.video.map((codec: string) => ({
    name: codec,
    value: codec,
  }));

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
    console.log('init client succ');

    const pJoin = promisify(client.join);
    const uid: string = await pJoin(data.token, data.channel, data.uid);
    console.log('join channel succ');

    return { client, uid };
  } catch (err) {
    throw(`init client failed: ${err}`);
  }
}

async function initLocalStream(
  data: RTCData,
): Promise<AgoraRTC.Stream> {
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
    console.log('init local stream success');

    localStream.play(ELEMENT_LOCAL_STREAM);
    return localStream;
  } catch (err) {
    throw(`init local stream failed: ${err}`);
  }
}

export async function join(rtc: RTC, data: RTCData): Promise<void> {
  if (rtc.joined) {
    alert('Already joined');
    return;
  }
  const msg = validate(data);
  if (msg) {
    alert(msg);
    return;
  }

  try {
    const { client, uid } = await initClient(data);
    const localStream = await initLocalStream(data);
    await publish(rtc);
  } catch (err) {
    alert(`join failed: ${err}`);
  }
}

export async function publish(rtc: RTC): Promise<void> {
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
    await pPublish(rtc.localStream);
    console.log('publish succ');
    setRtc((rtc) => ({ ...rtc, publish: true }));
  } catch (err) {
    alert(`publish failed: ${err}`);
  }
}

export async function unpublish(rtc: RTC): Promise<void> {
  try {
    if (!rtc.client) {
      alert('Please join channel first');
      return;
    }
    if (!rtc.published) {
      alert("Haven't published");
      return;
    }

    const pUnpublish = promisify(rtc.client.unpublish);
    await pUnpublish(rtc.localStream);
    console.log('unpublish succ');
    setRtc((rtc) => ({ ...rtc, publish: false }));
  } catch (err) {
    alert(`unpublish failed: ${err}`);
  }
}