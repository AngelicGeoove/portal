# UCC Lecture Hall Scheduling Portal

A comprehensive web-based scheduling system for managing university lecture hall bookings. Built for students, staff (class reps and lecturers), and administrators with real-time updates and advanced visualization tools.

## 🎯 Features

### For Students
- **Auto-Populated Schedule**: Schedule automatically populated based on class enrollment (index prefix matching)
- **Weekly Timetable View**: Classic grid-style timetable (Monday-Sunday, 6:00 AM - 8:00 PM)
- **Room Day Grid**: Visual timeline showing room availability across a single day
- **Find Available Rooms**: Advanced search for free rooms with filtering by:
  - Date and time range
  - Capacity requirements
  - Room features (projector, PA system, sockets)
  - Lecture hall location
- **Room Details**: Comprehensive room information including capacity, projector, working sockets, PA system
- **Course View**: See all courses and their schedules
- **Real-time Updates**: Schedule updates automatically when staff make changes

### For Staff (Class Reps & Lecturers)
- **Create Bookings**: 
  - **Permanent Bookings**: Recurring weekly classes with day-of-week scheduling
  - **Event Bookings**: One-time events for specific dates
- **Temporary Free Marking**: Mark normally booked rooms as temporarily available for specific dates
- **Conflict Detection**: Automatic real-time detection of scheduling conflicts
- **Multiple Visualizations**:
  - Weekly timetable view
  - Timeline calendar view
  - Room day grid view
- **Manage Multiple Classes**: Handle multiple class groups using index prefixes (e.g., CS/DVB/22, PS/ITC/21)
- **Edit/Delete Bookings**: Full control over your bookings with validation
- **Dashboard**: Statistics showing your bookings, upcoming classes, and quick actions
- **Seed Sample Bookings**: Generate test bookings for development (prototype feature)

### For Admins
- **Lecture Hall Management**: 
  - Add/edit/delete lecture halls
  - Set hall locations
  - View all rooms within each hall
- **Room Management**: 
  - Add/edit/delete rooms
  - Configure capacity
  - Set features (projector, PA system, working sockets count)
  - Associate rooms with lecture halls
- **Unavailability Management**: Mark specific rooms as unavailable or closed for:
  - Time-based unavailability
  - Specific date unavailability
  - Custom reasons (maintenance, closed, study period)
- **Dashboard**: Comprehensive statistics and recent activity overview
- **View All Bookings**: Monitor all bookings across the system
- **Seed Sample Data**: Generate test halls and rooms for development (prototype feature)

## 🚀 Getting Started

### Prerequisites

1. **Firebase Account**: Create a free account at [Firebase Console](https://console.firebase.google.com/)
2. **Modern Web Browser**: Chrome, Firefox, Safari, or Edge with JavaScript enabled
3. **Text Editor** (for setup): VS Code, Sublime Text, or any code editor
4. **Optional**: Python or Node.js for local server

### Quick Setup (5 minutes)

1. **Clone this repository**:
   ```bash
   git clone https://github.com/yourusername/uccapp.git
   cd uccapp
   ```

2. **Set up Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (name: "UCC Portal")
   - Enable **Authentication** → Email/Password provider
   - Enable **Firestore Database** → Start in production mode
   - Register a Web App in Project Settings

3. **Configure Firebase**:
   - Open `js/firebase-config.js`
   - Replace the placeholder config with your Firebase project config:
   
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

4. **Add Firebase SDK**:
   - Open `index.html`, `student.html`, `staff.html`, and `admin.html`
   - Uncomment the Firebase SDK script tags (remove `<!--` and `-->`):
   
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
   ```

5. **Set up Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

6. **Run Locally**:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # OR using Node.js
   npx http-server
   ```
   
   Navigate to `http://localhost:8000`

### First Time Setup

1. **Access Admin Portal**: 
   - On the login page, press **Ctrl + Alt + A** OR triple-click the top-right corner
   - Sign up as admin with a valid index number format: `AD/MIN/00/0001`
   - Manually set role to 'admin' in Firestore:
     - Firestore Console → users → (your user) → Edit → role: "admin"

2. **Add Infrastructure**:
   - Login to admin portal
   - OR click "Seed Sample Data" to generate test halls and rooms
   - Add lecture halls (e.g., "Engineering Block A", "New Lecture Theatre")
   - Add rooms to each hall with features (capacity, projector, sockets, PA system)

3. **Create Staff Accounts**:
   - Sign up as staff with proper index numbers
   - Check "I am a Lecturer" if applicable
   - Enter managed index prefixes (one per line):
     ```
     CS/DVB/22
     CS/ITC/21
     PS/DVB/20
     ```

4. **Create Student Accounts**:
   - Sign up as students with matching index prefixes
   - Students are automatically assigned to staff based on their index prefix
   - Their schedules auto-populate from assigned staff bookings

## 📖 User Guide

### Index Number System

All users must use the university index number format: **XX/XXX/XX/XXXX**

**Format Breakdown**:
- **XX**: Department code (2 letters, e.g., CS, PS, MA, EN)
- **XXX**: Program code (3 letters, e.g., DVB, ITC, NET, SWE)
- **XX**: Year of enrollment (2 digits, e.g., 19, 20, 21, 22, 23, 24)
- **XXXX**: Student number (4 digits, e.g., 0001, 0273, 1234)

**Valid Examples**:
- ✅ `CS/DVB/22/0001` - Computer Science, DVB program, 2022 cohort, student #1
- ✅ `PS/ITC/19/0273` - PS Department, ITC program, 2019 cohort, student #273
- ✅ `EN/SWE/23/0045` - Engineering, Software Engineering, 2023 cohort, student #45

**Invalid Examples**:
- ❌ `cs/dvb/22/0001` - Must use uppercase letters
- ❌ `CS/DVB/2022/0001` - Year must be 2 digits
- ❌ `CS/DVB/22/1` - Student number must be 4 digits
- ❌ `CS-DVB-22-0001` - Must use forward slashes (/)

### How the Index System Works

**Index Prefix**: The first three parts (XX/XXX/XX) identify a class group
- Example: `CS/DVB/22` identifies all Computer Science DVB students from 2022

**For Students**:
1. Enter full index: `CS/DVB/22/0001`
2. System extracts prefix: `CS/DVB/22`
3. Finds staff managing this prefix
4. Auto-assigns student to those staff
5. Student schedule shows all bookings from assigned staff

**For Staff**:
1. Enter their own index: `CS/DVB/22/0001`
2. Enter managed prefixes (on separate lines):
   ```
   CS/DVB/22
   CS/ITC/21
   PS/DVB/20
   ```
3. Any student with matching prefix gets auto-assigned
4. Staff create bookings and select which class (prefix) it's for
5. Bookings appear in matching students' schedules

### Accessing the Admin Portal

For security, admin portal access is hidden:

**Method 1**: Press **Ctrl + Alt + A** on the login page
**Method 2**: Triple-click the empty space in the top-right corner

After signup, manually change the role in Firestore:
- Firebase Console → Firestore → users → (your user) → Edit field `role` to `"admin"`

### Creating Bookings (Staff)

**Permanent Bookings** (Recurring Weekly):
1. Navigate to "Create Booking" tab
2. Select "Permanent" type
3. Choose lecture hall and room
4. Select day of week (Monday-Sunday)
5. Set start and end time
6. Enter course details
7. Select which class (index prefix) this is for
8. System checks for conflicts
9. Submit to create

**Event Bookings** (One-Time):
1. Select "Event" type
2. Choose lecture hall and room
3. Select specific date
4. Set start and end time
5. Enter event name and details
6. System checks for conflicts with permanent bookings
7. Submit to create

**Marking Rooms Temporarily Free**:
- If you have a permanent booking but the room is free on a specific date
- Edit the booking → "Mark as Free" → Select date(s)
- Students can now see and book that room for the selected dates

### Finding Available Rooms (Students)

1. Navigate to "Find Room" tab
2. Select date and time range
3. Optional filters:
   - Minimum capacity needed
   - Must have projector
   - Must have PA system
   - Minimum number of working sockets
   - Specific lecture hall
4. Click "Search"
5. View results with room day grid visualization
6. See what times each room is available/booked

### Managing Rooms (Admin)

**Add Lecture Hall**:
1. Navigate to "Lecture Halls" tab
2. Click "Add New Hall"
3. Enter name and location
4. Submit

**Add Room**:
1. Navigate to "Rooms" tab
2. Click "Add New Room"
3. Select parent lecture hall
4. Enter room number/name
5. Set capacity
6. Configure features:
   - Number of working sockets
   - Has projector (yes/no)
   - Has PA/mic system (yes/no)
7. Submit

**Mark Room Unavailable**:
1. Navigate to "Unavailability" tab
2. Select room
3. Choose type:
   - Time-based (recurring, e.g., every Monday 8:00-10:00)
   - Date-specific (e.g., December 25, 2026)
4. Set time range
5. Optional: Add custom message
6. Submit

## 🏗️ Project Structure

```
uccapp/
├── index.html                 # Landing/Login page with hidden admin access
├── student.html              # Student portal
├── staff.html                # Staff/Lecturer portal
├── admin.html                # Admin portal (hidden access)
├── timetable.html           # Timetable view page
│
├── css/
│   ├── main.css              # Global styles, variables, layout components
│   ├── auth.css              # Authentication page styles
│   ├── calendar.css          # Calendar and timeline styles
│   └── components.css        # Reusable component styles (modals, toasts, cards)
│
├── js/
│   ├── app.js                # Application entry point and initialization
│   ├── auth.js               # Authentication logic (signup, login, logout)
│   ├── router.js             # Client-side SPA routing
│   ├── firebase-config.js    # Firebase configuration and initialization
│   ├── student.js            # Student portal logic
│   ├── staff.js              # Staff portal logic
│   ├── admin.js              # Admin portal logic
│   ├── timetable.js          # Standalone timetable page logic
│   │
│   ├── components/           # Reusable UI Components
│   │   ├── BookingForm.js    # Dynamic booking form with validation
│   │   ├── Modal.js          # Modal dialog system
│   │   ├── RoomCard.js       # Room information card component
│   │   ├── RoomDayGrid.js    # Room availability grid (rows=rooms, cols=time)
│   │   ├── Timeline.js       # Full calendar timeline view
│   │   ├── Toast.js          # Toast notification system
│   │   └── WeeklyTimetable.js # Weekly grid timetable (Mon-Sun × 6AM-8PM)
│   │
│   ├── services/             # Data Access Layer
│   │   ├── bookingService.js # Booking CRUD operations
│   │   ├── roomService.js    # Room and hall CRUD operations
│   │   └── userService.js    # User data operations
│   │
│   └── utils/                # Utility Functions
│       ├── conflictDetector.js # Booking conflict detection algorithm
│       ├── dateUtils.js       # Date/time manipulation and formatting
│       ├── seedData.js        # Sample data generation for testing
│       └── validation.js      # Input validation (index numbers, email, etc.)
│
├── assets/
│   └── icons/                # Icon assets
│
├── docs/                      # Documentation
│   └── INDEX_NUMBER_SYSTEM.md # Detailed index number documentation
│
├── DEVELOPMENT_PLAN.md       # Comprehensive development roadmap
├── QUICKSTART.md             # 5-minute setup guide
├── SETUP_COMPLETE.md         # Post-setup checklist
├── README.md                 # This file
└── .gitignore                # Git ignore rules
```

## 🎨 Key Components

### Visualization Components

**WeeklyTimetable** (`js/components/WeeklyTimetable.js`):
- Classic grid-style timetable
- 7 rows (Monday-Sunday)
- Time columns from 6:00 AM to 8:00 PM
- Shows both permanent and event bookings
- Color-coded by booking type

**RoomDayGrid** (`js/components/RoomDayGrid.js`):
- Visualizes room availability for a single day
- Rows represent individual rooms
- Columns represent time (6:00 AM - 8:00 PM)
- Shows bookings, temporary free periods, and unavailability
- Interactive: click blocks for details

**Timeline** (`js/components/Timeline.js`):
- Full calendar view
- Displays all bookings across multiple days
- Month/week/day views
- Drag-and-drop support (future feature)

### Service Layer

**bookingService.js**:
- Create, read, update, delete bookings
- Get bookings by room, staff, or date range
- Handle permanent and event bookings
- Manage temporary free dates

**roomService.js**:
- Manage lecture halls and rooms
- Filter rooms by features (projector, sockets, capacity)
- Find available rooms based on criteria
- Handle room unavailability periods

**userService.js**:
- User profile management
- Index prefix matching and assignment
- Staff-student relationship management

### Utility Systems

**conflictDetector.js**:
- Detects permanent vs permanent conflicts (same day/time)
- Detects event vs event conflicts (same date/time)
- Detects event vs permanent conflicts (checks temporary free dates)
- Validates unavailability periods

**dateUtils.js**:
- Date formatting and parsing
- Time range overlap detection
- Day of week calculations
- Week boundary calculations

## � Data Models

### Firestore Collections

#### users
```javascript
{
  userId: "firebaseAuthUID",
  email: "user@example.com",
  name: "John Doe",
  indexNumber: "CS/DVB/22/0001",     // XX/XXX/XX/XXXX format
  role: "student | staff | admin",
  createdAt: Timestamp,
  
  // For students only
  indexPrefix: "CS/DVB/22",         // Auto-extracted from indexNumber
  assignedToStaff: ["staffId1", "staffId2"],  // Auto-assigned by prefix matching
  
  // For staff only
  isLecturer: true,                 // true = lecturer, false = class rep
  managedIndexPrefixes: ["CS/DVB/22", "CS/ITC/21"]  // Classes they manage
}
```

#### lectureHalls
```javascript
{
  hallId: "auto-generated-id",
  name: "Engineering Block A",
  location: "Main Campus, Building 5",
  createdAt: Timestamp,
  createdBy: "adminUserId"
}
```

#### rooms
```javascript
{
  roomId: "auto-generated-id",
  hallId: "parent-hall-id",
  number: "Room 101",              // Room number/name
  roomNumber: "101",               // Alias field
  capacity: 50,                    // Number of seats
  features: {
    workingSockets: 12,            // Number of working power outlets
    hasProjector: true,            // Has projector/screen
    hasMicSpeaker: true            // Has PA/sound system
  },
  createdAt: Timestamp
}
```

#### bookings
```javascript
{
  bookingId: "auto-generated-id",
  type: "permanent | event",
  staffId: "userId-of-creator",
  userName: "Staff Name",
  hallId: "lecture-hall-id",
  hallName: "Engineering Block A",
  roomId: "room-id",
  roomNumber: "101",
  
  // For permanent bookings (recurring weekly)
  dayOfWeek: 1,                   // 1=Monday, 7=Sunday
  
  // For event bookings (one-time)
  date: "2026-02-17",             // YYYY-MM-DD format
  
  // Common fields
  startTime: "08:00",             // HH:MM 24-hour format
  endTime: "10:00",               // HH:MM 24-hour format
  
  // Course/Event details
  title: "CSC101 - Intro to CS",
  courseName: "Introduction to Computer Science",
  courseCode: "CSC101",
  description: "Additional details",
  indexPrefix: "CS/DVB/22",       // Which class this is for
  
  // Metadata
  temporaryFreeDates: ["2026-02-20", "2026-02-25"],  // Dates when room is free
  isActive: true,                 // Soft delete flag
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### unavailability
```javascript
{
  unavailabilityId: "auto-generated-id",
  roomId: "room-id",
  
  // For time-based unavailability (recurring)
  dayOfWeek: 1,                   // 1-7, for recurring unavailability
  
  // For date-specific unavailability
  date: "2026-12-25",             // Specific date
  
  // Common fields
  startTime: "00:00",
  endTime: "23:59",
  reason: "maintenance | closed | other",
  customMessage: "Holiday closure",
  createdAt: Timestamp,
  createdBy: "adminUserId"
}
```

## 🚢 Deployment

### GitHub Pages Deployment

1. **Prepare Repository**:
   ```bash
   git init
   git add .
   git commit -m "UCC Portal - Initial deployment"
   ```

2. **Create GitHub Repository**:
   - Go to GitHub and create a new public repository
   - Name it `uccapp` or your preferred name
   - Do NOT initialize with README (you already have one)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/yourusername/uccapp.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - Repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/ (root)`
   - Click Save

5. **Configure Firebase**:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add: `yourusername.github.io`
   - Wait 2-3 minutes for GitHub Pages to build

6. **Access Your Site**:
   - Your site will be live at: `https://yourusername.github.io/uccapp/`
   - Test all features thoroughly

### Custom Domain (Optional)

1. **Add CNAME file** to repository root:
   ```
   portal.yourschool.edu
   ```

2. **Configure DNS** with your domain provider:
   - Add CNAME record pointing to: `yourusername.github.io`
   - Or A records pointing to GitHub Pages IPs

3. **Update Firebase**:
   - Add your custom domain to Firebase authorized domains

4. **Enable HTTPS**:
   - GitHub Pages will automatically provision SSL certificate
   - May take a few minutes to activate

## 🔒 Security Best Practices

### Firebase Security

**Firestore Security Rules** (minimum viable):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own document
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // All authenticated users can read halls and rooms
    match /lectureHalls/{hallId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'staff';
      allow update, delete: if request.auth.uid == resource.data.staffId;
    }
    
    // Unavailability - admin only
    match /unavailability/{unavailId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Production Checklist

- [ ] Never commit Firebase config to public repositories (use environment variables)
- [ ] Implement proper Firestore security rules (above is a starting point)
- [ ] Enable Firebase App Check to prevent API abuse
- [ ] Set up Firebase Authentication rate limiting
- [ ] Regularly audit user roles and permissions
- [ ] Keep admin portal access method secret
- [ ] Monitor Firebase usage to stay within free tier limits
- [ ] Set up Firebase alerts for unusual activity
- [ ] Regularly backup Firestore data
- [ ] Test security rules with Firebase Emulator

## 🛠️ Development

### Tech Stack

**Frontend**:
- Vanilla JavaScript (ES6+) with modules
- HTML5 semantic markup
- CSS3 with CSS Variables for theming
- No build tools required (runs directly in browser)

**Backend**:
- Firebase Authentication (Email/Password)
- Cloud Firestore (NoSQL database)
- Firebase Hosting compatible

**Architecture**:
- Component-based architecture
- Service layer for data access
- Client-side routing (SPA)
- Real-time data synchronization

### Adding New Features

**1. Create a new component** (`js/components/YourComponent.js`):
```javascript
export function renderYourComponent(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Your rendering logic
    container.innerHTML = `
        <div class="your-component">
            <!-- Your HTML -->
        </div>
    `;
    
    // Add event listeners
    setupEventListeners();
}
```

**2. Create a new service** (`js/services/yourService.js`):
```javascript
import { db } from '../firebase-config.js';

export async function createItem(itemData) {
    try {
        const docRef = await db.collection('items').add(itemData);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: error.message };
    }
}
```

**3. Add styles** (`css/components.css`):
```css
.your-component {
    /* Use CSS variables for consistency */
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
}
```

**4. Update navigation** in the relevant portal file:
```javascript
document.addEventListener('routechange', async (e) => {
    if (e.detail?.route === 'your-route') {
        await loadYourRoute();
    }
});
```

### Code Style Guide

**JavaScript**:
- Use ES6+ features (arrow functions, destructuring, async/await)
- Keep functions small and focused (< 50 lines)
- Use descriptive variable names
- Add JSDoc comments for functions
- Handle errors gracefully with try-catch
- Use `const` by default, `let` when reassignment needed

**CSS**:
- Use CSS variables from `:root` in `main.css`
- Follow BEM-like naming: `component__element--modifier`
- Mobile-first responsive design
- Keep selectors simple and specific

**File Organization**:
- Components: Reusable UI elements
- Services: Database operations
- Utils: Pure functions and helpers
- Portal files: Page-specific logic

### Testing

**Manual Testing Checklist**:

Student Portal:
- [ ] View auto-populated schedule
- [ ] Search for available rooms with filters
- [ ] View room day grid
- [ ] Navigate between weeks in timetable

Staff Portal:
- [ ] Create permanent booking
- [ ] Create event booking
- [ ] Mark room temporarily free
- [ ] Edit existing booking
- [ ] Delete booking
- [ ] View conflict warnings

Admin Portal:
- [ ] Add lecture hall
- [ ] Add room with features
- [ ] Edit room details
- [ ] Mark room unavailable
- [ ] View all bookings
- [ ] View statistics

Authentication:
- [ ] Sign up as student with auto-assignment
- [ ] Sign up as staff with index prefixes
- [ ] Access admin portal with secret method
- [ ] Logout and login again
- [ ] Invalid credentials rejection

### Development Tools

**Recommended VS Code Extensions**:
- Live Server - Launch development server
- ESLint - JavaScript linting
- Prettier - Code formatting
- Firebase Explorer - Browse Firestore data

**Browser DevTools**:
- Use Console for debugging
- Network tab for Firebase requests
- Application tab for Firebase auth state

### Common Development Tasks

**Add a new room feature**:
1. Update `rooms` collection schema
2. Update `roomService.js` to handle new feature
3. Update room creation/edit forms in `admin.js`
4. Update `RoomCard.js` to display new feature
5. Update filter logic in `roomService.js`

**Add a new user role**:
1. Update signup flow in `auth.js`
2. Create new portal HTML file
3. Create corresponding portal JS file
4. Update `router.js` to redirect to new portal
5. Update Firestore security rules

**Modify timetable display**:
1. Update `WeeklyTimetable.js` component
2. Adjust time range (START_TIME/END_TIME constants)
3. Update CSS in `calendar.css`
4. Test with various booking scenarios

## 🐛 Troubleshooting

### Firebase Issues

**"Firebase not initialized"**:
- ✅ Check Firebase SDK scripts are loaded (not commented out)
- ✅ Verify `firebase-config.js` has correct credentials
- ✅ Check browser console for specific errors
- ✅ Ensure Firebase project is active

**"Unauthorized domain"**:
- ✅ Firebase Console → Authentication → Settings → Authorized domains
- ✅ Add `localhost` for local development
- ✅ Add your GitHub Pages domain for production
- ✅ Wait 2-3 minutes for changes to propagate

**"Permission denied"**:
- ✅ Check Firestore security rules
- ✅ Verify user is authenticated (`auth.currentUser`)
- ✅ Check user role matches required permission
- ✅ Ensure document paths are correct

### Booking Issues

**"Conflict detected" when there shouldn't be**:
- ✅ Check dayOfWeek values (1-7, not 0-6)
- ✅ Verify time format is "HH:MM" (24-hour)
- ✅ Check temporary free dates are properly formatted (YYYY-MM-DD)
- ✅ Debug `conflictDetector.js` with console logs

**Schedule not showing for students**:
- ✅ Verify student `indexPrefix` matches staff `managedIndexPrefixes`
- ✅ Check `assignedToStaff` array is populated
- ✅ Ensure bookings have correct `indexPrefix` field
- ✅ Verify booking `isActive` is true

### UI Issues

**Timetable not rendering**:
- ✅ Check container element exists with correct ID
- ✅ Verify bookings data is in correct format
- ✅ Check for JavaScript errors in console
- ✅ Ensure date format is YYYY-MM-DD

**Modals not closing**:
- ✅ Verify modal backdrop event listeners are attached
- ✅ Check for JavaScript errors preventing execution
- ✅ Ensure closeModal() is being called

**Styles not applying**:
- ✅ Check CSS file is loaded (Network tab)
- ✅ Verify CSS selectors match HTML structure
- ✅ Check for CSS specificity conflicts
- ✅ Clear browser cache

## 📚 Additional Resources

### Documentation Files

- **[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)**: Comprehensive development roadmap with detailed implementation steps
- **[QUICKSTART.md](QUICKSTART.md)**: 5-minute setup guide for quick deployment
- **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)**: Post-setup verification checklist
- **[docs/INDEX_NUMBER_SYSTEM.md](docs/INDEX_NUMBER_SYSTEM.md)**: Detailed explanation of the index number system

### Firebase Documentation

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Cloud Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

### Learning Resources

- [MDN Web Docs](https://developer.mozilla.org/) - HTML, CSS, JavaScript reference
- [JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Async/Await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await)

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation for new features
- Keep commits focused and atomic

## 📄 License

This project is open source and available under the MIT License. Free for educational and non-commercial use.

## 🙏 Acknowledgments

- Built for **University of Cape Coast (UCC)** to streamline lecture hall management
- Designed to improve student experience and reduce scheduling conflicts
- Inspired by modern university scheduling systems
- Thanks to the Firebase team for excellent documentation

## 📞 Support

### Getting Help

1. **Read the documentation**:
   - Check [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for implementation details
   - Review [QUICKSTART.md](QUICKSTART.md) for setup issues
   - See [docs/INDEX_NUMBER_SYSTEM.md](docs/INDEX_NUMBER_SYSTEM.md) for index format questions

2. **Check browser console**:
   - Look for JavaScript errors
   - Check Firebase errors
   - Verify network requests

3. **Firebase Console**:
   - Monitor Authentication status
   - Check Firestore data
   - Review security rules
   - Check usage quotas

4. **Common Issues**:
   - See Troubleshooting section above
   - Check closed issues on GitHub
   - Review Firebase documentation

### Feature Requests

Have an idea for improvement? Open an issue on GitHub with:
- Clear description of the feature
- Use case explanation
- Mockups or examples (if applicable)

---

**Version**: 2.0.0  
**Last Updated**: February 17, 2026  
**Status**: Production Ready ✅

---

Made with ❤️ for UCC Students and Staff
