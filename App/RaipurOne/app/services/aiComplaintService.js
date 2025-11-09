/**
 * AI Service for Complaint Classification and Title Generation
 * Generates concise titles and categorizes complaints by department
 */

// Simple AI-like classification based on keywords
export const aiComplaintService = {
  /**
   * Generate a short, descriptive title from complaint text
   * @param {string} text - The complaint description
   * @returns {string} - Short title (max 40 chars)
   */
  generateTitle(text) {
    if (!text || text.trim().length === 0) {
      return 'New Complaint';
    }

    const cleanText = text.trim();
    
    // If text is short enough, use it as is
    if (cleanText.length <= 40) {
      return cleanText;
    }

    // Extract key action and subject
    const keywords = this.extractKeywords(cleanText);
    const department = this.classifyDepartment(cleanText);
    
    // Generate title format: "DEPARTMENT: Issue"
    const subject = keywords.slice(0, 3).join(' ');
    const title = `${department.toUpperCase()}: ${subject}`;
    
    // Truncate if still too long
    if (title.length > 40) {
      return title.substring(0, 37) + '...';
    }
    
    return title;
  },

  /**
   * Classify complaint into department categories
   * @param {string} text - The complaint description
   * @returns {string} - Department name (WATER, ROAD, GARBAGE, ELECTRICITY, etc.)
   */
  classifyDepartment(text) {
    const lowerText = text.toLowerCase();

    // WATER Department
    if (
      lowerText.includes('water') ||
      lowerText.includes('pipe') ||
      lowerText.includes('leak') ||
      lowerText.includes('supply') ||
      lowerText.includes('drainage') ||
      lowerText.includes('tap')
    ) {
      return 'WATER';
    }

    // ROAD Department
    if (
      lowerText.includes('road') ||
      lowerText.includes('pothole') ||
      lowerText.includes('street') ||
      lowerText.includes('path') ||
      lowerText.includes('footpath') ||
      lowerText.includes('pavement')
    ) {
      return 'ROAD';
    }

    // GARBAGE Department
    if (
      lowerText.includes('garbage') ||
      lowerText.includes('waste') ||
      lowerText.includes('trash') ||
      lowerText.includes('dustbin') ||
      lowerText.includes('smell') ||
      lowerText.includes('kachra') ||
      lowerText.includes('kuda')
    ) {
      return 'GARBAGE';
    }

    // ELECTRICITY Department
    if (
      lowerText.includes('light') ||
      lowerText.includes('electricity') ||
      lowerText.includes('power') ||
      lowerText.includes('bulb') ||
      lowerText.includes('street light') ||
      lowerText.includes('lamp')
    ) {
      return 'ELECTRICITY';
    }

    // PARK & GARDEN Department
    if (
      lowerText.includes('park') ||
      lowerText.includes('garden') ||
      lowerText.includes('tree') ||
      lowerText.includes('playground')
    ) {
      return 'PARKS';
    }

    // HEALTH & SANITATION
    if (
      lowerText.includes('hospital') ||
      lowerText.includes('health') ||
      lowerText.includes('sanitation') ||
      lowerText.includes('toilet') ||
      lowerText.includes('medical')
    ) {
      return 'HEALTH';
    }

    // PUBLIC SAFETY
    if (
      lowerText.includes('accident') ||
      lowerText.includes('danger') ||
      lowerText.includes('unsafe') ||
      lowerText.includes('crime') ||
      lowerText.includes('safety')
    ) {
      return 'SAFETY';
    }

    // Default
    return 'GENERAL';
  },

  /**
   * Extract important keywords from text
   * @param {string} text
   * @returns {string[]} - Array of keywords
   */
  extractKeywords(text) {
    // Remove common stop words
    const stopWords = new Set([
      'the', 'is', 'are', 'was', 'were', 'a', 'an', 'and', 'or', 'but',
      'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up',
      'about', 'into', 'through', 'during', 'including', 'there', 'here',
      'very', 'not', 'please', 'has', 'have', 'had', 'been', 'be'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Return unique words
    return [...new Set(words)];
  },

  /**
   * Get department color for UI
   * @param {string} department
   * @returns {string} - Hex color code
   */
  getDepartmentColor(department) {
    const colors = {
      WATER: '#2196F3',      // Blue
      ROAD: '#9E9E9E',       // Gray
      GARBAGE: '#4CAF50',    // Green
      ELECTRICITY: '#FFC107', // Amber
      PARKS: '#8BC34A',      // Light Green
      HEALTH: '#F44336',     // Red
      SAFETY: '#FF5722',     // Deep Orange
      GENERAL: '#607D8B',    // Blue Gray
    };

    return colors[department] || colors.GENERAL;
  },

  /**
   * Get urgency level from text analysis
   * @param {string} text
   * @returns {string} - 'critical' | 'high' | 'normal' | 'low'
   */
  analyzeUrgency(text) {
    const lowerText = text.toLowerCase();

    // Critical urgency keywords
    if (
      lowerText.includes('emergency') ||
      lowerText.includes('urgent') ||
      lowerText.includes('immediate') ||
      lowerText.includes('accident') ||
      lowerText.includes('danger') ||
      lowerText.includes('fire') ||
      lowerText.includes('flood')
    ) {
      return 'critical';
    }

    // High urgency
    if (
      lowerText.includes('asap') ||
      lowerText.includes('quickly') ||
      lowerText.includes('soon') ||
      lowerText.includes('fast') ||
      lowerText.includes('problem')
    ) {
      return 'high';
    }

    // Low urgency
    if (
      lowerText.includes('minor') ||
      lowerText.includes('small') ||
      lowerText.includes('little') ||
      lowerText.includes('when possible')
    ) {
      return 'low';
    }

    // Default: normal
    return 'normal';
  },
};
