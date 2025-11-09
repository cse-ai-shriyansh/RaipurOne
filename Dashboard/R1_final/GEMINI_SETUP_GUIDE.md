# Gemini AI Integration Guide

## Environment Variables

Add these variables to your backend `.env` file:

```bash
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_1=your_primary_key
GEMINI_API_KEY_2=your_fallback_key_2
GEMINI_API_KEY_3=your_fallback_key_3
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent

# Development Mode (optional)
NODE_ENV=development
```

## Mock Mode for Local Development

The system automatically provides mock responses when:
- `NODE_ENV=development`
- No `GEMINI_API_KEY` is set

This allows full development and testing without live API access.

### Example Mock Responses

**Transcription Mock:**
```json
{
  "transcription": "[Mock] Image transcription for: image.jpg. This appears to be a municipal complaint...",
  "confidence": 85,
  "language": "en",
  "mock": true
}
```

**Analysis Mock:**
```json
{
  "summary": "[Mock] This ticket appears to be about road maintenance issues...",
  "details": {
    "category": "Infrastructure",
    "urgency": "Medium",
    "department": "roadway"
  },
  "confidence": 90,
  "mock": true
}
```

## API Endpoints

### POST /api/gemini/transcribe

Transcribe text from an image using Gemini Vision API.

**Request:**
```json
{
  "imageUrl": "https://example.com/ticket-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transcription": "Extracted text from image...",
    "extracted_text": "Specific text found...",
    "description": "Description of visible content",
    "confidence": 90,
    "language": "en"
  }
}
```

### POST /api/gemini/analyze

Analyze ticket content with custom query.

**Request:**
```json
{
  "ticketId": "TICKET-001",
  "query": "What department should handle this complaint?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Concise 1-2 sentence summary",
    "details": {
      "category": "Infrastructure",
      "urgency": "High",
      "department": "roadway",
      "estimated_resolution_time": "3-5 business days",
      "suggested_actions": [
        "Dispatch inspection team",
        "Schedule repair"
      ]
    },
    "confidence": 95
  }
}
```

## Testing

### Run Unit Tests
```bash
cd dashboard-frontend
npm test
```

### Run Specific Test
```bash
npm test -- TicketViewer.test
```

### Test with Coverage
```bash
npm test -- --coverage
```

### Manual Testing Checklist

1. **Image Transcription:**
   - Upload ticket with image
   - Click "Transcribe Image" button
   - Verify loading state appears
   - Verify transcription result displays

2. **AI Analysis:**
   - Open ticket detail page
   - Expand "AI Analysis" panel
   - Click "Start Department Analysis"
   - Verify progressive states (queued → in-progress → success)
   - Test custom query input (debounced)

3. **Theme Switching:**
   - Click theme switcher in sidebar
   - Verify smooth transition
   - Check auto mode respects system preference
   - Reload page - theme should persist
   - No flash of unstyled content

4. **Accessibility:**
   - Tab through UI with keyboard
   - Verify focus states visible
   - Test with screen reader
   - Check aria-live regions update

## Performance Targets

Run Lighthouse audit to verify:

```bash
npm run build
npx serve -s build
# Open Chrome DevTools > Lighthouse
```

**Targets:**
- LCP (Largest Contentful Paint): < 1.5s
- FID (First Input Delay): < 100ms
- TBT (Total Blocking Time): < 200ms
- Lighthouse Score: > 90

## Troubleshooting

### Transcription Not Working

1. Check backend console for errors
2. Verify `GEMINI_API_KEY` is set correctly
3. Check API key quota/limits in Google Cloud Console
4. Inspect network tab for 400/500 errors

### Mock Mode Not Activating

Ensure `.env` file has:
```bash
NODE_ENV=development
```

And remove or comment out `GEMINI_API_KEY`.

### Theme Flash on Load

Verify `index.html` contains inline script before React loads:
```html
<script>
  (function() {
    var theme = localStorage.getItem('r1_theme') || 'auto';
    // ... theme application logic
  })();
</script>
```

### Analysis Hanging

Check:
- Backend is running on port 3001
- Frontend proxy is configured
- No CORS errors in console
- Request not being blocked by ad blocker

## Production Deployment

### Environment Variables

Set in production environment:
```bash
GEMINI_API_KEY=prod_key_here
NODE_ENV=production
```

### Build Optimization

```bash
cd dashboard-frontend
npm run build
```

Verify build output:
- Bundle size < 500KB (gzipped)
- No console warnings
- Source maps excluded from production

### Backend Configuration

Ensure rate limiting and retry logic are configured:
```javascript
// Already configured in geminiController.js
// - 2 retry attempts with exponential backoff
// - Proper error handling
// - Mock fallback for dev
```

## API Rate Limits

**Gemini API Limits:**
- Free tier: 60 requests/minute
- Paid tier: Varies by plan

**Handling:**
- System uses exponential backoff (1s, 2s)
- Supports multiple API keys for failover
- Debounced UI inputs (600ms) to reduce calls

## Security Best Practices

1. **Never expose API keys in frontend**
   - All Gemini calls go through backend
   - Frontend uses `/api/gemini/*` endpoints

2. **Validate requests**
   - Backend validates imageUrl and query params
   - Sanitize user inputs before sending to Gemini

3. **Rate limiting**
   - Consider adding express-rate-limit middleware
   - Monitor API usage in Google Cloud Console

4. **Error handling**
   - Don't expose internal errors to frontend
   - Log detailed errors server-side only
   - Provide user-friendly fallback messages
