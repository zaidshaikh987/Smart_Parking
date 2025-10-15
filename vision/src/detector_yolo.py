"""
YOLOv8-based Parking Slot Detection
Uses pre-trained YOLOv8 model to detect vehicles in parking slots
"""
import cv2
import numpy as np
from ultralytics import YOLO
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger(__name__)


class YOLODetector:
    """YOLO-based parking slot occupancy detector"""
    
    def __init__(self, model_path: str = "yolov8n.pt", confidence_threshold: float = 0.5):
        """
        Initialize YOLO detector
        
        Args:
            model_path: Path to YOLO model weights
            confidence_threshold: Minimum confidence for detections
        """
        self.confidence_threshold = confidence_threshold
        self.vehicle_classes = [2, 3, 5, 7]  # car, motorcycle, bus, truck in COCO dataset
        
        try:
            logger.info(f"Loading YOLO model: {model_path}")
            self.model = YOLO(model_path)
            logger.info("YOLO model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise
    
    def point_in_polygon(self, point: Tuple[int, int], polygon: List[List[int]]) -> bool:
        """
        Check if a point is inside a polygon using ray casting algorithm
        
        Args:
            point: (x, y) coordinates
            polygon: List of [x, y] points defining the polygon
            
        Returns:
            True if point is inside polygon
        """
        x, y = point
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
    
    def box_in_polygon(self, box: Tuple[int, int, int, int], polygon: List[List[int]], 
                       overlap_threshold: float = 0.5) -> bool:
        """
        Check if a bounding box overlaps with a polygon
        
        Args:
            box: (x1, y1, x2, y2) bounding box coordinates
            polygon: List of [x, y] points defining the polygon
            overlap_threshold: Minimum overlap ratio to consider as occupied
            
        Returns:
            True if box sufficiently overlaps with polygon
        """
        x1, y1, x2, y2 = box
        
        # Sample points in the bounding box
        box_width = x2 - x1
        box_height = y2 - y1
        
        # Sample grid of points
        grid_size = 5
        points_inside = 0
        total_points = grid_size * grid_size
        
        for i in range(grid_size):
            for j in range(grid_size):
                px = int(x1 + (i + 0.5) * box_width / grid_size)
                py = int(y1 + (j + 0.5) * box_height / grid_size)
                
                if self.point_in_polygon((px, py), polygon):
                    points_inside += 1
        
        overlap_ratio = points_inside / total_points
        return overlap_ratio >= overlap_threshold
    
    def detect_vehicles(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect vehicles in frame using YOLO
        
        Args:
            frame: Input image frame
            
        Returns:
            List of detected vehicles with bounding boxes and confidence
        """
        try:
            # Run inference
            results = self.model(frame, verbose=False)[0]
            
            vehicles = []
            
            # Process detections
            for box in results.boxes:
                # Get class, confidence, and coordinates
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Filter for vehicle classes and confidence
                if cls in self.vehicle_classes and conf >= self.confidence_threshold:
                    vehicles.append({
                        'class': cls,
                        'confidence': conf,
                        'bbox': (x1, y1, x2, y2),
                        'center': ((x1 + x2) // 2, (y1 + y2) // 2)
                    })
            
            return vehicles
        
        except Exception as e:
            logger.error(f"Error detecting vehicles: {e}")
            return []
    
    def check_slot_occupancy(self, frame: np.ndarray, slot_polygon: List[List[int]], 
                            overlap_threshold: float = 0.3) -> Dict:
        """
        Check if a parking slot is occupied
        
        Args:
            frame: Input image frame
            slot_polygon: Polygon coordinates defining the parking slot
            overlap_threshold: Minimum overlap to consider slot occupied
            
        Returns:
            Dictionary with occupancy status and details
        """
        # Detect vehicles
        vehicles = self.detect_vehicles(frame)
        
        # Check if any vehicle overlaps with the slot
        for vehicle in vehicles:
            if self.box_in_polygon(vehicle['bbox'], slot_polygon, overlap_threshold):
                return {
                    'occupied': True,
                    'confidence': vehicle['confidence'],
                    'vehicle_class': vehicle['class'],
                    'vehicle_bbox': vehicle['bbox']
                }
        
        return {
            'occupied': False,
            'confidence': 1.0,
            'vehicle_class': None,
            'vehicle_bbox': None
        }
    
    def detect_all_slots(self, frame: np.ndarray, slots: List[Dict], 
                        overlap_threshold: float = 0.3) -> Dict[str, Dict]:
        """
        Detect occupancy for all slots in frame
        
        Args:
            frame: Input image frame
            slots: List of slot dictionaries with 'slot_id' and 'polygon'
            overlap_threshold: Minimum overlap to consider slot occupied
            
        Returns:
            Dictionary mapping slot_id to occupancy information
        """
        # Detect all vehicles once
        vehicles = self.detect_vehicles(frame)
        
        results = {}
        
        for slot in slots:
            slot_id = slot['slot_id']
            polygon = slot['polygon']
            
            # Check if any vehicle overlaps with this slot
            occupied = False
            best_match = None
            
            for vehicle in vehicles:
                if self.box_in_polygon(vehicle['bbox'], polygon, overlap_threshold):
                    if best_match is None or vehicle['confidence'] > best_match['confidence']:
                        best_match = vehicle
                        occupied = True
            
            if occupied and best_match:
                results[slot_id] = {
                    'occupied': True,
                    'confidence': best_match['confidence'],
                    'vehicle_class': best_match['class'],
                    'vehicle_bbox': best_match['bbox']
                }
            else:
                results[slot_id] = {
                    'occupied': False,
                    'confidence': 1.0,
                    'vehicle_class': None,
                    'vehicle_bbox': None
                }
        
        return results
    
    def visualize_detections(self, frame: np.ndarray, slots: List[Dict], 
                            slot_statuses: Dict[str, Dict]) -> np.ndarray:
        """
        Draw visualization of detections on frame
        
        Args:
            frame: Input image frame
            slots: List of slot dictionaries
            slot_statuses: Dictionary of slot occupancy statuses
            
        Returns:
            Frame with visualizations drawn
        """
        output = frame.copy()
        
        for slot in slots:
            slot_id = slot['slot_id']
            polygon = np.array(slot['polygon'], np.int32)
            status = slot_statuses.get(slot_id, {})
            
            # Choose color based on occupancy
            if status.get('occupied', False):
                color = (0, 0, 255)  # Red for occupied
                label = f"{slot_id}: OCCUPIED"
            else:
                color = (0, 255, 0)  # Green for free
                label = f"{slot_id}: FREE"
            
            # Draw polygon
            cv2.polylines(output, [polygon], True, color, 2)
            
            # Draw label
            x, y = polygon[0]
            cv2.putText(output, label, (x, y - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # Draw vehicle bounding box if present
            if status.get('vehicle_bbox'):
                x1, y1, x2, y2 = status['vehicle_bbox']
                cv2.rectangle(output, (x1, y1), (x2, y2), color, 2)
                conf = status.get('confidence', 0)
                cv2.putText(output, f"{conf:.2f}", (x1, y1 - 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        
        return output
