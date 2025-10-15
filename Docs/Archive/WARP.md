# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project summary
- Python/OpenCV YOLO-based parking-space detection with two primary scripts under "Source Code/":
  - ParkingSpacePicker.py: interactive tool to define parking-space rectangles; saves positions to a pickle file named "CarParkPos".
  - main.py: runs YOLOv3 via OpenCV DNN on a single image and draws detections. Expects yolov3.weights, yolov3.cfg, and an input image (default: parking_lot.jpg) in the working directory.
- No package/virtualenv tooling, no linter config, and no test suite are present.
- README mentions a detect_parking.py CLI, but that file is not present in this repo; use the scripts above instead.

Environment and dependencies
- Requires Python 3, OpenCV (opencv-python), and NumPy.
- YOLOv3 assets (yolov3.weights and yolov3.cfg) must be available in the process working directory for main.py.

Common commands (Windows PowerShell)
- Create and activate a virtual environment
  
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```

- Install dependencies
  
  ```powershell
  pip install opencv-python numpy
  ```

- Optional: verify OpenCV import
  
  ```powershell
  python -c "import cv2, numpy; print(cv2.__version__)"
  ```

- Download/prepare YOLOv3 assets
  
  Place yolov3.weights and yolov3.cfg in the repository root (or run from the directory that contains them). Follow the README link to obtain official weights/config. Ensure the process working directory contains these files when running main.py.

- Run the parking space picker (defines rectangles and persists to CarParkPos)
  
  ```powershell
  python "Source Code/ParkingSpacePicker.py"
  ```
  
  Notes:
  - Expects carParkImg.png in the working directory.
  - Left-click adds a parking-space rectangle origin; right-click removes one within the width/height window (107x48).
  - Positions are saved to a pickle file named CarParkPos in the working directory.

- Run the YOLO detection script on a static image
  
  ```powershell
  python "Source Code/main.py"
  ```
  
  Notes:
  - Expects yolov3.weights, yolov3.cfg, and parking_lot.jpg in the working directory.
  - The script uses OpenCV DNN to forward the image through YOLO and draws rectangles for detections.

Testing and linting
- No configured tests or linters were found (no pytest/pytest.ini, flake8 config, mypy config, or tox). If tests or linting are added later, update this file with the canonical commands (e.g., pytest, flake8, ruff, or mypy).

Repository structure (high-level)
- README.md: high-level project overview and installation notes (references detect_parking.py which is not present).
- Source Code/
  - ParkingSpacePicker.py: interactive ROI selection; writes CarParkPos via pickle.
  - main.py: OpenCV DNN YOLOv3 single-image inference; requires weights/cfg and input image in CWD.
- No CI, agent rule files (Claude/Copilot/Cursor), or Makefile detected.

Operational notes for Warp agents
- Paths contain a space ("Source Code"); always quote paths when invoking Python scripts.
- Both scripts use relative paths; run them from the directory where the expected assets reside (weights/cfg, images, and CarParkPos).
- If you need webcam/video or CLI argument handling, you will need to extend main.py (the current code processes a single image).