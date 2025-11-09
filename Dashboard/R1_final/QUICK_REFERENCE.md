# Quick Reference - Dashboard Refactor

## 🚀 Installation & Setup

```powershell
# Install dependencies
cd dashboard-frontend
npm install

# Start development
npm start

# Run tests
npm test

# Build for production
npm run build
```

## 📁 Key Files Created/Modified

### New Components
- `src/components/Preloader.js` - Loading screen
- `src/components/Sidebar.js` - Navigation sidebar
- `src/components/ThemeSwitcher.js` - Theme toggle
- `src/components/ErrorBoundary.js` - Error handling
- `src/components/AIAnalysisPanel.js` - AI analysis UI

### New Hooks
- `src/hooks/useTheme.js` - Theme management
- `src/hooks/useDebounced.js` - Input debouncing
- `src/hooks/useAIAnalysis.js` - AI state management
- `src/hooks/usePrefetch.js` - Route prefetching

### Modified Core Files
- `src/App.js` - Added routing, lazy loading
- `src/index.css` - Tailwind integration
- `src/api.js` - Retry logic, cancellation
- `bot-backend/src/config/database.js` - Connection pooling

### Configuration
- `tailwind.config.js` - Tailwind setup
- `postcss.config.js` - PostCSS config

## 🎨 Theme System

### Using Themes
```javascript
import { useTheme } from './hooks/useTheme';

const { theme, setTheme, THEMES } = useTheme();

// Switch to dark mode
setTheme(THEMES.DARK);

// Switch to light mode
setTheme(THEMES.LIGHT);

// Use system preference
setTheme(THEMES.AUTO);
```

### Tailwind Classes
```jsx
// Background colors
className="bg-white dark:bg-black"

// Text colors
className="text-black dark:text-white"
className="text-black/60 dark:text-white/60"

// Borders
className="border border-black/10 dark:border-white/10"

// Hover states
className="hover:bg-black/5 dark:hover:bg-white/5"
```

## 🧭 Routing

### Navigation
```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to tickets
navigate('/tickets');

// Navigate to specific ticket
navigate(`/tickets/${ticketId}`);

// Go back
navigate(-1);
```

### Route Links
```jsx
import { NavLink } from 'react-router-dom';

<NavLink
  to="/dashboard"
  className={({ isActive }) => 
    isActive ? 'active-class' : 'inactive-class'
  }
>
  Dashboard
</NavLink>
```

## 🔌 API Usage

### With Retry & Cancellation
```javascript
import { ticketAPI, createAbortController } from './api';

// Create abort controller
const controller = createAbortController();

// Make request with signal
const tickets = await ticketAPI.getAllTickets({}, controller.signal);

// Cancel request
controller.abort();
```

### Error Handling
```javascript
try {
  const response = await ticketAPI.getDashboardStats();
  setData(response.data);
} catch (error) {
  if (error.cancelled) {
    // Request was cancelled
  } else {
    // Real error
    setError(error.message);
  }
}
```

## 🤖 AI Analysis

### Using AI Hook
```javascript
import { useAIAnalysis } from './hooks/useAIAnalysis';

const { 
  analyzeSingle, 
  isLoading, 
  result, 
  error 
} = useAIAnalysis();

// Analyze ticket
const analysis = await analyzeSingle(ticketId);
```

### AI Panel Component
```jsx
import AIAnalysisPanel from './components/AIAnalysisPanel';

<AIAnalysisPanel 
  ticketId={ticket.id}
  onAnalysisComplete={(result) => {
    console.log('Analysis done:', result);
  }}
/>
```

## 🎯 Common Patterns

### Loading State
```jsx
{loading ? (
  <div className="flex items-center justify-center py-16">
    <div className="w-12 h-12 border-4 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin"></div>
  </div>
) : (
  <Content />
)}
```

### Empty State
```jsx
<div className="flex flex-col items-center justify-center py-16">
  <svg className="w-16 h-16 text-black/20 dark:text-white/20 mb-4">
    {/* Icon */}
  </svg>
  <p className="text-base font-medium">No items found</p>
  <p className="text-sm text-black/60 dark:text-white/60">
    Try adjusting your filters
  </p>
</div>
```

### Card Layout
```jsx
<div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-6">
  <h2 className="text-lg font-semibold mb-4">Title</h2>
  <p className="text-sm text-black/70 dark:text-white/70">Content</p>
</div>
```

### Button Styles
```jsx
// Primary button
<button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-80 transition-opacity">
  Click me
</button>

// Secondary button
<button className="px-4 py-2 border-2 border-black dark:border-white text-black dark:text-white rounded-lg font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
  Cancel
</button>
```

## 🧪 Testing

### Hook Testing
```javascript
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../hooks/useTheme';

test('theme changes', () => {
  const { result } = renderHook(() => useTheme());
  
  act(() => {
    result.current.setTheme('theme-dark');
  });
  
  expect(result.current.theme).toBe('theme-dark');
});
```

### Component Testing
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

test('sidebar renders', () => {
  render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>
  );
  
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

## 🐛 Troubleshooting

### Tailwind not working
```powershell
# Ensure PostCSS config exists
cat postcss.config.js

# Check Tailwind config
cat tailwind.config.js

# Restart dev server
npm start
```

### Theme not persisting
```javascript
// Clear localStorage
localStorage.clear();
window.location.reload();
```

### Build errors
```powershell
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📊 Performance Tips

1. **Lazy Load Heavy Components**
   ```jsx
   const HeavyChart = lazy(() => import('./HeavyChart'));
   
   <Suspense fallback={<Loading />}>
     <HeavyChart />
   </Suspense>
   ```

2. **Memoize Expensive Calculations**
   ```jsx
   const expensiveValue = useMemo(() => {
     return computeExpensive(data);
   }, [data]);
   ```

3. **Debounce Inputs**
   ```jsx
   const [input, setInput] = useState('');
   const debouncedInput = useDebounced(input, 500);
   
   useEffect(() => {
     // API call with debouncedInput
   }, [debouncedInput]);
   ```

4. **Cancel Stale Requests**
   ```jsx
   useEffect(() => {
     const controller = createAbortController();
     
     fetchData(controller.signal);
     
     return () => controller.abort();
   }, []);
   ```

## 🎨 Design Tokens

### Colors
- `black`: #000000
- `white`: #FFFFFF
- `black/60`: rgba(0,0,0,0.6)
- `white/60`: rgba(255,255,255,0.6)

### Spacing Scale
- `p-2`: 0.5rem (8px)
- `p-4`: 1rem (16px)
- `p-6`: 1.5rem (24px)
- `p-8`: 2rem (32px)

### Font Sizes
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)

### Border Radius
- `rounded-lg`: 0.5rem (8px)
- `rounded-xl`: 0.75rem (12px)
- `rounded-2xl`: 1rem (16px)

## 🔗 Useful Links

- [Tailwind Docs](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)
- [React Testing Library](https://testing-library.com/react)
- [CHANGELOG.md](./CHANGELOG.md) - Full changes
- [README_NEW.md](./README_NEW.md) - Complete guide

---

**Keep this handy while working on the dashboard!**
