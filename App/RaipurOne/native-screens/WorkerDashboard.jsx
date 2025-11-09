import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../app/constants/colors';
import { BACKEND_URL, API_ENDPOINTS } from '../app/services/config';
import io from 'socket.io-client';
import WorkerLocationService from '../app/services/WorkerLocationService';

const WorkerDashboard = ({ onLogout, onTaskPress }) => {
  const [worker, setWorker] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const [locationTracking, setLocationTracking] = useState(false);

  useEffect(() => {
    loadWorkerData();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      // Stop location tracking on unmount
      if (locationTracking) {
        WorkerLocationService.stopTracking();
      }
    };
  }, []);

  const loadWorkerData = async () => {
    try {
      const workerData = await AsyncStorage.getItem('worker');
      if (workerData) {
        const parsedWorker = JSON.parse(workerData);
        setWorker(parsedWorker);
        setIsActive(parsedWorker.is_active || false);
        await fetchTasks(parsedWorker.worker_id);
      }
    } catch (error) {
      console.error('Error loading worker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const newSocket = io(BACKEND_URL);
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      // Subscribe to worker-specific notifications
      if (worker) {
        newSocket.emit('subscribe_worker', worker.worker_id);
      }
    });

    newSocket.on('worker_assigned', (data) => {
      if (worker && data.worker_id === worker.worker_id) {
        Alert.alert('New Task Assigned!', 'You have been assigned a new task.');
        fetchTasks(worker.worker_id);
      }
    });

    // Listen for worker-specific notifications
    if (worker) {
      newSocket.on(`worker_notification_${worker.worker_id}`, (notification) => {
        Alert.alert(
          notification.type === 'new_task' ? 'New Task' : 'Notification',
          notification.message,
          [
            {
              text: 'View',
              onPress: () => {
                if (notification.data && notification.data.ticketId) {
                  onTaskPress(notification.data);
                }
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        fetchTasks(worker.worker_id);
      });
    }

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);
  };

  const fetchTasks = async (workerId) => {
    try {
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.WORKER_TASKS(workerId)}`);
      const result = await response.json();

      if (result.success) {
        setTasks(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWorkerData();
    setRefreshing(false);
  };

  const toggleAttendance = async () => {
    if (!worker) return;

    try {
      const newStatus = !isActive;
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.WORKER_ATTENDANCE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: worker.worker_id,
          is_active: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsActive(newStatus);
        const updatedWorker = { ...worker, is_active: newStatus };
        setWorker(updatedWorker);
        await AsyncStorage.setItem('worker', JSON.stringify(updatedWorker));
        
        // Start or stop location tracking based on attendance
        if (newStatus) {
          // Worker is now active - start location tracking
          const trackingStarted = await WorkerLocationService.startTracking(
            worker.worker_id,
            (locationData) => {
              console.log('📍 Location updated:', locationData);
              // Optional: Update UI with location data
            }
          );
          
          if (trackingStarted) {
            setLocationTracking(true);
            console.log('✅ Location tracking started');
          } else {
            Alert.alert(
              'Location Permission',
              'Location tracking is needed to receive tasks. Please enable location permissions in settings.',
              [{ text: 'OK' }]
            );
          }
        } else {
          // Worker is now offline - stop location tracking
          WorkerLocationService.stopTracking();
          setLocationTracking(false);
          console.log('🛑 Location tracking stopped');
        }
        
        // Fetch tasks immediately after marking attendance
        await fetchTasks(worker.worker_id);
        
        Alert.alert(
          'Success',
          newStatus 
            ? 'You are now active! Location tracking enabled. Checking for assigned tasks...' 
            : 'You are now offline. Location tracking disabled.'
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('worker');
          onLogout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No worker data found</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{worker.name}</Text>
            <Text style={styles.headerRole}>{worker.work_type}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{worker.active_tasks || 0}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{worker.completed_tasks || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {worker.rating ? worker.rating.toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Attendance Toggle */}
        <TouchableOpacity
          style={[styles.attendanceButton, isActive && styles.attendanceButtonActive]}
          onPress={toggleAttendance}
        >
          <Ionicons
            name={isActive ? 'checkmark-circle' : 'close-circle'}
            size={24}
            color={COLORS.secondary}
          />
          <Text style={styles.attendanceButtonText}>
            {isActive ? 'You are Active' : 'Mark Attendance'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks Section */}
      <View style={styles.tasksSection}>
        <Text style={styles.sectionTitle}>
          My Tasks ({tasks.length})
        </Text>

        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyStateText}>
              {isActive ? 'No tasks assigned yet' : 'Mark attendance to receive tasks'}
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity
              key={task.ticket_id}
              style={styles.taskCard}
              onPress={() => onTaskPress(task)}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskIdContainer}>
                  <Text style={styles.taskId}>#{task.ticket_id}</Text>
                  <View style={[styles.taskStatus, getStatusStyle(task.status)]}>
                    <Text style={styles.taskStatusText}>{task.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </View>

              <Text style={styles.taskQuery} numberOfLines={2}>
                {task.query}
              </Text>

              <View style={styles.taskFooter}>
                <View style={styles.taskInfo}>
                  <Ionicons name="location" size={16} color={COLORS.accent} />
                  <Text style={styles.taskInfoText} numberOfLines={1}>
                    {task.location || 'Location not provided'}
                  </Text>
                </View>
                {task.deadline && (
                  <View style={styles.taskInfo}>
                    <Ionicons name="time" size={16} color={COLORS.error} />
                    <Text style={styles.taskInfoText}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {task.images && task.images.length > 0 && (
                <View style={styles.taskImages}>
                  <Image
                    source={{ uri: task.images[0] }}
                    style={styles.taskImage}
                    resizeMode="cover"
                  />
                  {task.images.length > 1 && (
                    <View style={styles.imageCount}>
                      <Text style={styles.imageCountText}>+{task.images.length - 1}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'assigned':
      return { backgroundColor: COLORS.accent };
    case 'in-progress':
      return { backgroundColor: '#FFA500' };
    case 'completed':
      return { backgroundColor: '#4CAF50' };
    default:
      return { backgroundColor: COLORS.textSecondary };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  attendanceButtonActive: {
    backgroundColor: '#4CAF50',
  },
  attendanceButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  tasksSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  taskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  taskQuery: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 12,
    lineHeight: 22,
  },
  taskFooter: {
    gap: 8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskInfoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  taskImages: {
    marginTop: 12,
    position: 'relative',
  },
  taskImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  imageCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default WorkerDashboard;
