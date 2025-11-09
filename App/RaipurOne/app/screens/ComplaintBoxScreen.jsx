import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../constants/colors';

// AI Department Classification
const DEPARTMENTS = {
  WATER: { name: 'Water Supply', icon: '💧', color: '#2196F3', keywords: ['water', 'tap', 'pipe', 'leak', 'supply', 'drainage', 'sewage', 'plumbing'] },
  ROAD: { name: 'Roads & Infrastructure', icon: '🛣️', color: '#9E9E9E', keywords: ['road', 'street', 'pothole', 'crack', 'asphalt', 'highway', 'bridge', 'footpath', 'pavement'] },
  ELECTRICITY: { name: 'Electricity', icon: '💡', color: '#FFC107', keywords: ['electricity', 'power', 'light', 'street light', 'lamp', 'wire', 'pole', 'transformer', 'blackout'] },
  GARBAGE: { name: 'Garbage Collection', icon: '🗑️', color: '#4CAF50', keywords: ['garbage', 'trash', 'waste', 'rubbish', 'dustbin', 'litter', 'dump', 'sanitation', 'cleaning'] },
  PARKS: { name: 'Parks & Gardens', icon: '🌳', color: '#8BC34A', keywords: ['park', 'garden', 'tree', 'grass', 'playground', 'bench', 'green', 'plant'] },
  GENERAL: { name: 'General Issues', icon: '📋', color: '#757575', keywords: [] }
};

const classifyDepartment = (description) => {
  const lowerDesc = description.toLowerCase();
  const scores = {};
  
  Object.entries(DEPARTMENTS).forEach(([key, dept]) => {
    scores[key] = 0;
    dept.keywords.forEach(keyword => {
      if (lowerDesc.includes(keyword)) {
        scores[key] += 1;
      }
    });
  });
  
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'GENERAL';
  
  return Object.keys(scores).find(key => scores[key] === maxScore);
};

export default function ComplaintBoxScreen({ user, onBack }) {
  const [complaint, setComplaint] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedDepartment, setDetectedDepartment] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // AI Analysis when user types
  useEffect(() => {
    if (complaint.trim().length > 10) {
      setAnalyzing(true);
      const timer = setTimeout(() => {
        const dept = classifyDepartment(complaint);
        setDetectedDepartment(dept);
        setAnalyzing(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setDetectedDepartment(null);
    }
  }, [complaint]);

  const submitComplaint = async () => {
    if (!complaint.trim()) {
      Alert.alert('Error', 'Please enter a complaint description');
      return;
    }
    
    const department = detectedDepartment || 'GENERAL';
    const deptInfo = DEPARTMENTS[department];
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Success', 
        `Complaint routed to ${deptInfo.icon} ${deptInfo.name} department!`,
        [{ text: 'OK', onPress: () => {} }]
      );
      setComplaint('');
      setLocation('');
      setDetectedDepartment(null);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Complaint</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>🤖</Text>
          <Text style={styles.infoTitle}>AI-Powered Complaint Routing</Text>
          <Text style={styles.infoText}>Our AI will automatically detect and route your complaint to the right department</Text>
        </View>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} placeholder="Enter location..." placeholderTextColor="#666" value={location} onChangeText={setLocation} />
        </View>
        <View style={styles.inputSection}>
          <Text style={styles.label}>📄 Description</Text>
          <TextInput style={styles.textArea} placeholder="Describe issue..." placeholderTextColor="#666" multiline numberOfLines={8} value={complaint} onChangeText={setComplaint} textAlignVertical="top" />
          
          {/* AI Department Detection */}
          {analyzing && (
            <View style={styles.aiAnalyzing}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.aiAnalyzingText}>AI analyzing...</Text>
            </View>
          )}
          
          {detectedDepartment && !analyzing && (
            <View style={[styles.departmentBadge, { backgroundColor: DEPARTMENTS[detectedDepartment].color + '20', borderColor: DEPARTMENTS[detectedDepartment].color }]}>
              <Text style={styles.departmentIcon}>{DEPARTMENTS[detectedDepartment].icon}</Text>
              <View style={styles.departmentInfo}>
                <Text style={styles.departmentLabel}>AI Detected Department</Text>
                <Text style={[styles.departmentName, { color: DEPARTMENTS[detectedDepartment].color }]}>
                  {DEPARTMENTS[detectedDepartment].name}
                </Text>
              </View>
            </View>
          )}
        </View>
        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={submitComplaint} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Submit</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#333' },
  backButton: { padding: 8 },
  backText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  infoBox: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  infoEmoji: { fontSize: 48, marginBottom: 12 },
  infoTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  infoText: { color: '#AAA', fontSize: 14 },
  inputSection: { marginBottom: 20 },
  label: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: '#333' },
  textArea: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, color: '#FFF', fontSize: 15, minHeight: 160, borderWidth: 1, borderColor: '#333' },
  submitButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  aiAnalyzing: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  aiAnalyzingText: { color: '#888', fontSize: 14 },
  departmentBadge: { marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  departmentIcon: { fontSize: 32 },
  departmentInfo: { flex: 1 },
  departmentLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  departmentName: { fontSize: 16, fontWeight: '700' },
});
