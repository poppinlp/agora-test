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

interface RTCData {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  mode: string;
  codec: string;
  camera: string;
  mic: string;
  resolution: string;
}

interface RTCOptions {
  modes: Array<SelectOption>;
  codecs: Array<SelectOption>;
  cameras: Array<Device>;
  mics: Array<Device>;
  resolutions: Array<SelectOption>;
}

interface AppProps {}