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
  loading: false,
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

export const promisify = (fn: any, hasSucc = true) => (
  ...args: Array<any>
): Promise<any> =>
  new Promise((resolve, reject) => {
    if (hasSucc) {
      fn(...args, resolve, reject);
    } else {
      fn(...args, reject);
      resolve();
    }
  });

const isFunction = (obj: any) =>
  Reflect.toString.call(obj) === '[object Function]';

export const updateState = (fn: Updater, data: any) => {
  fn((prev: any) => (isFunction(data) ? data(prev) : { ...prev, ...data }));
};

export const validate = (data: any): void => {
  const emptySet = new Set([undefined, null, '']);
  for (const field of Object.keys(data)) {
    if (emptySet.has(data[field])) {
      throw `${field} should not be empty`;
    }
  }
};

export const showError = (msg: string): void => {
  alert(msg);
};

export const log = (...args: Array<any>): void => {
  console.log('[poppinl]', ...args);
};
