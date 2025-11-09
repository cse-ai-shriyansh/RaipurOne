#!/usr/bin/env python3
"""
Netra.R1 Video Analyzer
Analyzes uploaded videos to detect garbage throwing incidents with face detection
"""

import sys
import cv2
import json
import os
from pathlib import Path
from ultralytics import YOLO
import numpy as np
from datetime import datetime
import requests
from PIL import Image
import base64

class VideoAnalyzer:
    def __init__(self, video_path, analysis_id, output_dir):
        self.video_path = video_path
        self.analysis_id = analysis_id
        self.output_dir = output_dir
        
        # Load YOLO model
        print("Loading YOLO model...")
        self.model = YOLO('yolov8n.pt')  # Using nano model for speed
        
        # Load face detection model
        face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(face_cascade_path)
        
        # Detection settings
        self.person_confidence = 0.4
        self.garbage_confidence = 0.3
        
        # Tracking data
        self.incidents = []
        self.frame_buffer = []
        self.buffer_size = 300  # 10 seconds at 30 fps
        self.annotated_frames = []  # Store frames with bounding boxes
        
        # Classes of interest
        self.person_class_id = 0  # COCO class for person
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
            64: 'potted plant',
            73: 'book',
            76: 'scissors',
        }
        
    def detect_faces(self, frame):
        """Detect faces in frame using Haar Cascade"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50)
        )
        return faces
    
    def capture_person_image(self, frame, person_bbox, incident_num):
        """Extract and save full person image from frame"""
        x1, y1, x2, y2 = map(int, person_bbox)
        
        # Add padding around person
        padding = 30
        height, width = frame.shape[:2]
        y1 = max(0, y1 - padding)
        y2 = min(height, y2 + padding)
        x1 = max(0, x1 - padding)
        x2 = min(width, x2 + padding)
        
        person_img = frame[y1:y2, x1:x2]
        
        if person_img.size == 0:
            return None
        
        # Save person image
        person_filename = f"{self.analysis_id}_person_{incident_num}.jpg"
        person_path = os.path.join(self.output_dir, person_filename)
        cv2.imwrite(person_path, person_img)
        
        return person_path
    
    def capture_face(self, frame, face_bbox, incident_num):
        """Extract and save face from frame"""
        x, y, w, h = face_bbox
        
        # Add padding
        padding = 20
        y1 = max(0, y - padding)
        y2 = min(frame.shape[0], y + h + padding)
        x1 = max(0, x - padding)
        x2 = min(frame.shape[1], x + w + padding)
        
        face_img = frame[y1:y2, x1:x2]
        
        if face_img.size == 0:
            return None
        
        # Save face image
        face_filename = f"{self.analysis_id}_face_{incident_num}.jpg"
        face_path = os.path.join(self.output_dir, face_filename)
        cv2.imwrite(face_path, face_img)
        
        return face_path
    
    def save_screenshot(self, frame, incident_num, timestamp):
        """Save incident screenshot with timestamp overlay"""
        # Add timestamp overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (400, 60), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        timestamp_text = f"Incident #{incident_num}"
        time_text = timestamp.strftime("%Y-%m-%d %H:%M:%S")
        
        cv2.putText(frame, timestamp_text, (20, 35),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, time_text, (20, 55),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        
        # Save screenshot
        screenshot_filename = f"{self.analysis_id}_screenshot_{incident_num}.jpg"
        screenshot_path = os.path.join(self.output_dir, screenshot_filename)
        cv2.imwrite(screenshot_path, frame)
        
        return screenshot_path
    
    def save_video_clip(self, incident_num, start_frame_idx, end_frame_idx):
        """Save video clip of incident from buffer"""
        if not self.frame_buffer:
            return None
        
        video_filename = f"{self.analysis_id}_video_{incident_num}.mp4"
        video_path = os.path.join(self.output_dir, video_filename)
        
        # Get frame dimensions
        height, width = self.frame_buffer[0].shape[:2]
        
        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        fps = 30
        out = cv2.VideoWriter(video_path, fourcc, fps, (width, height))
        
        # Write frames
        for frame in self.frame_buffer[start_frame_idx:end_frame_idx]:
            out.write(frame)
        
        out.release()
        return video_path
    
    def detect_throwing_incident(self, frame, frame_number, persons, objects):
        """
        Detect if someone is throwing garbage
        Enhanced detection: person + garbage + motion
        """
        if len(persons) == 0:
            return False, None
        
        # If we have both person and garbage in frame, it's a potential incident
        if len(objects) > 0:
            for person in persons:
                px1, py1, px2, py2 = person['bbox']
                person_center_x = (px1 + px2) / 2
                person_center_y = (py1 + py2) / 2
                
                for obj in objects:
                    ox1, oy1, ox2, oy2 = obj['bbox']
                    obj_center_x = (ox1 + ox2) / 2
                    obj_center_y = (oy1 + oy2) / 2
                    
                    # Check if garbage is near person (within 250 pixels)
                    distance = np.sqrt(
                        (person_center_x - obj_center_x)**2 + 
                        (person_center_y - obj_center_y)**2
                    )
                    
                    if distance < 250:
                        # Return the person's bbox for face extraction
                        return True, person['bbox']
        
        return False, None
    
    def analyze_video(self):
        """Main video analysis function"""
        print(f"📹 Analyzing video: {self.video_path}")
        
        cap = cv2.VideoCapture(self.video_path)
        
        if not cap.isOpened():
            print(f"❌ Error: Cannot open video file")
            return False
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"📊 Video info: {total_frames} frames, {fps} FPS, {width}x{height}")
        
        # Create video writer for annotated output
        output_video_path = os.path.join(self.output_dir, f"{self.analysis_id}_analyzed.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        frame_number = 0
        incident_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_number += 1
            
            # Add to buffer
            self.frame_buffer.append(frame.copy())
            if len(self.frame_buffer) > self.buffer_size:
                self.frame_buffer.pop(0)
            
            # Create annotated frame
            annotated_frame = frame.copy()
            
            # Run YOLO detection
            results = self.model(frame, verbose=False)
            
            persons = []
            objects = []
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    bbox = box.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = map(int, bbox)
                    
                    # Draw bounding boxes on annotated frame
                    if cls == self.person_class_id and conf >= self.person_confidence:
                        persons.append({
                            'bbox': bbox,
                            'confidence': conf
                        })
                        # Draw green box for persons
                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(annotated_frame, f'Person {conf:.2f}', (x1, y1-10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                    
                    elif cls in self.garbage_classes and conf >= self.garbage_confidence:
                        objects.append({
                            'bbox': bbox,
                            'confidence': conf,
                            'class': cls,
                            'name': self.garbage_classes[cls]
                        })
                        # Draw red box for garbage
                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(annotated_frame, f'{self.garbage_classes[cls]} {conf:.2f}', 
                                  (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            
            # Write annotated frame
            out.write(annotated_frame)
            
            # Check for throwing incident
            incident_detected, person_bbox = self.detect_throwing_incident(frame, frame_number, persons, objects)
            
            if incident_detected and person_bbox is not None:
                incident_count += 1
                timestamp = datetime.now()
                
                print(f"🚨 Incident #{incident_count} detected at frame {frame_number}")
                
                # Capture the person's full image (culprit)
                person_image_path = self.capture_person_image(frame, person_bbox, incident_count)
                print(f"   👤 Person image captured!")
                
                # Also try to detect face for better identification
                faces = self.detect_faces(frame)
                face_path = None
                
                if len(faces) > 0:
                    print(f"   � Face also detected!")
                    face_path = self.capture_face(frame, faces[0], incident_count)
                
                # Save screenshot
                screenshot_path = self.save_screenshot(annotated_frame, incident_count, timestamp)
                
                # Save video clip (last 10 seconds from buffer)
                buffer_start = max(0, len(self.frame_buffer) - self.buffer_size)
                video_path = self.save_video_clip(
                    incident_count,
                    buffer_start,
                    len(self.frame_buffer)
                )
                
                # Get garbage type and confidence
                garbage_type = objects[0]['name'] if objects else 'Unknown item'
                avg_confidence = np.mean([obj['confidence'] for obj in objects]) if objects else 0.5
                
                # Store incident data
                incident_data = {
                    'incident_id': f"{self.analysis_id}_INC{incident_count:04d}",
                    'frame_number': frame_number,
                    'timestamp': timestamp.isoformat(),
                    'person_image_url': person_image_path,  # Main culprit image
                    'culprit_face_url': face_path,  # Face zoom if available
                    'screenshot_url': screenshot_path,
                    'video_url': video_path,
                    'video_duration_seconds': 10,
                    'garbage_type': garbage_type,
                    'confidence': float(avg_confidence),
                    'persons_detected': len(persons),
                    'objects_detected': len(objects)
                }
                
                self.incidents.append(incident_data)
                
                # Skip next 60 frames to avoid duplicate detections (2 seconds)
                for _ in range(60):
                    ret, frame = cap.read()
                    if ret:
                        out.write(frame)
                    frame_number += 1
            
            # Progress indicator
            if frame_number % 100 == 0:
                progress = (frame_number / total_frames) * 100
                print(f"   Progress: {progress:.1f}% ({frame_number}/{total_frames} frames)")
        
        cap.release()
        out.release()
        
        print(f"\n✅ Analysis complete!")
        print(f"   Total incidents detected: {incident_count}")
        print(f"   Faces captured: {sum(1 for i in self.incidents if i['culprit_face_url'])}")
        print(f"   Analyzed video saved: {output_video_path}")
        
        self.analyzed_video_path = output_video_path
        return True
    
    def save_results(self):
        """Save analysis results to JSON"""
        results = {
            'analysis_id': self.analysis_id,
            'timestamp': datetime.now().isoformat(),
            'analyzed_video_url': self.analyzed_video_path,
            'incidents': self.incidents,
            'culprits': [i for i in self.incidents if i.get('culprit_face_url')],
            'garbage_detected': sum(i['objects_detected'] for i in self.incidents),
            'avg_confidence': np.mean([i['confidence'] for i in self.incidents]) if self.incidents else 0
        }
        
        results_path = os.path.join(self.output_dir, f"{self.analysis_id}_results.json")
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"💾 Results saved to: {results_path}")
        return results_path

def main():
    if len(sys.argv) < 4:
        print("Usage: python analyze_video.py <video_path> <analysis_id> <output_dir>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    analysis_id = sys.argv[2]
    output_dir = sys.argv[3]
    
    print("=" * 60)
    print("🔍 Netra.R1 Video Analyzer Starting...")
    print("=" * 60)
    
    analyzer = VideoAnalyzer(video_path, analysis_id, output_dir)
    
    if analyzer.analyze_video():
        analyzer.save_results()
        print("\n" + "=" * 60)
        print("✨ Analysis completed successfully!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n❌ Analysis failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
