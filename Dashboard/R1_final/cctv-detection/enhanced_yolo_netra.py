"""
Enhanced YOLO System - Netra.R1
Advanced garbage throwing detection with face capture and video evidence
Stores comprehensive data in netra_r1 table
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
from datetime import datetime, timedelta
import requests
import json
import os
from collections import deque
import base64
import threading
from pathlib import Path

class NetraR1Detector:
    def __init__(self, model_path='yolov8n.pt', confidence_threshold=0.6):
        """
        Initialize Netra.R1 Enhanced Detection System
        
        Features:
        - Face detection and capture of perpetrators
        - 10-second video buffer recording
        - Screenshot at exact moment of incident
        - Comprehensive incident logging to netra_r1 table
        """
        print("🚀 Initializing Netra.R1 Detection System...")
        
        # Load YOLOv8 model
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
        
        # Face detection using Haar Cascade (faster than deep learning)
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Garbage classes from COCO dataset
        self.garbage_classes = {
            39: 'bottle', 40: 'wine glass', 41: 'cup', 42: 'fork',
            43: 'knife', 44: 'spoon', 45: 'bowl', 46: 'banana',
            47: 'apple', 48: 'sandwich', 49: 'orange', 50: 'broccoli',
            51: 'carrot', 52: 'hot dog', 53: 'pizza', 54: 'donut', 55: 'cake',
            # Add bags and backpacks as potential garbage
            24: 'backpack', 26: 'handbag', 28: 'suitcase'
        }
        
        self.person_class_id = 0
        
        # Video buffer - stores last 10 seconds (300 frames at 30fps)
        self.video_buffer = deque(maxlen=300)
        self.fps = 30
        
        # Tracking state
        self.person_tracker = {}
        self.incident_cooldown = {}  # Prevent duplicate incidents
        
        # Storage paths
        self.base_path = Path('./netra_r1_data')
        self.screenshots_path = self.base_path / 'screenshots'
        self.videos_path = self.base_path / 'videos'
        self.faces_path = self.base_path / 'culprit_faces'
        
        # Create directories
        for path in [self.screenshots_path, self.videos_path, self.faces_path]:
            path.mkdir(parents=True, exist_ok=True)
        
        # Backend API
        self.api_url = "http://localhost:3001/api"
        
        print("✅ Netra.R1 System Ready!")
        print(f"📊 Confidence Threshold: {confidence_threshold}")
        print(f"🎯 Tracking {len(self.garbage_classes)} garbage types")
        print(f"💾 Storage: {self.base_path}")
    
    def detect_faces(self, frame):
        """
        Detect faces in frame using Haar Cascade
        Returns list of face bounding boxes
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces
    
    def capture_culprit_face(self, frame, face_bbox, incident_id):
        """
        Extract and save culprit's face from frame
        """
        x, y, w, h = face_bbox
        
        # Add padding around face
        padding = 20
        y1 = max(0, y - padding)
        y2 = min(frame.shape[0], y + h + padding)
        x1 = max(0, x - padding)
        x2 = min(frame.shape[1], x + w + padding)
        
        # Extract face region
        face_img = frame[y1:y2, x1:x2]
        
        # Save face image
        face_filename = f"culprit_{incident_id}.jpg"
        face_path = self.faces_path / face_filename
        cv2.imwrite(str(face_path), face_img)
        
        print(f"😈 Culprit face captured: {face_filename}")
        return str(face_path)
    
    def save_video_evidence(self, incident_id, description):
        """
        Save last 10 seconds of video buffer as evidence
        """
        if len(self.video_buffer) == 0:
            return None
        
        video_filename = f"incident_{incident_id}.mp4"
        video_path = self.videos_path / video_filename
        
        # Get video dimensions from first frame
        first_frame = self.video_buffer[0]
        height, width = first_frame.shape[:2]
        
        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(video_path), fourcc, self.fps, (width, height))
        
        # Write all buffered frames
        for frame in self.video_buffer:
            out.write(frame)
        
        out.release()
        
        print(f"📹 10-second video evidence saved: {video_filename}")
        return str(video_path)
    
    def save_incident_screenshot(self, frame, incident_id):
        """
        Save screenshot of the exact moment of incident
        """
        screenshot_filename = f"incident_{incident_id}_screenshot.jpg"
        screenshot_path = self.screenshots_path / screenshot_filename
        
        # Add timestamp overlay
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cv2.putText(frame, timestamp, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        cv2.imwrite(str(screenshot_path), frame)
        
        print(f"📸 Incident screenshot saved: {screenshot_filename}")
        return str(screenshot_path)
    
    def upload_to_backend(self, file_path, file_type='image'):
        """
        Upload file to backend/Supabase storage
        """
        try:
            with open(file_path, 'rb') as f:
                files = {file_type: (os.path.basename(file_path), f)}
                response = requests.post(
                    f"{self.api_url}/upload/netra-evidence",
                    files=files,
                    timeout=30
                )
                
                if response.status_code == 200:
                    url = response.json().get('url')
                    print(f"☁️ Uploaded to cloud: {url}")
                    return url
                else:
                    print(f"⚠️ Upload failed: {response.status_code}")
                    return file_path
        except Exception as e:
            print(f"⚠️ Upload error: {e}")
            return file_path
    
    def log_to_netra_r1_table(self, incident_data):
        """
        Save incident data to netra_r1 database table
        
        Stores:
        - Incident ID and timestamp
        - Location and camera info
        - Culprit face image URL
        - Incident screenshot URL
        - 10-second video URL
        - Garbage type and description
        - Detection confidence
        """
        try:
            response = requests.post(
                f"{self.api_url}/netra-r1/incidents",
                json=incident_data,
                timeout=10
            )
            
            if response.status_code == 201:
                print(f"✅ Incident logged to Netra.R1 database")
                return response.json()
            else:
                print(f"⚠️ Failed to log incident: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error logging to Netra.R1: {e}")
            return None
    
    def detect_and_track(self, frame):
        """
        Run YOLO detection and track persons with garbage
        """
        # Run YOLO detection
        results = self.model(frame, conf=self.confidence_threshold)[0]
        
        detections = {
            'garbage': [],
            'persons': [],
            'timestamp': datetime.now()
        }
        
        # Process YOLO detections
        for box in results.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            bbox = box.xyxy[0].cpu().numpy()
            
            center = ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)
            
            if class_id in self.garbage_classes:
                detections['garbage'].append({
                    'class_id': class_id,
                    'type': self.garbage_classes[class_id],
                    'confidence': confidence,
                    'bbox': bbox,
                    'center': center
                })
            elif class_id == self.person_class_id:
                detections['persons'].append({
                    'confidence': confidence,
                    'bbox': bbox,
                    'center': center
                })
        
        # Detect faces separately for better accuracy
        faces = self.detect_faces(frame)
        detections['faces'] = [
            {'bbox': (x, y, w, h), 'center': (x + w/2, y + h/2)}
            for (x, y, w, h) in faces
        ]
        
        return detections
    
    def check_throwing_incident(self, detections, frame, camera_id, location):
        """
        Detect person throwing garbage and capture evidence
        
        Logic:
        1. Person detected near garbage (holding)
        2. Track person over multiple frames
        3. Detect when garbage disappears (thrown)
        4. Capture culprit face, screenshot, and video
        5. Log to Netra.R1 database
        """
        current_time = time.time()
        incidents = []
        
        # Check each person
        for person_idx, person in enumerate(detections['persons']):
            person_center = person['center']
            person_bbox = person['bbox']
            
            # Check proximity to garbage
            nearby_garbage = []
            for garbage in detections['garbage']:
                dist = np.sqrt(
                    (person_center[0] - garbage['center'][0])**2 +
                    (person_center[1] - garbage['center'][1])**2
                )
                if dist < 150:  # Within 150 pixels
                    nearby_garbage.append(garbage)
            
            # Create person ID based on position
            person_id = f"{camera_id}_{int(person_center[0])}_{int(person_center[1])}"
            
            # Track person
            if person_id not in self.person_tracker:
                self.person_tracker[person_id] = {
                    'first_seen': current_time,
                    'last_seen': current_time,
                    'had_garbage': len(nearby_garbage) > 0,
                    'garbage_count': len(nearby_garbage),
                    'frames_tracked': 1
                }
            else:
                prev_data = self.person_tracker[person_id]
                prev_data['last_seen'] = current_time
                prev_data['frames_tracked'] += 1
                
                # Check if person had garbage but now doesn't (THROWING DETECTED!)
                if prev_data['had_garbage'] and len(nearby_garbage) == 0:
                    # Check cooldown to avoid duplicates
                    if person_id not in self.incident_cooldown or \
                       (current_time - self.incident_cooldown[person_id]) > 10:
                        
                        print(f"\n🚨 THROWING INCIDENT DETECTED!")
                        print(f"👤 Person ID: {person_id}")
                        print(f"🗑️ Garbage disappeared!")
                        
                        # Generate incident ID
                        incident_id = f"{camera_id}_{int(current_time)}"
                        
                        # Find closest face
                        culprit_face = None
                        if detections['faces']:
                            min_dist = float('inf')
                            closest_face = None
                            for face in detections['faces']:
                                dist = np.sqrt(
                                    (person_center[0] - face['center'][0])**2 +
                                    (person_center[1] - face['center'][1])**2
                                )
                                if dist < min_dist:
                                    min_dist = dist
                                    closest_face = face
                            
                            if closest_face and min_dist < 200:
                                culprit_face = self.capture_culprit_face(
                                    frame, closest_face['bbox'], incident_id
                                )
                        
                        # Save screenshot
                        screenshot = self.save_incident_screenshot(frame, incident_id)
                        
                        # Save 10-second video
                        video_evidence = self.save_video_evidence(
                            incident_id,
                            f"Person throwing garbage at {location}"
                        )
                        
                        # Upload to cloud
                        culprit_face_url = self.upload_to_backend(culprit_face, 'image') if culprit_face else None
                        screenshot_url = self.upload_to_backend(screenshot, 'image')
                        video_url = self.upload_to_backend(video_evidence, 'video') if video_evidence else None
                        
                        # Prepare incident data for Netra.R1 database
                        incident_data = {
                            'incident_id': incident_id,
                            'camera_id': camera_id,
                            'location': location,
                            'timestamp': datetime.now().isoformat(),
                            'incident_type': 'garbage_throwing',
                            'culprit_face_url': culprit_face_url,
                            'screenshot_url': screenshot_url,
                            'video_url': video_url,
                            'video_duration_seconds': 10,
                            'garbage_type': prev_data.get('garbage_type', 'unknown'),
                            'detection_confidence': person['confidence'],
                            'description': f"Person caught throwing garbage at {location}. AI-verified incident with face capture and video evidence.",
                            'status': 'pending_review',
                            'priority': 'high',
                            'metadata': {
                                'frames_tracked': prev_data['frames_tracked'],
                                'garbage_count': prev_data['garbage_count'],
                                'person_confidence': person['confidence']
                            }
                        }
                        
                        # Log to database
                        self.log_to_netra_r1_table(incident_data)
                        
                        incidents.append(incident_data)
                        
                        # Set cooldown
                        self.incident_cooldown[person_id] = current_time
                        
                        # Reset tracker
                        del self.person_tracker[person_id]
                
                # Update tracker
                prev_data['had_garbage'] = len(nearby_garbage) > 0
                prev_data['garbage_count'] = len(nearby_garbage)
        
        # Clean up old tracks
        self.person_tracker = {
            pid: data for pid, data in self.person_tracker.items()
            if current_time - data['last_seen'] < 5
        }
        
        return incidents
    
    def draw_detections(self, frame, detections):
        """
        Draw bounding boxes and labels on frame
        """
        annotated = frame.copy()
        
        # Draw garbage (RED boxes)
        for garbage in detections['garbage']:
            bbox = garbage['bbox'].astype(int)
            cv2.rectangle(annotated, (bbox[0], bbox[1]), (bbox[2], bbox[3]),
                         (0, 0, 255), 3)
            label = f"{garbage['type']} {garbage['confidence']:.2f}"
            cv2.putText(annotated, label, (bbox[0], bbox[1] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        # Draw persons (GREEN boxes)
        for person in detections['persons']:
            bbox = person['bbox'].astype(int)
            cv2.rectangle(annotated, (bbox[0], bbox[1]), (bbox[2], bbox[3]),
                         (0, 255, 0), 3)
            label = f"Person {person['confidence']:.2f}"
            cv2.putText(annotated, label, (bbox[0], bbox[1] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Draw faces (YELLOW boxes)
        for face in detections['faces']:
            x, y, w, h = face['bbox']
            cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 255, 255), 3)
            cv2.putText(annotated, "FACE", (x, y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        # Add statistics overlay
        stats_text = [
            f"Netra.R1 Detection System",
            f"Garbage: {len(detections['garbage'])}",
            f"Persons: {len(detections['persons'])}",
            f"Faces: {len(detections['faces'])}",
            f"Buffer: {len(self.video_buffer)}/300 frames"
        ]
        
        y_pos = 30
        for text in stats_text:
            cv2.putText(annotated, text, (10, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            y_pos += 30
        
        return annotated
    
    def monitor_camera(self, camera_source=0, camera_id='netra_cam_1',
                      location='Municipal Area', display=True):
        """
        Monitor camera feed for garbage throwing incidents
        
        Args:
            camera_source: Camera index or RTSP URL
            camera_id: Unique camera identifier
            location: Physical location description
            display: Show live feed window
        """
        print(f"\n{'='*60}")
        print(f"🎥 Netra.R1 Monitoring Started")
        print(f"📍 Location: {location}")
        print(f"🆔 Camera: {camera_id}")
        print(f"{'='*60}\n")
        
        cap = cv2.VideoCapture(camera_source)
        
        if not cap.isOpened():
            print(f"❌ Failed to open camera: {camera_source}")
            return
        
        # Set resolution
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        cap.set(cv2.CAP_PROP_FPS, self.fps)
        
        frame_count = 0
        fps_counter = 0
        fps_start = time.time()
        current_fps = 0
        
        print("✅ Monitoring active. Press 'q' to quit.\n")
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("⚠️ Failed to read frame")
                    break
                
                frame_count += 1
                
                # Add frame to video buffer
                self.video_buffer.append(frame.copy())
                
                # Run detection
                detections = self.detect_and_track(frame)
                
                # Check for throwing incidents
                incidents = self.check_throwing_incident(
                    detections, frame, camera_id, location
                )
                
                # Draw detections
                if display:
                    annotated = self.draw_detections(frame, detections)
                    
                    # Calculate FPS
                    fps_counter += 1
                    if fps_counter >= 30:
                        current_fps = fps_counter / (time.time() - fps_start)
                        fps_start = time.time()
                        fps_counter = 0
                    
                    # Add FPS to display
                    cv2.putText(annotated, f"FPS: {current_fps:.1f}",
                               (annotated.shape[1] - 150, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    
                    # Show window
                    cv2.imshow(f'Netra.R1 - {camera_id}', annotated)
                
                # Break on 'q'
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
        
        except KeyboardInterrupt:
            print("\n⚠️ Monitoring stopped by user")
        
        finally:
            cap.release()
            if display:
                cv2.destroyAllWindows()
            print(f"\n✅ Netra.R1 monitoring stopped for {camera_id}")


def main():
    """
    Main entry point for Netra.R1 detection system
    """
    print("\n" + "="*60)
    print("🔍 NETRA.R1 - Advanced Garbage Throwing Detection System")
    print("="*60)
    print("\nFeatures:")
    print("  ✅ Real-time garbage throwing detection")
    print("  ✅ Culprit face capture")
    print("  ✅ 10-second video evidence recording")
    print("  ✅ Incident screenshot with timestamp")
    print("  ✅ Comprehensive database logging")
    print("  ✅ Cloud storage integration")
    print("="*60 + "\n")
    
    # Initialize Netra.R1
    netra = NetraR1Detector(
        model_path='yolov8n.pt',  # Use yolov8x.pt for best accuracy
        confidence_threshold=0.6
    )
    
    # Start monitoring
    netra.monitor_camera(
        camera_source=0,  # Webcam (use RTSP URL for IP cameras)
        camera_id='netra_main_cam',
        location='Main Street, Civil Lines',
        display=True
    )


if __name__ == "__main__":
    main()
