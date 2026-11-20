import { fetchPushKey, pushSubscribe, pushUnsubscribe } from './api';

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const keyToBytes = (b64url) => {
  const padded = (b64url + '='.repeat((4 - (b64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

const getRegistration = () => navigator.serviceWorker.getRegistration();

// 'unsupported' | 'unavailable' (el servidor no tiene claves) | 'denied' | 'off' | 'on'
export const getPushStatus = async () => {
  if (!supported()) return 'unsupported';
  try { await fetchPushKey(); } catch { return 'unavailable'; }
  if (Notification.permission === 'denied') return 'denied';
  const reg = await getRegistration();
  if (!reg) return 'unsupported';
  return (await reg.pushManager.getSubscription()) ? 'on' : 'off';
};

export const enablePush = async () => {
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('denied');
  const { data } = await fetchPushKey();
  const reg = await getRegistration();
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(data.key) });
  await pushSubscribe(sub.toJSON());
};

export const disablePush = async () => {
  const sub = await (await getRegistration())?.pushManager.getSubscription();
  if (!sub) return;
  await pushUnsubscribe(sub.endpoint);
  await sub.unsubscribe();
};
