"""
Flask API Server for YOLOv8 CCTV Detection
Provides REST API endpoints for garbage detection and littering detection
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
import base64
import io
from PIL import Image
import requests
import threading
import time
from datetime import datetime
from yolov8_detector import YOLOv8GarbageDetector

app = Flask(__name__)
CORS(app)

# Initialize YOLO detector
detector = None
active_cameras = {}

# Backend API configuration
BACKEND_API_URL = "http://localhost:3001/api"

def initialize_detector():
    """Initialize the YOLO detector on first request"""
    global detector
    if detector is None:
        print("🚀 Initializing YOLOv8 detector...")
        detector = YOLOv8GarbageDetector(
            model_path='yolov8n.pt',  # Use yolov8x.pt for best accuracy
            confidence_threshold=0.5
        )
        print("✅ YOLOv8 detector ready!")
    return detector

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'service': 'YOLOv8 Detection API',
        'version': '1.0.0',
        'active_cameras': len(active_cameras)
    })

@app.route('/detect/image', methods=['POST'])
def detect_image():
    """
    Detect garbage in a single image
    
    Request body:
    {
        "image": "base64_encoded_image" or file upload,
        "camera_id": "cam_1",
        "location": "Main Street"
    }
    """
    try:
        # Initialize detector
        det = initialize_detector()
        
        # Get image from request
        if 'image' in request.files:
            # File upload
            file = request.files['image']
            img_bytes = file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif 'image' in request.json:
            # Base64 encoded image
            img_data = request.json['image']
            if ',' in img_data:
                img_data = img_data.split(',')[1]
            img_bytes = base64.b64decode(img_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            return jsonify({'success': False, 'message': 'No image provided'}), 400
        
        camera_id = request.form.get('camera_id', 'unknown')
        location = request.form.get('location', 'Unknown Location')
        
        # Run detection
        detections = det.detect_frame(frame)
        
        # Check for littering
        littering_events = det.check_littering(detections, camera_id, location)
        
        # Process littering events
        alerts = []
        if littering_events:
            for event in littering_events:
                # Save screenshot
                screenshot_path = det.save_screenshot(frame, event)
                
                # Generate auto-complaint
                complaint = det.generate_auto_complaint(event, screenshot_path)
                
                alerts.append({
                    'type': 'littering',
                    'camera_id': event['camera_id'],
                    'location': event['location'],
                    'garbage_type': event['garbage_type'],
                    'timestamp': event['timestamp'].isoformat(),
                    'screenshot': screenshot_path,
                    'complaint_id': complaint.get('ticket_id') if complaint else None
                })
        
        # Draw detections on frame
        annotated_frame = det.draw_detections(frame, detections)
        
        # Encode annotated image to base64
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'success': True,
            'camera_id': camera_id,
            'location': location,
            'detection_count': {
                'garbage': len(detections['garbage']),
                'persons': len(detections['persons'])
            },
            'detections': {
                'garbage': [
                    {
                        'type': g.get('garbage_type', g['class_name']),
                        'confidence': float(g['confidence']),
                        'bbox': g['bbox'].tolist()
                    }
                    for g in detections['garbage']
                ],
                'persons': [
                    {
                        'confidence': float(p['confidence']),
                        'bbox': p['bbox'].tolist()
                    }
                    for p in detections['persons']
                ]
            },
            'alerts': alerts,
            'annotated_image': f"data:image/jpeg;base64,{annotated_base64}"
        })
        
    except Exception as e:
        print(f"❌ Error in detect_image: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Detection failed',
            'error': str(e)
        }), 500

@app.route('/stream/start', methods=['POST'])
def start_camera_stream():
    """
    Start monitoring a camera stream
    
    Request body:
    {
        "camera_id": "cam_1",
        "stream_url": "rtsp://192.168.1.100:554/stream" or camera index,
        "location": "Main Street, Civil Lines"
    }
    """
    try:
        data = request.json
        camera_id = data.get('camera_id')
        stream_url = data.get('stream_url', 0)  # Default to webcam
        location = data.get('location', 'Unknown Location')
        
        if not camera_id:
            return jsonify({'success': False, 'message': 'camera_id is required'}), 400
        
        if camera_id in active_cameras:
            return jsonify({
                'success': False,
                'message': f'Camera {camera_id} is already active'
            }), 400
        
        # Initialize detector
        det = initialize_detector()
        
        # Start camera stream in background thread
        def stream_worker():
            det.process_camera_stream(stream_url, camera_id, location)
        
        thread = threading.Thread(target=stream_worker, daemon=True)
        thread.start()
        
        active_cameras[camera_id] = {
            'thread': thread,
            'stream_url': stream_url,
            'location': location,
            'started_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': f'Camera {camera_id} stream started',
            'camera_id': camera_id,
            'location': location
        })
        
    except Exception as e:
        print(f"❌ Error starting camera stream: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to start camera stream',
            'error': str(e)
        }), 500

@app.route('/stream/stop/<camera_id>', methods=['POST'])
def stop_camera_stream(camera_id):
    """Stop monitoring a camera stream"""
    if camera_id not in active_cameras:
        return jsonify({
            'success': False,
            'message': f'Camera {camera_id} is not active'
        }), 404
    
    # Remove from active cameras (thread will stop automatically)
    del active_cameras[camera_id]
    
    return jsonify({
        'success': True,
        'message': f'Camera {camera_id} stream stopped'
    })

@app.route('/stream/list', methods=['GET'])
def list_active_streams():
    """List all active camera streams"""
    return jsonify({
        'success': True,
        'active_cameras': {
            cam_id: {
                'location': info['location'],
                'stream_url': info['stream_url'],
                'started_at': info['started_at']
            }
            for cam_id, info in active_cameras.items()
        }
    })

@app.route('/detect/webcam', methods=['POST'])
def detect_from_webcam():
    """
    Capture image from webcam and detect
    
    Request body:
    {
        "camera_index": 0,
        "camera_id": "webcam_1",
        "location": "Admin Office"
    }
    """
    try:
        data = request.json
        camera_index = data.get('camera_index', 0)
        camera_id = data.get('camera_id', 'webcam')
        location = data.get('location', 'Admin Office')
        
        # Capture frame from webcam
        cap = cv2.VideoCapture(camera_index)
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return jsonify({
                'success': False,
                'message': 'Failed to capture from webcam'
            }), 500
        
        # Initialize detector and run detection
        det = initialize_detector()
        detections = det.detect_frame(frame)
        
        # Check for littering
        littering_events = det.check_littering(detections, camera_id, location)
        
        alerts = []
        if littering_events:
            for event in littering_events:
                screenshot_path = det.save_screenshot(frame, event)
                complaint = det.generate_auto_complaint(event, screenshot_path)
                alerts.append({
                    'type': 'littering',
                    'camera_id': event['camera_id'],
                    'location': event['location'],
                    'garbage_type': event['garbage_type'],
                    'timestamp': event['timestamp'].isoformat(),
                    'screenshot': screenshot_path,
                    'complaint_id': complaint.get('ticket_id') if complaint else None
                })
        
        # Draw detections
        annotated_frame = det.draw_detections(frame, detections)
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'success': True,
            'camera_id': camera_id,
            'location': location,
            'detection_count': {
                'garbage': len(detections['garbage']),
                'persons': len(detections['persons'])
            },
            'detections': {
                'garbage': [
                    {
                        'type': g.get('garbage_type', g['class_name']),
                        'confidence': float(g['confidence'])
                    }
                    for g in detections['garbage']
                ],
                'persons': [
                    {'confidence': float(p['confidence'])}
                    for p in detections['persons']
                ]
            },
            'alerts': alerts,
            'annotated_image': f"data:image/jpeg;base64,{annotated_base64}"
        })
        
    except Exception as e:
        print(f"❌ Error in detect_from_webcam: {e}")
        return jsonify({
            'success': False,
            'message': 'Webcam detection failed',
            'error': str(e)
        }), 500

@app.route('/config', methods=['GET'])
def get_config():
    """Get current detector configuration"""
    if detector is None:
        return jsonify({
            'success': False,
            'message': 'Detector not initialized'
        }), 400
    
    return jsonify({
        'success': True,
        'config': {
            'confidence_threshold': detector.confidence_threshold,
            'garbage_classes': list(detector.garbage_classes.values()),
            'backend_api': detector.api_url
        }
    })

if __name__ == '__main__':
    import os
    
    # Create screenshots directory
    os.makedirs('./screenshots', exist_ok=True)
    
    print("\n" + "="*60)
    print("🎥 YOLOv8 CCTV Detection API Server")
    print("="*60)
    print("📡 Starting server on http://localhost:5000")
    print("📊 Endpoints:")
    print("   GET  /health - Health check")
    print("   POST /detect/image - Detect in uploaded image")
    print("   POST /detect/webcam - Capture and detect from webcam")
    print("   POST /stream/start - Start camera stream monitoring")
    print("   POST /stream/stop/<camera_id> - Stop camera stream")
    print("   GET  /stream/list - List active streams")
    print("   GET  /config - Get detector configuration")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
