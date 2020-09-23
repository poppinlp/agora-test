import { APPID, CHANNEL, TEMP_TOKEN, DEFAULT_UID, DEFAULT_MODE, DEFAULT_RESOLUTION, MODES, RESOLUTIONS } from './constraint.js';
export const makeDefaultRtc = () => ({
  client: null,
  localStream: null,
  remoteStreams: [],
  loading: false,
  joined: false,
  published: false
});
export const makeDefaultRtcData = () => ({
  appId: APPID,
  channel: CHANNEL,
  token: TEMP_TOKEN,
  uid: DEFAULT_UID,
  mode: DEFAULT_MODE,
  codec: '',
  camera: '',
  mic: '',
  resolution: DEFAULT_RESOLUTION
});
export const makeDefaultRtcOptions = () => ({
  modes: MODES,
  codecs: [],
  cameras: [],
  mics: [],
  resolutions: RESOLUTIONS
});
export const promisify = (fn, hasSucc = true) => (...args) => new Promise((resolve, reject) => {
  if (hasSucc) {
    fn(...args, resolve, reject);
  } else {
    fn(...args, reject);
    resolve();
  }
});

const isFunction = obj => Reflect.toString.call(obj) === '[object Function]';

export const updateState = (fn, data) => {
  fn(prev => isFunction(data) ? data(prev) : { ...prev,
    ...data
  });
};
export const validate = data => {
  const emptySet = new Set([undefined, null, '']);

  for (const field of Object.keys(data)) {
    if (emptySet.has(data[field])) {
      throw `${field} should not be empty`;
    }
  }
};
export const showError = msg => {
  alert(msg);
};
export const log = (...args) => {
  console.log('[poppinl]', ...args);
};