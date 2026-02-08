import torch
import requests
import numpy as np
import json
import csv
from PIL import Image
from transformers import AutoProcessor, RTDetrForObjectDetection, VitPoseForPoseEstimation

# COCO keypoint names (17 keypoints)
COCO_KEYPOINT_NAMES = [
    "nose",
    "left_eye",
    "right_eye", 
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle"
]

def main():
    print("Initializing...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load image
    print("Loading image...")
    # url = "https://www.fcbarcelona.com/fcbarcelona/photo/2021/01/31/3c55a19f-dfc1-4451-885e-afd14e890a11/mini_2021-01-31-BARCELONA-ATHLETIC-BILBAOI-30.JPG"
    # image = Image.open(requests.get(url, stream=True).raw)

    image_path = "sample_image.jpg"  # Replace with your local image path
    image = Image.open(image_path)
    
    # Detect people
    print("Detecting people...")
    person_image_processor = AutoProcessor.from_pretrained("PekingU/rtdetr_r50vd_coco_o365")
    person_model = RTDetrForObjectDetection.from_pretrained("PekingU/rtdetr_r50vd_coco_o365").to(device)

    inputs = person_image_processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = person_model(**inputs)

    results = person_image_processor.post_process_object_detection(
        outputs, target_sizes=torch.tensor([(image.height, image.width)]).to(device), threshold=0.3
    )
    result = results[0]

    person_boxes = result["boxes"][result["labels"] == 0]
    person_boxes = person_boxes.cpu().numpy()
    print(f"Found {len(person_boxes)} people")

    if len(person_boxes) == 0:
        print("No people detected!")
        return

    # Convert boxes
    person_boxes[:, 2] = person_boxes[:, 2] - person_boxes[:, 0]
    person_boxes[:, 3] = person_boxes[:, 3] - person_boxes[:, 1]

    # Detect poses
    print("Detecting poses...")
    image_processor = AutoProcessor.from_pretrained("usyd-community/vitpose-base-simple")
    model = VitPoseForPoseEstimation.from_pretrained("usyd-community/vitpose-base-simple").to(device)

    inputs = image_processor(image, boxes=[person_boxes], return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)

    pose_results = image_processor.post_process_pose_estimation(outputs, boxes=[person_boxes])
    image_pose_result = pose_results[0]

    # Extract keypoint data
    xy = torch.stack([pose_result['keypoints'] for pose_result in image_pose_result]).cpu().numpy()
    scores = torch.stack([pose_result['scores'] for pose_result in image_pose_result]).cpu().numpy()

    print(f"\n{'='*60}")
    print(f"POSE DATA EXTRACTED")
    print(f"{'='*60}")
    print(f"Number of people: {len(xy)}")
    print(f"Keypoints per person: {len(xy[0])}")
    print(f"Shape of xy array: {xy.shape}")  # (num_people, num_keypoints, 2)
    print(f"Shape of scores array: {scores.shape}")  # (num_people, num_keypoints)
    
    # ====== FORMAT 1: Structured Dictionary ======
    pose_data = []
    for person_idx in range(len(xy)):
        person = {
            "person_id": person_idx,
            "keypoints": []
        }
        
        for kp_idx in range(len(xy[person_idx])):
            keypoint = {
                "name": COCO_KEYPOINT_NAMES[kp_idx],
                "x": float(xy[person_idx][kp_idx][0]),
                "y": float(xy[person_idx][kp_idx][1]),
                "confidence": float(scores[person_idx][kp_idx])
            }
            person["keypoints"].append(keypoint)
        
        pose_data.append(person)
    
    # Save as JSON
    with open("pose_data.json", "w") as f:
        json.dump(pose_data, f, indent=2)
    print("\n✅ Saved: pose_data.json")
    
    # ====== FORMAT 2: CSV (flat format) ======
    with open("pose_data.csv", "w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["person_id", "keypoint_name", "x", "y", "confidence"])
        
        for person_idx in range(len(xy)):
            for kp_idx in range(len(xy[person_idx])):
                writer.writerow([
                    person_idx,
                    COCO_KEYPOINT_NAMES[kp_idx],
                    xy[person_idx][kp_idx][0],
                    xy[person_idx][kp_idx][1],
                    scores[person_idx][kp_idx]
                ])
    
    print("✅ Saved: pose_data.csv")
    
    # ====== FORMAT 3: NumPy arrays ======
    np.save("pose_keypoints_xy.npy", xy)
    np.save("pose_keypoints_scores.npy", scores)
    print("✅ Saved: pose_keypoints_xy.npy")
    print("✅ Saved: pose_keypoints_scores.npy")
    
    # ====== FORMAT 4: Human-readable text ======
    with open("pose_data.txt", "w") as f:
        for person_idx in range(len(xy)):
            f.write(f"\n{'='*60}\n")
            f.write(f"PERSON {person_idx + 1}\n")
            f.write(f"{'='*60}\n")
            
            for kp_idx in range(len(xy[person_idx])):
                name = COCO_KEYPOINT_NAMES[kp_idx]
                x = xy[person_idx][kp_idx][0]
                y = xy[person_idx][kp_idx][1]
                conf = scores[person_idx][kp_idx]
                
                f.write(f"{name:15s} | x: {x:7.2f} | y: {y:7.2f} | confidence: {conf:.3f}\n")
    
    print("✅ Saved: pose_data.txt")
    
    # ====== Print sample data ======
    print(f"\n{'='*60}")
    print("SAMPLE DATA (Person 0):")
    print(f"{'='*60}")
    for kp_idx in range(min(5, len(xy[0]))):  # Show first 5 keypoints
        name = COCO_KEYPOINT_NAMES[kp_idx]
        x = xy[0][kp_idx][0]
        y = xy[0][kp_idx][1]
        conf = scores[0][kp_idx]
        print(f"{name:15s} | x: {x:7.2f} | y: {y:7.2f} | confidence: {conf:.3f}")
    print("... (see pose_data.txt for complete data)")
    
    print(f"\n{'='*60}")
    print("FILES SAVED:")
    print(f"{'='*60}")
    print("📄 pose_data.json  - Structured JSON format")
    print("📊 pose_data.csv   - Spreadsheet format")
    print("🔢 pose_*.npy      - NumPy arrays (for Python)")
    print("📝 pose_data.txt   - Human-readable text")

if __name__ == "__main__":
    main()