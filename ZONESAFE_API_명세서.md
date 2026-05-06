# ZONESAFE API 명세서

> CNN 활용 작업자 안전관리 솔루션 - 백엔드 API 명세  
> **버전:** v1.0 / **최종 수정일:** 2026.04.26  
> **기술 스택:** Java Spring Boot + MySQL + WebSocket(STOMP)

---

## 1. 개요

### 1.1 Base URL
| 환경 | URL |
|------|-----|
| 개발 | `http://localhost:8080/api/v1` |
| 운영 | `https://zonesafe.{domain}/api/v1` |
| WebSocket | `wss://zonesafe.{domain}/ws` |

### 1.2 인증 방식
- **JWT Bearer Token** 기반 인증
- 모든 API(로그인 제외)는 HTTP Header에 `Authorization: Bearer {access_token}` 필수
- Access Token 유효기간: 1시간 / Refresh Token 유효기간: 7일

### 1.3 공통 응답 형식
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { },
  "timestamp": "2026-04-26T14:30:00Z"
}
```

### 1.4 공통 에러 코드
| HTTP | Code | 설명 |
|------|------|------|
| 400 | `INVALID_PARAMETER` | 잘못된 파라미터 |
| 401 | `UNAUTHORIZED` | 인증 실패 또는 토큰 만료 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 중복 또는 충돌 |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |

### 1.5 페이징 공통 파라미터
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | int | 0 | 페이지 번호(0부터 시작) |
| `size` | int | 20 | 페이지당 항목 수 |
| `sort` | string | `createdAt,desc` | 정렬 기준 |

---

## 2. 인증 API (`/auth`)

### 2.1 로그인
- **POST** `/auth/login`

**Request**
```json
{
  "username": "admin",
  "password": "P@ssw0rd!"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 3600,
    "user": {
      "userId": 1,
      "username": "admin",
      "role": "ADMIN"
    }
  }
}
```

### 2.2 토큰 재발급
- **POST** `/auth/refresh`
```json
{ "refreshToken": "eyJhbGciOi..." }
```

### 2.3 로그아웃
- **POST** `/auth/logout` (토큰 필요)

### 2.4 현재 사용자 정보
- **GET** `/auth/me`

---

## 3. 카메라/사이트 관리 API (`/cameras`)

### 3.1 카메라 목록 조회
- **GET** `/cameras`
- **Query:** `siteId`, `status` (`ONLINE`/`OFFLINE`)

**Response 200**
```json
{
  "data": [
    {
      "cameraId": 1,
      "name": "1번 라인 입구",
      "rtspUrl": "rtsp://...",
      "siteId": 1,
      "siteName": "구미공장 A동",
      "resolution": "1920x1080",
      "fps": 30,
      "status": "ONLINE",
      "lastHeartbeat": "2026-04-26T14:29:55Z"
    }
  ]
}
```

### 3.2 카메라 상세 조회
- **GET** `/cameras/{cameraId}`

### 3.3 카메라 등록
- **POST** `/cameras` (ADMIN)
```json
{
  "name": "1번 라인 입구",
  "rtspUrl": "rtsp://192.168.0.10/stream1",
  "siteId": 1,
  "resolution": "1920x1080",
  "fps": 30
}
```

### 3.4 카메라 수정/삭제
- **PUT** `/cameras/{cameraId}`
- **DELETE** `/cameras/{cameraId}`

### 3.5 실시간 스트림 URL 발급
- **GET** `/cameras/{cameraId}/stream`
- HLS(.m3u8) URL 반환 (웹 대시보드 영상 플레이어용)

```json
{ "data": { "streamUrl": "https://.../live/cam1/index.m3u8", "type": "HLS" } }
```

---

## 4. 위험구역(ROI) 관리 API (`/rois`)

### 4.1 ROI 목록 조회
- **GET** `/rois?cameraId={cameraId}`

**Response 200**
```json
{
  "data": [
    {
      "roiId": 10,
      "cameraId": 1,
      "name": "지게차 진입구역",
      "polygon": [[120,200],[480,200],[480,520],[120,520]],
      "alarmRule": "WORKER_ALONE_OR_INTERACTION",
      "muteForkliftOnly": true,
      "dangerDistanceThreshold": 150,
      "active": true,
      "createdAt": "2026-04-01T09:10:00Z"
    }
  ]
}
```

### 4.2 ROI 생성
- **POST** `/rois`

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `cameraId` | long | O | 대상 카메라 ID |
| `name` | string | O | 구역명 |
| `polygon` | int[][] | O | 다각형 꼭짓점 좌표(픽셀 기준) |
| `alarmRule` | enum | O | `WORKER_ONLY` / `WORKER_ALONE_OR_INTERACTION` / `ANY_OBJECT` |
| `muteForkliftOnly` | bool | X | 지게차 단독 진입 시 뮤팅 여부 (기본 `true`) |
| `dangerDistanceThreshold` | int | X | 위험 판단 거리(px) - 작업자-지게차 간 |
| `active` | bool | X | 활성화 여부 (기본 `true`) |

```json
{
  "cameraId": 1,
  "name": "지게차 진입구역",
  "polygon": [[120,200],[480,200],[480,520],[120,520]],
  "alarmRule": "WORKER_ALONE_OR_INTERACTION",
  "muteForkliftOnly": true,
  "dangerDistanceThreshold": 150,
  "active": true
}
```

### 4.3 ROI 수정/삭제/상세
- **GET** `/rois/{roiId}`
- **PUT** `/rois/{roiId}`
- **PATCH** `/rois/{roiId}/active` — 활성화 토글
- **DELETE** `/rois/{roiId}`

---

## 5. 알람/이벤트 API (`/alarms`)

### 5.1 알람 목록 조회 (필터/페이징)
- **GET** `/alarms`

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `cameraId` | long | 카메라 필터 |
| `roiId` | long | ROI 필터 |
| `severity` | enum | `INFO`/`WARN`/`DANGER` |
| `type` | enum | `WORKER_INTRUSION`/`WORKER_FORKLIFT_PROXIMITY`/`UNKNOWN_OBJECT` |
| `status` | enum | `NEW`/`ACK`/`RESOLVED` |
| `from` | datetime | 시작 시각 (ISO-8601) |
| `to` | datetime | 종료 시각 |
| `page`, `size`, `sort` | - | 공통 페이징 |

**Response 200**
```json
{
  "data": {
    "content": [
      {
        "alarmId": 1024,
        "cameraId": 1,
        "cameraName": "1번 라인 입구",
        "roiId": 10,
        "roiName": "지게차 진입구역",
        "severity": "DANGER",
        "type": "WORKER_FORKLIFT_PROXIMITY",
        "status": "NEW",
        "message": "작업자-지게차 근접 (거리 92px)",
        "detections": [
          { "label": "worker",   "trackId": 17, "bbox": [340,210,420,470], "confidence": 0.91 },
          { "label": "forklift", "trackId": 33, "bbox": [430,250,610,500], "confidence": 0.94 }
        ],
        "clipId": 5012,
        "snapshotUrl": "https://.../alarms/1024/snapshot.jpg",
        "occurredAt": "2026-04-26T14:21:33Z"
      }
    ],
    "page": 0, "size": 20, "totalElements": 137, "totalPages": 7
  }
}
```

### 5.2 알람 상세 조회
- **GET** `/alarms/{alarmId}`

### 5.3 알람 확인/해제
- **PATCH** `/alarms/{alarmId}/ack` — 확인(ACK) 처리
- **PATCH** `/alarms/{alarmId}/resolve`
```json
{ "comment": "현장 확인 완료. 작업자 안전구역으로 이동" }
```

### 5.4 알람 일괄 처리
- **POST** `/alarms/bulk-ack`
```json
{ "alarmIds": [1024, 1025, 1026] }
```

---

## 6. 비디오 클립 API (`/clips`)

> 위험 발생 시점 전후 5초(총 10초) 자동 저장된 클립을 관리합니다.

### 6.1 클립 목록 조회
- **GET** `/clips?cameraId=1&from=...&to=...`

```json
{
  "data": {
    "content": [
      {
        "clipId": 5012,
        "alarmId": 1024,
        "cameraId": 1,
        "duration": 10,
        "fileSize": 2458123,
        "format": "mp4",
        "downloadUrl": "/api/v1/clips/5012/download",
        "streamUrl": "/api/v1/clips/5012/stream",
        "thumbnailUrl": "/api/v1/clips/5012/thumbnail",
        "occurredAt": "2026-04-26T14:21:33Z",
        "startAt":   "2026-04-26T14:21:28Z",
        "endAt":     "2026-04-26T14:21:38Z"
      }
    ]
  }
}
```

### 6.2 클립 다운로드
- **GET** `/clips/{clipId}/download` → `application/octet-stream` (mp4)

### 6.3 클립 스트리밍
- **GET** `/clips/{clipId}/stream` → `video/mp4` (Range Request 지원)

### 6.4 썸네일
- **GET** `/clips/{clipId}/thumbnail` → `image/jpeg`

### 6.5 클립 삭제
- **DELETE** `/clips/{clipId}` (ADMIN)

---

## 7. 실시간 탐지 결과 API (`/detections`)

### 7.1 최근 탐지 결과 스냅샷
- **GET** `/detections/latest?cameraId={cameraId}`

```json
{
  "data": {
    "cameraId": 1,
    "frameTimestamp": "2026-04-26T14:30:00.123Z",
    "objects": [
      { "trackId": 17, "label": "worker",   "bbox": [340,210,420,470], "confidence": 0.91, "inRoi": [10] },
      { "trackId": 33, "label": "forklift", "bbox": [430,250,610,500], "confidence": 0.94, "inRoi": [10] }
    ],
    "fps": 28.4,
    "modelVersion": "yolov8m_zonesafe_v3"
  }
}
```

---

## 8. 통계/대시보드 API (`/stats`)

### 8.1 대시보드 요약
- **GET** `/stats/summary?from=...&to=...`

```json
{
  "data": {
    "totalAlarms": 47,
    "byseverity": { "INFO": 12, "WARN": 23, "DANGER": 12 },
    "totalClips": 12,
    "activeCameras": 4,
    "totalCameras": 5,
    "avgFps": 27.8
  }
}
```

### 8.2 시계열 알람 통계
- **GET** `/stats/alarms/timeseries?interval=hour|day|week&from=...&to=...`

```json
{
  "data": [
    { "bucket": "2026-04-26T13:00:00Z", "INFO": 1, "WARN": 3, "DANGER": 2 },
    { "bucket": "2026-04-26T14:00:00Z", "INFO": 0, "WARN": 1, "DANGER": 1 }
  ]
}
```

### 8.3 카메라별 알람 통계
- **GET** `/stats/alarms/by-camera?from=...&to=...`

### 8.4 객체 클래스별 탐지 통계
- **GET** `/stats/detections/by-class?cameraId=...&from=...&to=...`

---

## 9. 모델 관리 API (`/models`) — ADMIN

### 9.1 모델 목록
- **GET** `/models`
```json
{
  "data": [
    {
      "modelId": 1,
      "name": "yolov8m_zonesafe_v3",
      "version": "v3",
      "format": "PyTorch",
      "mAP50": 0.912,
      "mAP50_95": 0.687,
      "fps": 28.4,
      "active": true,
      "createdAt": "2026-04-10T10:00:00Z"
    }
  ]
}
```

### 9.2 활성 모델 변경
- **PATCH** `/models/{modelId}/activate`

### 9.3 ONNX 변환 작업
- **POST** `/models/{modelId}/export`
```json
{ "format": "ONNX" }
```

### 9.4 오토 라벨링 작업
- **POST** `/models/auto-label`
```json
{
  "modelId": 1,
  "imageSetId": 12,
  "confidenceThreshold": 0.5
}
```

- **GET** `/models/auto-label/jobs/{jobId}` — 작업 상태 조회
```json
{
  "data": {
    "jobId": "ab12-...",
    "status": "RUNNING",
    "progress": 0.42,
    "totalImages": 1000,
    "processed": 420
  }
}
```

---

## 10. 사용자 관리 API (`/users`) — ADMIN

| Method | Path | 설명 |
|--------|------|------|
| GET | `/users` | 사용자 목록 |
| POST | `/users` | 사용자 생성 |
| GET | `/users/{userId}` | 상세 조회 |
| PUT | `/users/{userId}` | 정보 수정 |
| PATCH | `/users/{userId}/password` | 비밀번호 변경 |
| DELETE | `/users/{userId}` | 삭제 |

**Role:** `ADMIN` / `OPERATOR` / `VIEWER`

---

## 11. WebSocket API (실시간 채널)

### 11.1 연결
- **Endpoint:** `wss://zonesafe.{domain}/ws`
- **프로토콜:** STOMP over WebSocket (SockJS 호환)
- **인증:** 연결 시 `Authorization` 헤더에 JWT 전달

### 11.2 구독 토픽

| 토픽 | 설명 | 페이로드 |
|------|------|---------|
| `/topic/alarms` | 전체 알람 브로드캐스트 | `AlarmEvent` |
| `/topic/alarms/camera/{cameraId}` | 카메라별 알람 | `AlarmEvent` |
| `/topic/detections/{cameraId}` | 실시간 탐지 결과(프레임 단위) | `DetectionFrame` |
| `/topic/cameras/{cameraId}/status` | 카메라 상태 변경 | `CameraStatus` |

### 11.3 페이로드 예시

**AlarmEvent**
```json
{
  "alarmId": 1024,
  "cameraId": 1,
  "roiId": 10,
  "severity": "DANGER",
  "type": "WORKER_FORKLIFT_PROXIMITY",
  "message": "작업자-지게차 근접 (거리 92px)",
  "snapshotUrl": "https://.../alarms/1024/snapshot.jpg",
  "occurredAt": "2026-04-26T14:21:33.456Z"
}
```

**DetectionFrame** (고빈도 — 클라이언트는 화면 표시용으로만 사용)
```json
{
  "cameraId": 1,
  "frameTs": "2026-04-26T14:30:00.123Z",
  "objects": [
    { "trackId": 17, "label": "worker",   "bbox": [340,210,420,470], "confidence": 0.91 },
    { "trackId": 33, "label": "forklift", "bbox": [430,250,610,500], "confidence": 0.94 }
  ]
}
```

### 11.4 발행(클라이언트 → 서버)
| 목적지 | 설명 |
|--------|------|
| `/app/ack` | 알람 즉시 ACK (페이로드: `{ "alarmId": 1024 }`) |

---

## 12. 데이터 모델 (주요 엔티티)

### Camera
| 필드 | 타입 | 설명 |
|------|------|------|
| cameraId | long | PK |
| name | string | 카메라명 |
| rtspUrl | string | RTSP 주소 |
| siteId | long | 소속 사이트 |
| resolution | string | 해상도 |
| fps | int | 프레임레이트 |
| status | enum | `ONLINE`/`OFFLINE` |

### Roi
| 필드 | 타입 | 설명 |
|------|------|------|
| roiId | long | PK |
| cameraId | long | FK |
| name | string | 구역명 |
| polygon | json | 다각형 꼭짓점 배열 |
| alarmRule | enum | 알람 규칙 |
| muteForkliftOnly | bool | 지게차 단독 시 뮤팅 |
| dangerDistanceThreshold | int | 위험 거리 임계(px) |
| active | bool | 활성화 |

### Alarm
| 필드 | 타입 | 설명 |
|------|------|------|
| alarmId | long | PK |
| cameraId | long | FK |
| roiId | long | FK (nullable) |
| severity | enum | `INFO`/`WARN`/`DANGER` |
| type | enum | 알람 타입 |
| status | enum | `NEW`/`ACK`/`RESOLVED` |
| message | string | 메시지 |
| detectionsJson | json | 탐지 객체 배열 |
| clipId | long | 연관 클립(nullable) |
| occurredAt | datetime | 발생 시각 |

### Clip
| 필드 | 타입 | 설명 |
|------|------|------|
| clipId | long | PK |
| alarmId | long | FK |
| cameraId | long | FK |
| filePath | string | 서버 저장 경로 |
| duration | int | 길이(초) |
| startAt / endAt | datetime | 클립 시작/종료 시각 |

### User
| 필드 | 타입 | 설명 |
|------|------|------|
| userId | long | PK |
| username | string | 로그인 ID |
| passwordHash | string | BCrypt 해시 |
| role | enum | `ADMIN`/`OPERATOR`/`VIEWER` |

---

## 13. Enum 정의

```text
Severity      : INFO | WARN | DANGER
AlarmType     : WORKER_INTRUSION | WORKER_FORKLIFT_PROXIMITY | UNKNOWN_OBJECT
AlarmStatus   : NEW | ACK | RESOLVED
AlarmRule     : WORKER_ONLY | WORKER_ALONE_OR_INTERACTION | ANY_OBJECT
ObjectLabel   : worker | forklift
CameraStatus  : ONLINE | OFFLINE
Role          : ADMIN | OPERATOR | VIEWER
```

---

## 14. 변경 이력
| 버전 | 일자 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| v1.0 | 2026-04-26 | 최초 작성 | ZONESAFE 팀 |
