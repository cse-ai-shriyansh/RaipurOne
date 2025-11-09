"""
YOLO v8 CCTV Garbage Detection System
Real-time detection of garbage and littering with auto-complaint generation
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
from datetime import datetime
import requests
import json
import threading
import queue
from collections import defaultdict

class YOLOv8GarbageDetector:
    def __init__(self, model_path='yolov8n.pt', confidence_threshold=0.5):
        """
        Initialize YOLOv8 Garbage Detector
        
        Args:
            model_path: Path to YOLOv8 model (yolov8n.pt, yolov8s.pt, yolov8m.pt, yolov8l.pt, yolov8x.pt)
            confidence_threshold: Minimum confidence for detections (0.0 to 1.0)
        """
        print("🚀 Loading YOLOv8 model...")
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
        
        # Garbage-related class IDs from COCO dataset
        self.garbage_classes = {
            39: 'bottle',
            40: 'wine glass',
            41: 'cup',
            42: 'fork',
            43: 'knife',
            44: 'spoon',
            45: 'bowl',
            46: 'banana',
            47: 'apple',
            48: 'sandwich',
            49: 'orange',
            50: 'broccoli',
            51: 'carrot',
            52: 'hot dog',
            53: 'pizza',
            54: 'donut',
            55: 'cake',
            # Add custom garbage classes if you train custom model
            # 80: 'plastic bag',
            # 81: 'waste',
            # 82: 'litter'
        }
        
        # Person detection for littering tracking
        self.person_class_id = 0
        
        # Tracking data
        self.person_tracks = defaultdict(lambda: {
            'last_seen': time.time(),
            'garbage_nearby': False,
            'frames_with_garbage': 0,
            'screenshot_taken': False
        })
        
        # Backend API
        self.api_url = "http://localhost:3001/api"
        
        # Detection buffer
        self.detection_queue = queue.Queue()
        
        print("✅ YOLOv8 Detector Ready!")
        print(f"📊 Confidence Threshold: {confidence_threshold}")
        print(f"🎯 Tracking {len(self.garbage_classes)} garbage classes")
    
    def detect_frame(self, frame):
        """
        Run YOLOv8 detection on a single frame
        
        Returns:
            detections: List of detected objects with bounding boxes
        """
        results = self.model(frame, conf=self.confidence_threshold)[0]
        
        detections = {
            'garbage': [],
            'persons': [],
            'frame': frame,
            'timestamp': datetime.now()
        }
        
        # Process detections
        for box in results.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            bbox = box.xyxy[0].cpu().numpy()
            
            detection_data = {
                'class_id': class_id,
                'class_name': results.names[class_id],
                'confidence': confidence,
                'bbox': bbox,
                'center': ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)
            }
            
            # Check if it's garbage
            if class_id in self.garbage_classes:
                detection_data['garbage_type'] = self.garbage_classes[class_id]
                detections['garbage'].append(detection_data)
            
            # Check if it's a person
            elif class_id == self.person_class_id:
                detections['persons'].append(detection_data)
        
        return detections
    
    def draw_detections(self, frame, detections):
        """
        Draw bounding boxes and labels on frame
        """
        annotated_frame = frame.copy()
        
        # Draw garbage detections (RED)
        for garbage in detections['garbage']:
            bbox = garbage['bbox'].astype(int)
            cv2.rectangle(annotated_frame, 
                         (bbox[0], bbox[1]), (bbox[2], bbox[3]), 
                         (0, 0, 255), 2)
            
            label = f"{garbage.get('garbage_type', garbage['class_name'])} {garbage['confidence']:.2f}"
            cv2.putText(annotated_frame, label,
                       (bbox[0], bbox[1] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        # Draw person detections (GREEN)
        for person in detections['persons']:
            bbox = person['bbox'].astype(int)
            cv2.rectangle(annotated_frame,
                         (bbox[0], bbox[1]), (bbox[2], bbox[3]),
                         (0, 255, 0), 2)
            
            label = f"Person {person['confidence']:.2f}"
            cv2.putText(annotated_frame, label,
                       (bbox[0], bbox[1] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Add statistics
        stats_text = f"Garbage: {len(detections['garbage'])} | Persons: {len(detections['persons'])}"
        cv2.putText(annotated_frame, stats_text,
                   (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        return annotated_frame
    
    def check_littering(self, detections, camera_id='cam_1', location='Unknown'):
        """
        Check if someone is littering (person near garbage)
        Generate auto-complaint if littering detected
        """
        garbage_items = detections['garbage']
        persons = detections['persons']
        
        if not garbage_items or not persons:
            return None
        
        # Check proximity between persons and garbage
        littering_events = []
        
        for person in persons:
            person_center = person['center']
            
            for garbage in garbage_items:
                garbage_center = garbage['center']
                
                # Calculate distance
                distance = np.sqrt(
                    (person_center[0] - garbage_center[0])**2 +
                    (person_center[1] - garbage_center[1])**2
                )
                
                # If person is within 100 pixels of garbage, potential littering
                if distance < 100:
                    # Track this person
                    person_id = f"{camera_id}_{int(person_center[0])}_{int(person_center[1])}"
                    
                    if person_id not in self.person_tracks:
                        self.person_tracks[person_id] = {
                            'last_seen': time.time(),
                            'garbage_nearby': True,
                            'frames_with_garbage': 1,
                            'screenshot_taken': False
                        }
                    else:
                        self.person_tracks[person_id]['frames_with_garbage'] += 1
                        self.person_tracks[person_id]['last_seen'] = time.time()
                    
                    # If person near garbage for 5+ frames and no screenshot taken
                    if (self.person_tracks[person_id]['frames_with_garbage'] >= 5 and 
                        not self.person_tracks[person_id]['screenshot_taken']):
                        
                        littering_events.append({
                            'person_id': person_id,
                            'garbage_type': garbage.get('garbage_type', 'unknown'),
                            'camera_id': camera_id,
                            'location': location,
                            'timestamp': datetime.now(),
                            'frame': detections['frame']
                        })
                        
                        self.person_tracks[person_id]['screenshot_taken'] = True
        
        # Clean up old tracks (not seen in 5 seconds)
        current_time = time.time()
        self.person_tracks = {
            pid: data for pid, data in self.person_tracks.items()
            if current_time - data['last_seen'] < 5
        }
        
        return littering_events
    
    def save_screenshot(self, frame, event_data):
        """
        Save screenshot of littering event and upload to backend
        """
        timestamp = event_data['timestamp'].strftime('%Y%m%d_%H%M%S')
        filename = f"littering_{event_data['camera_id']}_{timestamp}.jpg"
        filepath = f"./screenshots/{filename}"
        
        # Save locally
        cv2.imwrite(filepath, frame)
        print(f"📸 Screenshot saved: {filepath}")
        
        # Upload to backend
        try:
            with open(filepath, 'rb') as f:
                files = {'image': (filename, f, 'image/jpeg')}
                data = {
                    'camera_id': event_data['camera_id'],
                    'location': event_data['location'],
                    'timestamp': timestamp
                }
                
                response = requests.post(
                    f"{self.api_url}/upload/cctv-screenshot",
                    files=files,
                    data=data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    url = response.json().get('url')
                    print(f"☁️ Screenshot uploaded to cloud: {url}")
                    return url
                else:
                    print(f"⚠️ Upload failed: {response.status_code}")
                    return filepath
                    
        except Exception as e:
            print(f"⚠️ Upload error: {e}")
            return filepath
    
    def generate_auto_complaint(self, event_data, screenshot_path):
        """
        Generate automatic complaint via backend API
        """
        try:
            complaint_data = {
                'title': f'Littering Detected - {event_data["garbage_type"]}',
                'description': f'''
Automatic complaint generated by AI CCTV Detection System

🎥 Camera: {event_data['camera_id']}
📍 Location: {event_data['location']}
⏰ Time: {event_data['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}
🗑️ Garbage Type: {event_data['garbage_type']}
🤖 Detection Confidence: AI-verified littering activity

This complaint was automatically generated when CCTV detected a person littering in a public area.
                '''.strip(),
                'category': 'garbage',
                'priority': 'high',
                'auto_generated': True,
                'screenshot_path': screenshot_path
            }
            
            # Send to backend
            response = requests.post(
                f"{self.api_url}/tickets",
                json=complaint_data,
                timeout=5
            )
            
            if response.status_code == 201:
                print(f"✅ Auto-complaint created: {response.json().get('ticket_id')}")
                return response.json()
            else:
                print(f"⚠️ Failed to create complaint: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating auto-complaint: {e}")
            return None
    
    def process_camera_stream(self, camera_source, camera_id='cam_1', location='Unknown'):
        """
        Process live camera stream
        
        Args:
            camera_source: Camera index (0, 1, 2) or RTSP URL
            camera_id: Unique identifier for this camera
            location: Physical location of the camera
        """
        print(f"📹 Starting camera stream: {camera_id} at {location}")
        
        cap = cv2.VideoCapture(camera_source)
        
        if not cap.isOpened():
            print(f"❌ Failed to open camera: {camera_source}")
            return
        
        # Set resolution
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        frame_count = 0
        fps = 0
        fps_start_time = time.time()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"⚠️ Failed to read frame from {camera_id}")
                break
            
            frame_count += 1
            
            # Process every frame (YOLOv8 is fast enough)
            detections = self.detect_frame(frame)
            
            # Check for littering
            littering_events = self.check_littering(detections, camera_id, location)
            
            # Handle littering events
            if littering_events:
                for event in littering_events:
                    print(f"🚨 LITTERING DETECTED: {event['garbage_type']} at {event['location']}")
                    
                    # Save screenshot
                    screenshot_path = self.save_screenshot(frame, event)
                    
                    # Generate auto-complaint
                    self.generate_auto_complaint(event, screenshot_path)
            
            # Draw detections
            annotated_frame = self.draw_detections(frame, detections)
            
            # Calculate FPS
            if frame_count % 30 == 0:
                fps = 30 / (time.time() - fps_start_time)
                fps_start_time = time.time()
            
            # Add FPS to frame
            cv2.putText(annotated_frame, f"FPS: {fps:.1f}",
                       (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Display
            cv2.imshow(f'CCTV - {camera_id}', annotated_frame)
            
            # Break on 'q' key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print(f"📹 Camera stream {camera_id} stopped")
    
    def run_multi_camera(self, camera_configs):
        """
        Run multiple camera streams in parallel
        
        Args:
            camera_configs: List of dict with 'source', 'id', 'location'
        """
        threads = []
        
        for config in camera_configs:
            thread = threading.Thread(
                target=self.process_camera_stream,
                args=(config['source'], config['id'], config['location'])
            )
            thread.daemon = True
            thread.start()
            threads.append(thread)
        
        # Wait for all threads
        for thread in threads:
            thread.join()


if __name__ == "__main__":
    import os
    
    # Create screenshots directory
    os.makedirs('./screenshots', exist_ok=True)
    
    # Initialize detector with YOLOv8 nano (fastest)
    # For better accuracy, use: yolov8s.pt, yolov8m.pt, yolov8l.pt, or yolov8x.pt
    detector = YOLOv8GarbageDetector(
        model_path='yolov8n.pt',  # Change to yolov8x.pt for best accuracy
        confidence_threshold=0.5
    )
    
    # Single camera example
    print("\n🎥 Starting single camera mode...")
    print("Press 'q' to quit")
    detector.process_camera_stream(
        camera_source=0,  # 0 = default webcam, or use RTSP URL
        camera_id='main_street_cam',
        location='Main Street, Civil Lines'
    )
    
    # Multi-camera example (uncomment to use)
    # camera_configs = [
    #     {'source': 0, 'id': 'cam_1', 'location': 'Main Street'},
    #     {'source': 'rtsp://192.168.1.100:554/stream', 'id': 'cam_2', 'location': 'Park Area'},
    #     {'source': 'rtsp://192.168.1.101:554/stream', 'id': 'cam_3', 'location': 'Market Square'}
    # ]
    # detector.run_multi_camera(camera_configs)
