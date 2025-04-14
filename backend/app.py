from flask import Flask, request, jsonify, send_from_directory
import os
import tensorflow as tf
import numpy as np
import cv2
from flask_cors import CORS  # Import CORS



app = Flask(__name__)
CORS(app)

# Paths
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
MODEL_PATH = "satellite_segmentation_full.h5"

# Create folders if not exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Load model
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

# Define class colors
class_colors = {
    0: (226, 169, 41),   # Water
    1: (132, 41, 246),   # Land
    2: (110, 193, 228),  # Road
    3: (60, 16, 152),    # Building
    4: (254, 221, 58),   # Vegetation
    5: (155, 155, 155)   # Unlabeled
}

def preprocess_image(image_path, target_size=(256, 256)):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Error: Failed to load image at {image_path}. Check path and format.")
    
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # Convert to RGB (ensure color consistency)
    img = cv2.resize(img, target_size)  # Resize to match model input
    img = img / 255.0  # Normalize (same as training input)
    img = np.expand_dims(img, axis=0)  # Add batch dimension

    return img


def visualize_output(prediction):
    """
    Converts the model's predicted class indices into a correctly color-mapped segmentation image.
    Ensures consistency with the segmentation output colors.
    """
    predicted_classes = np.argmax(prediction[0], axis=-1).astype(np.uint8)  # Get predicted class indices

    # Create an empty RGB image
    output_rgb = np.zeros((*predicted_classes.shape, 3), dtype=np.uint8)

    # Assign each pixel the correct color
    for class_id, color in class_colors.items():
        output_rgb[predicted_classes == class_id] = color  # Apply exact color mapping

    # Convert BGR to RGB for correct visualization
    output_rgb = cv2.cvtColor(output_rgb, cv2.COLOR_BGR2RGB)

    return output_rgb


def detect_changes(seg1, seg2):
    """
    Identifies changes between two segmentation masks.
    Ensures correct color mapping in the difference output.
    """
    seg1_resized = cv2.resize(seg1, (256, 256))
    seg2_resized = cv2.resize(seg2, (256, 256))

    # Convert to grayscale for absolute difference calculation
    gray1 = cv2.cvtColor(seg1_resized, cv2.COLOR_RGB2GRAY)
    gray2 = cv2.cvtColor(seg2_resized, cv2.COLOR_RGB2GRAY)

    # Compute absolute difference
    diff = cv2.absdiff(gray1, gray2)

    # Apply thresholding to retain only significant changes
    _, mask = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

    # Initialize the output change map correctly
    change_map = np.zeros((256, 256, 3), dtype=np.uint8)  # Explicit 3-channel image

    # Create boolean masks for new and removed areas
    added_mask = (mask > 0) & (gray2 > gray1)  # Areas that appeared in new image
    removed_mask = (mask > 0) & (gray1 > gray2)  # Areas that disappeared

    # Assign colors correctly
    change_map[added_mask] = [0, 255, 0]   # Green for new additions
    change_map[removed_mask] = [255, 0, 0] # Red for removed areas

    return change_map



# Serve images
@app.route('/outputs/<filename>')
def get_output(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)

# Main processing route
@app.route("/process-images", methods=["POST"])
def process_images():
    if "images" not in request.files or len(request.files.getlist("images")) < 2:
        return jsonify({"error": "Upload 2 images"}), 400

    files = request.files.getlist("images")
    file_paths = []

    for file in files:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        file_paths.append(file_path)

    # Preprocess & Run Model
    input1 = preprocess_image(file_paths[0])
    input2 = preprocess_image(file_paths[1])
    output1 = model.predict(input1)
    output2 = model.predict(input2)

    # Convert outputs
    seg1 = visualize_output(output1)
    seg2 = visualize_output(output2)
    change_map = detect_changes(seg1, seg2)

    # Save outputs
    seg1_path = os.path.join(OUTPUT_FOLDER, "seg1.png")
    seg2_path = os.path.join(OUTPUT_FOLDER, "seg2.png")
    change_map_path = os.path.join(OUTPUT_FOLDER, "change_map.png")

    cv2.imwrite(seg1_path, seg1)
    cv2.imwrite(seg2_path, seg2)
    cv2.imwrite(change_map_path, change_map)

    return jsonify({
        "seg1": f"/outputs/seg1.png",
        "seg2": f"/outputs/seg2.png",
        "change_map": f"/outputs/change_map.png"
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)
