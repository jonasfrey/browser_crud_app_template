# Make sure you have python3-venv installed
# sudo apt install python3-venv python3-full

# # Create a virtual environment
# cd ~/code/media_analyser/openpose
# python3 -m venv venv

# # Activate it
# source venv/bin/activate

# # Your prompt should now show (venv) at the beginning
# # Install PyTorch
# pip install torch torchvision

# # Install other required packages
# pip install transformers accelerate supervision pillow requests numpy
import torch
import requests
import numpy as np
import supervision as sv
from PIL import Image
from transformers import AutoProcessor, RTDetrForObjectDetection, VitPoseForPoseEstimation
from accelerate import Accelerator

def main():
    print("Initializing device...")
    device = Accelerator().device
    print(f"Using device: {device}")

    # Load image
    print("Loading image...")
    url = "https://www.fcbarcelona.com/fcbarcelona/photo/2021/01/31/3c55a19f-dfc1-4451-885e-afd14e890a11/mini_2021-01-31-BARCELONA-ATHLETIC-BILBAOI-30.JPG"
    image = Image.open(requests.get(url, stream=True).raw)
    print(f"Image size: {image.size}")

    # Detect humans in the image
    print("Loading person detection model...")
    person_image_processor = AutoProcessor.from_pretrained("PekingU/rtdetr_r50vd_coco_o365")
    person_model = RTDetrForObjectDetection.from_pretrained("PekingU/rtdetr_r50vd_coco_o365", device_map=device)

    print("Detecting people...")
    inputs = person_image_processor(images=image, return_tensors="pt").to(person_model.device)

    with torch.no_grad():
        outputs = person_model(**inputs)

    results = person_image_processor.post_process_object_detection( 
        outputs, target_sizes=torch.tensor([(image.height, image.width)]), threshold=0.3
    )
    result = results[0]

    # Human label refers to 0 index in COCO dataset
    person_boxes = result["boxes"][result["labels"] == 0]
    person_boxes = person_boxes.cpu().numpy()
    print(f"Found {len(person_boxes)} people")

    if len(person_boxes) == 0:
        print("No people detected in image!")
        return

    # Convert boxes from VOC (x1, y1, x2, y2) to COCO (x1, y1, w, h) format
    person_boxes[:, 2] = person_boxes[:, 2] - person_boxes[:, 0]
    person_boxes[:, 3] = person_boxes[:, 3] - person_boxes[:, 1]

    # Detect keypoints for each person found
    print("Loading pose estimation model...")
    image_processor = AutoProcessor.from_pretrained("usyd-community/vitpose-base-simple")
    model = VitPoseForPoseEstimation.from_pretrained("usyd-community/vitpose-base-simple", device_map=device)

    print("Detecting poses...")
    inputs = image_processor(image, boxes=[person_boxes], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model(**inputs)

    pose_results = image_processor.post_process_pose_estimation(outputs, boxes=[person_boxes])
    image_pose_result = pose_results[0]

    xy = torch.stack([pose_result['keypoints'] for pose_result in image_pose_result]).cpu().numpy()
    scores = torch.stack([pose_result['scores'] for pose_result in image_pose_result]).cpu().numpy()

    key_points = sv.KeyPoints(xy=xy, confidence=scores)

    # Annotate image
    print("Drawing annotations...")
    edge_annotator = sv.EdgeAnnotator(color=sv.Color.GREEN, thickness=2)
    vertex_annotator = sv.VertexAnnotator(color=sv.Color.RED, radius=4)
    
    annotated_frame = np.array(image.copy())
    annotated_frame = edge_annotator.annotate(scene=annotated_frame, key_points=key_points)
    annotated_frame = vertex_annotator.annotate(scene=annotated_frame, key_points=key_points)
    
    # Save result
    output_path = "pose_result.jpg"
    Image.fromarray(annotated_frame).save(output_path)
    print(f"Result saved to {output_path}")
    
    # Also display if possible
    try:
        Image.fromarray(annotated_frame).show()
    except:
        print("Could not display image (no display available)")

if __name__ == "__main__":
    main()