import { supabase, TABLES } from './supabase';
import { BACKEND_URL } from './config';

export const complaintService = {
  // Sessions
  async createSession(userEmail, title = 'New Complaint') {
    try {
      if (!supabase) {
        return { success: true, data: { id: Date.now(), user_email: userEmail, title } };
      }
      const { data, error } = await supabase
        .from(TABLES.COMPLAINT_SESSIONS)
        .insert([{ user_email: userEmail, title }])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message };
    }
  },

  async listSessions(userEmail) {
    try {
      if (!supabase) {
        return { success: true, data: [] };
      }
      const { data, error } = await supabase
        .from(TABLES.COMPLAINT_SESSIONS)
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error listing sessions:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  async updateSessionTitle(sessionId, title) {
    try {
      if (!supabase) {
        return { success: true };
      }
      const { error } = await supabase
        .from(TABLES.COMPLAINT_SESSIONS)
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating session title:', error);
      return { success: false, error: error.message };
    }
  },

  async addMessage(sessionId, message) {
    try {
      if (!supabase) {
        return { success: true, data: { id: Date.now(), ...message, session_id: sessionId } };
      }
      
      // Only insert fields that exist in complaint_messages table
      const messageData = {
        session_id: sessionId,
        message: message.text || '',
        created_at: message.created_at || new Date().toISOString(),
        // complaint_messages table has: id, session_id, message, created_at
      };
      
      const { data, error } = await supabase
        .from(TABLES.COMPLAINT_MESSAGES)
        .insert([messageData])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error adding message:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteMessage(messageId) {
    try {
      if (!supabase) {
        return { success: true };
      }
      const { error } = await supabase
        .from(TABLES.COMPLAINT_MESSAGES)
        .delete()
        .eq('id', messageId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  },

  async listMessages(sessionId) {
    try {
      if (!supabase) {
        return { success: true, data: [] };
      }
      const { data, error } = await supabase
        .from(TABLES.COMPLAINT_MESSAGES)
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error listing messages:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Create a new complaint via backend API (creates ticket)
  async createComplaint(complaint) {
    try {
      // Step 1: Create the ticket first
      const ticketResponse = await fetch(`${BACKEND_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: complaint.user_email || 'anonymous',
          username: complaint.user_email?.split('@')[0] || 'Anonymous',
          firstName: complaint.firstName || '',
          lastName: complaint.lastName || '',
          // Append media URL to query so backend stores reference
          query: `${complaint.description || complaint.title || 'No description'}${complaint.media_url ? '\nMedia: ' + complaint.media_url : ''}`,
          category: complaint.department || 'general',
          latitude: complaint.latitude,
          longitude: complaint.longitude,
        })
      });
      
      const ticketData = await ticketResponse.json();
      if (!ticketResponse.ok) {
        throw new Error(ticketData.message || ticketData.error || 'Failed to create ticket');
      }

      const ticketId = ticketData.data.ticketId || ticketData.data.ticket_id;

      // Step 2: Backend image upload skipped (already stored directly in Supabase). Future: optional association endpoint.
      
      return { success: true, data: ticketData.data };
    } catch (error) {
      console.error('Error creating complaint:', error);
      return { success: false, error: error.message };
    }
  },

  // Get ticket responses (admin replies) for a specific ticket
  async getTicketResponses(ticketId) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tickets/${ticketId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch responses');
      
      // Backend returns { success: true, data: { ticketId, ..., responses: [] } }
      return { 
        success: true, 
        data: data.data?.responses || [] 
      };
    } catch (error) {
      console.error('Error fetching ticket responses:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Add a response to an existing ticket via backend API (this will trigger Socket.IO notifications)
  async addTicketResponse(ticketId, message) {
    try {
      if (!ticketId) return { success: false, error: 'ticketId required' };

      const response = await fetch(`${BACKEND_URL}/api/tickets/${ticketId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.text || message }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to add response');

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error adding ticket response:', error);
      return { success: false, error: error.message };
    }
  },

  // Get full ticket details including worker assignments
  async getTicketDetails(ticketId) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tickets/${ticketId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch ticket details');
      
      // Backend returns full ticket data including responses and worker_tasks
      return { 
        success: true, 
        data: data.data || {} 
      };
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      return { success: false, error: error.message, data: {} };
    }
  },

  // Ask backend (Gemini) for a safety check of a place in Chhattisgarh
  async checkSafety(place) {
    try {
      if (!place) return { success: false, error: 'place required' };
      
      // Check if backend URL is configured (allow localhost and network IPs)
      if (!BACKEND_URL) {
        return { 
          success: true, 
          data: { 
            safe: true, 
            message: 'Safety check unavailable. Backend not configured.',
            rating: 3 
          } 
        };
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });
      
      const fetchPromise = fetch(`${BACKEND_URL}/api/gemini/safety-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || data.error || 'Safety check failed');
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error checking safety:', error);
      // Return default safe response on error
      return { 
        success: true, 
        data: { 
          safe: true, 
          message: 'Safety check unavailable. Please try again later.',
          rating: 3 
        } 
      };
    }
  },

  // Get user's complaints
  async getUserComplaints(userEmail) {
    try {
      if (!supabase) {
        // Return mock data when Supabase is not configured
        return { 
          success: true, 
          data: [
            {
              id: 1,
              user_email: userEmail,
              title: 'Sample Complaint',
              description: 'This is a sample complaint. Configure Supabase to see real data.',
              urgency: 'medium',
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ]
        };
      }
      
      const { data, error } = await supabase
        .from(TABLES.COMPLAINTS)
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching complaints:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get complaint messages/chat
  async getComplaintMessages(complaintId) {
    try {
      if (!supabase) {
        return { success: true, data: [] };
      }
      
      const { data, error } = await supabase
        .from(TABLES.COMPLAINTS)
        .select('messages')
        .eq('id', complaintId)
        .single();
      
      if (error) throw error;
      return { success: true, data: data?.messages || [] };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Upload media to Supabase storage
  async uploadMedia(file, bucket = 'complaint-media') {
    try {
      if (!supabase) {
        // Return mock URL when Supabase is not configured
        return { success: true, url: 'https://via.placeholder.com/300' };
      }
      
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { success: false, error: error.message };
    }
  },
};
