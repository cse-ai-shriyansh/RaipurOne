import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ComplaintMapView = ({ tickets = [], initialRegion, onMarkerPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.webHeader}>
        <Text style={styles.webHeaderTitle}>📍 Complaint Locations</Text>
        <Text style={styles.webHeaderSubtitle}>
          Map view is available on mobile app only
        </Text>
      </View>
      <ScrollView style={styles.webList}>
        {tickets.map((ticket) => (
          <View 
            key={ticket.ticket_id || ticket.ticketId} 
            style={styles.webTicketCard}
          >
            <View style={styles.webTicketHeader}>
              <Text style={styles.webTicketId}>
                {ticket.ticket_id || ticket.ticketId}
              </Text>
              <Text style={[
                styles.webTicketStatus,
                { 
                  backgroundColor: ticket.status === 'resolved' 
                    ? '#4CAF50' 
                    : ticket.status === 'in-progress' 
                    ? '#2196F3' 
                    : '#FFC107' 
                }
              ]}>
                {ticket.status?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.webTicketDescription} numberOfLines={2}>
              {ticket.query || ticket.description}
            </Text>
            <View style={styles.webTicketFooter}>
              <Text style={styles.webTicketDepartment}>
                🏢 {ticket.department || 'GENERAL'}
              </Text>
              {ticket.latitude && ticket.longitude && (
                <Text style={styles.webTicketLocation}>
                  📍 {parseFloat(ticket.latitude).toFixed(4)}, {parseFloat(ticket.longitude).toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        ))}
        {tickets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tickets with location data</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  webHeader: {
    padding: 20,
    backgroundColor: '#2196F3',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  webHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  webHeaderSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  webList: {
    flex: 1,
  },
  webTicketCard: {
    backgroundColor: '#FFF',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webTicketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  webTicketId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  webTicketStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  webTicketDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  webTicketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  webTicketDepartment: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  webTicketLocation: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default ComplaintMapView;
