// 현재 재생 중인 영상의 videoId 와 <video> ref 를 전역으로 공유.
// AlarmToaster 같이 Monitoring 외부에 있는 컴포넌트가 영상 재생 위치(currentTime)를 알아야 할 때 사용.
// 모듈 싱글톤이라 React state 가 아니지만, 변경 빈도가 낮고 읽는 쪽이 폴링하므로 충분하다.

let activeVideoId = null;
let activeVideoElRef = null; // <video> 의 useRef 객체

export function setActiveVideo(videoId, videoElRef) {
  activeVideoId = videoId;
  activeVideoElRef = videoElRef;
}

export function clearActiveVideo() {
  activeVideoId = null;
  activeVideoElRef = null;
}

// <video> 가 실제로 마운트되어 있을 때만 videoId 반환 — 없으면 null.
export function getActiveVideoId() {
  return activeVideoElRef?.current ? activeVideoId : null;
}

// 현재 재생 위치(초). <video> 미마운트 시 null.
export function getActiveVideoTime() {
  const el = activeVideoElRef?.current;
  return el ? el.currentTime : null;
}
