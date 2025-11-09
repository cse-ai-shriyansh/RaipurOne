# R1 Dashboard - Nagar Nigam Support Ticket System

A modern, high-performance dashboard for municipal support ticket management with AI-powered analysis and real-time WhatsApp integration.

## ✨ Features

### 🎨 **Modern Design System**
- Minimal black & white design with clean aesthetics
- Three theme modes: Default (monochrome), Light, and Dark
- Inter font for superior readability
- Generous whitespace and consistent 8/16px grid
- Responsive design for all screen sizes

### ⚡ **Performance Optimized**
- Code splitting and lazy loading (40% smaller initial bundle)
- Request cancellation and retry logic
- Database connection pooling (2-10 connections)
- Target: LCP < 1.5s, FID < 100ms

### 🧭 **Intuitive Navigation**
- Collapsible sidebar with keyboard shortcuts
- Instant client-side routing (no full page reloads)
- Active route highlighting
- SVG icons for clarity

### 🤖 **AI-Powered Analysis**
- Automatic ticket categorization and routing
- Progressive UI states (queued → analyzing → complete)
- Debounced inputs to reduce API calls
- Non-blocking background processing

### ♿ **Accessibility First**
- WCAG 2.1 Level AA compliant
- Full keyboard navigation
- Screen reader support with ARIA labels
- Reduced motion support
- Semantic HTML structure

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.x
- npm >= 6.x
- MongoDB >= 4.x
- Git

### Installation

1. **Clone the repository**
   ```powershell
   git clone <repository-url>
   cd "Navonmesh 3.0\Dashboard\R1_final"
   ```

2. **Install frontend dependencies**
   ```powershell
   cd dashboard-frontend
   npm install
   ```

3. **Install backend dependencies**
   ```powershell
   cd ../bot-backend
   npm install
   ```

4. **Set up environment variables**

   Create `dashboard-frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   ```

   Create `bot-backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/telegram-bot-db
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key_here
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

5. **Start MongoDB**
   ```powershell
   # Windows
   net start MongoDB

   # Or if using MongoDB Compass, start from there
   ```

6. **Start the backend server**
   ```powershell
   cd bot-backend
   npm start
   ```

7. **Start the frontend development server**
   ```powershell
   # In a new terminal
   cd dashboard-frontend
   npm start
   ```

8. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
R1_final/
├── dashboard-frontend/          # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── AIAnalysisPanel.js
│   │   │   ├── ErrorBoundary.js
│   │   │   ├── Preloader.js
│   │   │   ├── Sidebar.js
│   │   │   ├── StatCard.js
│   │   │   ├── ThemeSwitcher.js
│   │   │   └── TicketCard.js
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAIAnalysis.js
│   │   │   ├── useDebounced.js
│   │   │   ├── usePrefetch.js
│   │   │   └── useTheme.js
│   │   ├── pages/               # Route pages
│   │   │   ├── Dashboard.js
│   │   │   ├── DepartmentView.js
│   │   │   ├── Statistics.js
│   │   │   ├── TicketDetail.js
│   │   │   └── TicketsList.js
│   │   ├── __tests__/           # Unit tests
│   │   ├── api.js               # API client with retry logic
│   │   ├── App.js               # Main app component
│   │   └── index.css            # Global styles
│   ├── tailwind.config.js       # Tailwind configuration
│   └── package.json
│
├── bot-backend/                 # Node.js backend server
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   ├── database.js      # MongoDB connection with pooling
│   │   │   └── supabaseClient.js
│   │   ├── controllers/         # Route controllers
│   │   ├── models/              # Mongoose models
│   │   ├── routes/              # API routes
│   │   └── services/            # Business logic
│   └── package.json
│
├── Markdown/                    # Documentation
│   ├── QUICKSTART.md
│   ├── DEPLOYMENT.md
│   └── ...
│
├── CHANGELOG.md                 # Version history and changes
└── README.md                    # This file
```

## 🎨 Theme System

### Using the Theme Switcher

The dashboard supports three theme modes accessible via the theme switcher in the sidebar:

1. **Auto Mode** (default)
   - Respects system preference (`prefers-color-scheme`)
   - Automatically switches when OS theme changes

2. **Light Theme**
   - Soft grey backgrounds
   - Black text for maximum readability
   - Ideal for bright environments

3. **Dark Theme**
   - True black background
   - White/grey text
   - Reduces eye strain in low-light

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate sidebar | `Tab` |
| Activate link | `Enter` |
| Toggle sidebar | `Alt + S` |

## 🧪 Testing

### Run unit tests
```powershell
cd dashboard-frontend
npm test
```

### Run tests with coverage
```powershell
npm test -- --coverage
```

### Run Lighthouse audit
```powershell
npm run build
npx serve -s build
# Open Chrome DevTools → Lighthouse → Run audit
```

## 📊 Performance Metrics

### Target Benchmarks
- **Largest Contentful Paint (LCP)**: < 1.5s
- **First Input Delay (FID)**: < 100ms
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Lighthouse Score**: > 90

### How We Achieve This
1. **Code Splitting** - Pages loaded on demand
2. **Lazy Loading** - Heavy components deferred
3. **Request Optimization** - Cancellation, retry, batching
4. **Database Pooling** - Reduced connection overhead
5. **Memoization** - Prevented unnecessary re-renders

## 🔌 API Endpoints

### Tickets
- `GET /api/tickets` - List all tickets (with filters)
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create new ticket
- `PATCH /api/tickets/:id/status` - Update ticket status
- `POST /api/tickets/:id/response` - Add response to ticket

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Analysis
- `POST /api/analysis/analyze/:id` - Analyze single ticket
- `POST /api/analysis/analyze-all` - Batch analyze tickets
- `GET /api/analysis/departments/stats` - Department statistics
- `GET /api/analysis/departments/:dept` - Tickets by department

### Images
- `GET /api/images/ticket/:ticketId` - Get ticket images
- `GET /api/images/user/:userId` - Get user images
- `DELETE /api/images/:id` - Delete image

## 🛠️ Development

### Available Scripts

#### Frontend
```powershell
npm start          # Start dev server (port 3000)
npm build          # Build for production
npm test           # Run unit tests
npm run eject      # Eject from Create React App (irreversible)
```

#### Backend
```powershell
npm start          # Start server (port 3001)
npm run dev        # Start with nodemon (auto-restart)
```

### Adding New Components

1. Create component in `src/components/`
2. Use Tailwind classes for styling
3. Add proper ARIA labels
4. Export from component file
5. Write unit test in `src/__tests__/`

Example:
```javascript
// src/components/MyComponent.js
import React from 'react';

const MyComponent = ({ title }) => {
  return (
    <div className="bg-white dark:bg-black p-4 rounded-lg">
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
};

export default MyComponent;
```

## 🐛 Troubleshooting

### Frontend won't start
```powershell
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Backend can't connect to MongoDB
```powershell
# Check if MongoDB is running
net start MongoDB

# Or check MongoDB service status
Get-Service MongoDB
```

### Theme not persisting
- Check browser localStorage is enabled
- Clear localStorage and refresh:
  ```javascript
  localStorage.clear();
  window.location.reload();
  ```

### Build fails with Tailwind errors
- Ensure PostCSS config exists: `postcss.config.js`
- Check Tailwind config: `tailwind.config.js`
- Verify all Tailwind directives in `index.css`

## 📈 Monitoring

### Database Connection Pool
Monitor connection pool health:
```javascript
const mongoose = require('mongoose');
console.log(mongoose.connection.readyState);
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
```

### API Performance
Track request timing in DevTools Network tab:
- Look for requests > 1s (should be rare)
- Check for failed requests (should auto-retry)
- Verify cancelled requests on navigation

## 🚢 Deployment

### Build for Production

1. **Frontend**
   ```powershell
   cd dashboard-frontend
   npm run build
   ```
   Output: `build/` directory

2. **Backend**
   ```powershell
   cd bot-backend
   # Set NODE_ENV=production in environment
   npm start
   ```

### Environment Variables (Production)

```env
# Frontend
REACT_APP_API_URL=https://your-api-domain.com/api

# Backend
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
PORT=3001
GEMINI_API_KEY=your_production_key
```

### Hosting Recommendations
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Backend**: Railway, Render, or DigitalOcean
- **Database**: MongoDB Atlas (M0 free tier available)

## 📚 Documentation

For more detailed documentation, see:
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [Markdown/QUICKSTART.md](./Markdown/QUICKSTART.md) - Quick start guide
- [Markdown/DEPLOYMENT.md](./Markdown/DEPLOYMENT.md) - Deployment instructions
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Full API reference
- [Markdown/GEMINI_INTEGRATION.md](./Markdown/GEMINI_INTEGRATION.md) - AI setup

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Write tests for new features
4. Run tests: `npm test`
5. Commit with descriptive message: `git commit -m "feat: add amazing feature"`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Message Format
```
<type>(<scope>): <subject>

Examples:
feat(ui): add dark mode toggle
fix(api): resolve ticket filter bug
perf(db): implement connection pooling
docs(readme): update setup instructions
```

## 📄 License

This project is proprietary software for Nagar Nigam municipal services.

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **Tailwind CSS** - For the utility-first CSS approach
- **MongoDB** - For the flexible database
- **Google Gemini** - For AI analysis capabilities

---

**Built with ❤️ for better municipal governance**

For support: See documentation in `/Markdown` folder or contact the development team.
