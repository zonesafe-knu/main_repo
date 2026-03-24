import os
import shutil
from sklearn.model_selection import train_test_split

# 폴더 생성 함수
def create_folder_structure():
    for split in ["train", "val", "test"]:
        os.makedirs(os.path.join(OUTPUT_DIR, split, "images"), exist_ok=True)
        os.makedirs(os.path.join(OUTPUT_DIR, split, "labels"), exist_ok=True)

# 파일 이동 함수
def move_files(file_list, split_name):
    for file_name in file_list:
        # 이미지 이동
        src_img = os.path.join(IMAGE_DIR, file_name)
        dst_img = os.path.join(OUTPUT_DIR, split_name, "images", file_name)
        shutil.copy(src_img, dst_img)

        # 라벨 이동 (.txt)
        label_name = os.path.splitext(file_name)[0] + ".txt"
        src_label = os.path.join(LABEL_DIR, label_name)
        dst_label = os.path.join(OUTPUT_DIR, split_name, "labels", label_name)

        if os.path.exists(src_label):
            shutil.copy(src_label, dst_label)

# 설정해야 하는 정보 ===========================================
# 원본 폴더 경로
IMAGE_DIR = "../Labeling_data"
LABEL_DIR = "../Labeling_output"

# 저장될 YOLO 학습 구조 폴더
OUTPUT_DIR = "./output/training"

# 분할 비율 설정
train_ratio = 0.7
val_ratio = 0.3
test_ratio = 0.0

# 학습-검증-테스트 데이터 분리 ===========================================

# 1.  이미지 파일 목록 불러오기
image_files = [f for f in os.listdir(IMAGE_DIR) if f.endswith((".jpg", ".png", ".jpeg", ".bmp"))]

# 2. train / temp 분리
train_files, temp_files = train_test_split(
    image_files,
    test_size=(1 - train_ratio),
    random_state=42
)

# 3. val / test 분리
val_files, test_files = [], []

if len(temp_files) > 0:
    val_size_adjusted = test_ratio / (val_ratio + test_ratio) if (val_ratio + test_ratio) > 0 else 0
    if val_size_adjusted == 0:
        val_files = temp_files
        test_files = []
    else:
        val_files, test_files = train_test_split(
            temp_files,
            test_size=val_size_adjusted,
            random_state=42
        )

print("Train:", len(train_files))
print("Val:", len(val_files))
print("Test:", len(test_files))

# 4. 실제 이동 실행
create_folder_structure()
move_files(train_files, "train")
move_files(val_files, "val")
move_files(test_files, "test")

print("데이터 분할 완료")