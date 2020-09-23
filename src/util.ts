import {
  APPID,
  CHANNEL,
  TEMP_TOKEN,
  DEFAULT_UID,
  DEFAULT_MODE,
  DEFAULT_RESOLUTION,
  MODES,
  RESOLUTIONS,
} from './constraint';

export const makeDefaultRtc = (): RTC => ({
  client: null,
  localStream: null,
  remoteStreams: [],
  joined: false,
  published: false,
});

export const makeDefaultRtcData = (): RTCData => ({
  appId: APPID,
  channel: CHANNEL,
  token: TEMP_TOKEN,
  uid: DEFAULT_UID,
  mode: DEFAULT_MODE,
  codec: '',
  camera: '',
  mic: '',
  resolution: DEFAULT_RESOLUTION,
});

export const makeDefaultRtcOptions = (): RTCOptions => ({
  modes: MODES,
  codecs: [],
  cameras: [],
  mics: [],
  resolutions: RESOLUTIONS,
});

export const promisify = (fn: any) => (...args: Array<any>): Promise<any> =>
  new Promise((resolve, reject) => {
    fn(...args, resolve, reject);
  });

export const updateState = (
  fn: {
    (prev: any): any;
  },
  data: any,
) => {
  fn((prev: any) => ({ ...prev, data }));
};

export const validate = (data: any): string | boolean => {
  for (const field of Object.keys(data)) {
    if (data[field] === undefined || data[field] === '') {
      return `${field} should not be empty`;
    }
  }
  return false;
};
