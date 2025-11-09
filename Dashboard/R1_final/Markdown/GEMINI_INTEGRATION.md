# Gemini AI Integration for Ticket Analysis

This feature uses Google's Gemini AI to automatically analyze support tickets, classify them by type and department, and provide simplified summaries.

## 🔑 Setup Instructions

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Configure the Backend

1. Open `bot-backend/.env`
2. Replace the placeholder with your actual API key:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

### 3. Restart the Backend Server

```powershell
cd bot-backend
npm start
```

## 🎯 Features

### Automatic Ticket Classification

The system analyzes each ticket and classifies it into:

#### Request Types:
- **Valid**: Legitimate customer requests that need attention
- **Invalid**: Incomplete or unclear requests
- **Garbage**: Spam, nonsense, or malicious content

#### Departments:
- **Roadway**: Road maintenance, potholes, street repairs, traffic issues
- **Cleaning**: Garbage collection, sanitation, waste management
- **Drainage**: Sewage problems, blocked drains, flooding issues
- **Water Supply**: Water supply issues, leaks, water quality problems
- **General**: Everything else

### AI-Generated Insights

For each ticket, Gemini provides:
- ✅ **Simplified Summary**: Concise 1-2 sentence summary
- 🎯 **Priority Level**: low, medium, high, or urgent
- 💡 **Suggested Actions**: 2-3 recommended next steps
- 📊 **Confidence Score**: 0-100% confidence in classification
- 📝 **Reasoning**: Explanation of the classification decision

## 📊 Dashboard Features

### Analysis Button

Located on the main dashboard, the "🧠 Analyze All Tickets with AI" button:
- Analyzes all pending (open status) tickets
- Routes them to appropriate departments
- Stores results in separate database collections
- Shows real-time progress and results

### Department View

New "🏢 Departments" tab shows:
- Overview statistics by department
- Breakdown by request type (valid/invalid/garbage)
- Clickable department cards to view tickets
- Detailed ticket information with AI analysis

## 🔌 API Endpoints

### POST `/api/analysis/analyze-all`
Analyzes all pending tickets

**Response:**
```json
{
  "success": true,
  "message": "Analysis complete. Processed 15 tickets successfully, 0 failed.",
  "processed": 15,
  "failed": 0,
  "total": 15,
  "results": [...]
}
```

### POST `/api/analysis/analyze/:ticketId`
Analyzes a single ticket

### GET `/api/analysis/departments/stats`
Get department statistics

### GET `/api/analysis/departments/:department`
Get tickets for a specific department (technical, billing, support, general, invalid, garbage)

## 📁 Database Structure

### DepartmentTicket Collection

Stores analyzed tickets with:
```javascript
{
  ticketId: "DEPT-TKT-ABC12",
  originalTicketId: "TKT-ABC12",
  department: "technical",
  requestType: "valid",
  userId: "12345",
  username: "john_doe",
  originalQuery: "I can't log in to my account",
  simplifiedSummary: "User experiencing login issues",
  priority: "high",
  status: "pending",
  geminiAnalysis: {
    confidence: 95,
    reasoning: "Clear technical issue affecting user access",
    suggestedActions: [
      "Check user credentials",
      "Verify account status",
      "Reset password if needed"
    ]
  },
  processedAt: "2025-10-29T...",
  createdAt: "2025-10-29T..."
}
```

## ⚠️ Important Notes

1. **API Key Security**: Never commit your actual API key to git. The .env file is gitignored.

2. **Rate Limiting**: The system adds a 1-second delay between ticket analyses to avoid rate limits.

3. **Error Handling**: If Gemini API fails, the system provides a fallback classification for manual review.

4. **Cost**: Gemini API has free tier limits. Check [Google AI pricing](https://ai.google.dev/pricing) for details.

## 🧪 Testing

1. Create some test tickets via Telegram bot:
   ```
   /ticket My payment is not going through
   /ticket How do I reset my password?
   /ticket asdfghjkl random text
   ```

2. Go to dashboard and click "🧠 Analyze All Tickets with AI"

3. View results in "🏢 Departments" tab

4. Check different departments to see how tickets were classified

## 🔧 Troubleshooting

### "Gemini API key not configured" error
- Make sure you've added your API key to `.env`
- Restart the backend server after adding the key

### Tickets not being analyzed
- Check that tickets have "open" status
- Already analyzed tickets are skipped (check DepartmentTicket collection)
- Verify API key is valid at Google AI Studio

### Low confidence scores
- May indicate ambiguous or unclear ticket queries
- Review and manually reclassify if needed

## 📝 Example Usage Flow

1. User creates ticket via Telegram: `/ticket I need help with billing`
2. Admin clicks "Analyze All Tickets" button in dashboard
3. Gemini AI analyzes: 
   - Type: Valid
   - Department: Billing
   - Summary: "User needs assistance with billing inquiry"
   - Priority: Medium
   - Suggested: ["Review account billing history", "Contact billing team", "Provide invoice details"]
4. Ticket appears in Departments → Billing section
5. Team member reviews and takes suggested actions

## 🚀 Future Enhancements

- Auto-analysis on ticket creation (real-time)
- Email notifications to department teams
- Ticket routing workflows
- Custom department definitions
- Multi-language support
- Sentiment analysis
