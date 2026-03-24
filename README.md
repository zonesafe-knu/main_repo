# 📌 프로젝트 환경 구축 및 데이터셋 준비 가이드

본 문서는 영상 기반 객체 탐지 모델(YOLO)을 구축하기 위한 전체 준비 과정을 정리한 것이다.

---

# 1. Anaconda 설치

## 1.1 설치 목적

* Python10 이상과 충돌발생
* 가상환경 설정

## 1.2 설치 방법

1. Anaconda 공식 사이트 접속
2. Windows 64-bit Installer 다운로드
3. 설치 진행

### ⚠️ 설치 옵션

* Add to PATH: ❌ 체크하지 않음
* Register as default Python: ⭕ 체크

---

# 2. 가상환경 생성

## 2.1 환경 생성
* conda bash 실행 

```bash
conda create -n labeling_env python=3.9 -y
```

## 2.2 환경 활성화

```bash
conda activate labeling_env
```

## 2.3 확인

```bash
(labeling_env)
```

## 추가. 가상환경 비활성화
```bash
conda deactivate
```
---

# 3. LabelImg 설치 및 실행

## 3.1 설치

```bash
pip install labelImg
```

## 3.2 실행

```bash
labelImg
```

또는

```bash
python -m labelImg
```

---

# 5. 라벨링 작업

## 이부분은 멘토 제공 자료 참고

---



# 7. 데이터셋 분할 (scikit-learn)

## 7.1 목적

* 모델 학습/검증/평가

## 7.2 비율

| 구분    | 비율  |
| ----- | --- |
| train | 70% |
| val   | 20% |
| test  | 10% |

---

## 7.3 코드 예시
* Labeling/data_splitter.py 코드 참고
---

# 8. 최종 데이터셋 구조

```
dataset/
  images/
    train/
    val/
    test/
  labels/
    train/
    val/
    test/
```

---

# 9. YOLO 학습용 설정 파일

## dataset.yaml

```yaml
path: dataset
train: images/train
val: images/val

test: images/test

names:
  0: person
  1: forklift
```

---

# 10. 전체 프로세스 정리

```
Anaconda 설치
→ 가상환경 생성
→ LabelImg 설치
→ 오류 수정
→ 이미지 라벨링
→ 데이터 검수
→ 데이터셋 분할
→ YOLO 학습 준비
```

---

# 11. 주요 문제 및 해결 요약

```
1. conda activate 오류: conda는 기본적으로 cmd/PowerShell 기반임. Git Bash 사용시 명령어 인식 안될 수 있음.

---
