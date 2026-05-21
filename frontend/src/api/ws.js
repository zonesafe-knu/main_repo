// STOMP over WebSocket 연결 매니저 (명세 §11).
// 백엔드 WebSocketConfig 는 SockJS 미사용 → 순수 WebSocket(ws://) 사용.

import { Client } from '@stomp/stompjs';
import { BASE_URL } from './client';

const buildWsUrl = () => {
  const u = new URL(BASE_URL);
  const protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${u.host}/ws`;
};

let client = null;
let connectPromise = null;

const getClient = () => {
  if (client) return client;
  client = new Client({
    brokerURL: buildWsUrl(),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
  });
  return client;
};

const ensureConnected = () => {
  const c = getClient();
  if (c.connected) return Promise.resolve(c);
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    c.onConnect = () => {
      connectPromise = null;
      resolve(c);
    };
    c.onStompError = (frame) => {
      connectPromise = null;
      reject(new Error(frame.headers?.message ?? 'STOMP error'));
    };
    if (!c.active) c.activate();
  });
  return connectPromise;
};

// 구독 — destination 메시지마다 callback(parsedBody) 호출. unsubscribe 함수 반환.
export const subscribe = async (destination, callback) => {
  const c = await ensureConnected();
  const sub = c.subscribe(destination, (frame) => {
    let body;
    try { body = JSON.parse(frame.body); } catch { body = frame.body; }
    callback(body);
  });
  return () => {
    try { sub.unsubscribe(); } catch { /* noop */ }
  };
};

// 발행 (예: /app/ack 알람 ACK)
export const publish = (destination, body) => {
  const c = getClient();
  if (!c.connected) return;
  c.publish({ destination, body: JSON.stringify(body) });
};