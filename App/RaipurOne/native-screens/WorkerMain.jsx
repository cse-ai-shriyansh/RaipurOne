import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkerAuth from './WorkerAuth';
import WorkerDashboard from './WorkerDashboard';
import WorkerTaskDetail from './WorkerTaskDetail';
import WorkerSubmitReportScreen from './WorkerSubmitReportScreen';

const WorkerMain = () => {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [worker, setWorker] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    checkWorkerAuth();
  }, []);

  const checkWorkerAuth = async () => {
    try {
      const workerData = await AsyncStorage.getItem('worker');
      if (workerData) {
        const parsedWorker = JSON.parse(workerData);
        setWorker(parsedWorker);
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('auth');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setCurrentScreen('auth');
    }
  };

  const handleLoginSuccess = (workerData) => {
    setWorker(workerData);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setWorker(null);
    setSelectedTask(null);
    setCurrentScreen('auth');
  };

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setCurrentScreen('taskDetail');
  };

  const handleTaskCompleted = () => {
    setSelectedTask(null);
    setCurrentScreen('dashboard');
  };

  const handleBackFromTask = () => {
    setSelectedTask(null);
    setCurrentScreen('dashboard');
  };

  const handleSubmitReport = (task) => {
    setSelectedTask(task);
    setCurrentScreen('submitReport');
  };

  const handleBackFromSubmit = () => {
    setCurrentScreen('taskDetail');
  };

  if (currentScreen === 'loading') {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {currentScreen === 'auth' && (
        <WorkerAuth onLoginSuccess={handleLoginSuccess} />
      )}
      
      {currentScreen === 'dashboard' && (
        <WorkerDashboard
          onLogout={handleLogout}
          onTaskPress={handleTaskPress}
        />
      )}
      
      {currentScreen === 'taskDetail' && selectedTask && (
        <WorkerTaskDetail
          task={selectedTask}
          workerId={worker?.worker_id}
          onBack={handleBackFromTask}
          onTaskCompleted={handleTaskCompleted}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {currentScreen === 'submitReport' && selectedTask && (
        <WorkerSubmitReportScreen
          route={{ params: { task: selectedTask } }}
          navigation={{
            goBack: handleBackFromSubmit,
            navigate: (screen) => setCurrentScreen(screen)
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WorkerMain;
