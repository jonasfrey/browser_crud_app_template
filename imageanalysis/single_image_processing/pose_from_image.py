import cv2
import os
import sys

# Import OpenPose
try:
    from openpose import pyopenpose as op
except ImportError:
    print('Error: OpenPose library not found!')
    print('Make sure OpenPose is installed and in your Python path')
    sys.exit(-1)

def detect_pose(image_path):
    """
    Detect human pose in an image
    
    Args:
        image_path: Path to the input image
    """
    # Set up OpenPose parameters
    params = {
        "model_folder": "./models",  # Adjust this path to your OpenPose models folder
    }
    
    # Initialize OpenPose
    opWrapper = op.WrapperPython()
    opWrapper.configure(params)
    opWrapper.start()
    
    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not read image from {image_path}")
        return
    
    # Create datum object
    datum = op.Datum()
    datum.cvInputData = image
    
    # Detect pose
    opWrapper.emplaceAndPop(op.VectorDatum([datum]))
    
    # Print keypoints
    print("Body keypoints detected:")
    print(datum.poseKeypoints)
    
    # Display result
    cv2.imshow("OpenPose - Pose Detection", datum.cvOutputData)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # Example usage
    image_path = "path/to/your/image.jpg"  # Change this to your image path
    detect_pose(image_path)