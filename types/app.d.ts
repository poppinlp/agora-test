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
  loading: boolean;
  joined: boolean;
  published: boolean;
}

interface RTCData {
  appId: string;
  channel: string;
  token: string;
  uid: string;
  mode: string;
  codec: string;
  camera: string;
  mic: string;
  resolution: string;
  [index: string]: string;
}

interface RTCOptions {
  modes: Array<SelectOption>;
  codecs: Array<SelectOption>;
  cameras: Array<SelectOption>;
  mics: Array<SelectOption>;
  resolutions: Array<SelectOption>;
  [index: string]: Array<SelectOption>;
}

interface Updater {
  (prev: any): any;
}

interface AppProps {}

interface InputProps {
  title: string;
  updater: Updater;
  dataKey: string;
}

interface TextInputProps extends InputProps {
  placeholder: string;
}

interface SelectProps extends InputProps {
  options: Array<SelectOption>;
}

interface RadioProps extends InputProps {
  options: Array<SelectOption>;
  current: string;
}

interface StreamPlayer{
  title: string;
  prefix: string;
  streams: Array<AgoraRTC.Stream | null>;
}
