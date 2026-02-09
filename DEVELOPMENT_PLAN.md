# UCC App - University Lecture Hall Scheduling Portal
## Development Plan

---

## 1. Project Overview

### Purpose
A student portal for booking and viewing lecture hall schedules across the university campus. The system enables students to find available rooms for personal study while allowing class representatives and lecturers to manage room bookings.

### Target Users
- **Students**: View schedules, find free rooms
- **Class Reps/Lecturers (Staff)**: Book rooms for classes and events
- **Admins**: Manage lecture halls, rooms, and features

### Hosting
GitHub Pages (static site)

---

## 2. Technical Stack

### Frontend
- **HTML5/CSS3**: Structure and styling
- **JavaScript (ES6+)**: Core functionality
- **Framework Options**:
  - Vanilla JS + Web Components (lightweight, no build process)
  - React (with Vite for build) - Recommended for complex state management
  - Vue.js (simpler learning curve)

### Data Persistence
Since GitHub Pages is static-only, we need a backend solution:
- **Option 1**: Firebase (Firestore + Authentication)
- **Option 2**: Supabase (PostgreSQL + Authentication)
- **Option 3**: GitHub as backend (using GitHub API + JSON files in repo)
- **Recommended**: Firebase - Free tier, easy integration, real-time updates

### UI/UX Libraries
- **Calendar/Timeline**: FullCalendar.js or custom implementation
- **Icons**: Font Awesome or Lucide Icons
- **Styling**: Tailwind CSS or custom CSS with CSS Grid/Flexbox
- **Notifications**: Custom toast component

---

## 3. Data Models

### 3.1 Users Collection
```javascript
{
  userId: "string (auto-generated)",
  indexNumber: "XX/XXX/XX/XXXX",
  role: "student | staff | admin",
  name: "string",
  email: "string",
  createdAt: "timestamp",
  
  // For staff only
  managedIndexPrefixes: ["CS/DVB/19", "CS/ITC/20"], // Which classes they manage
  isLecturer: boolean,
  
  // For students
  assignedToStaff: ["staffUserId1", "staffUserId2"] // Auto-assigned based on index prefix
}
```

### 3.2 Lecture Halls Collection
```javascript
{
  hallId: "string (auto-generated)",
  name: "Engineering Block A",
  location: "string",
  createdAt: "timestamp",
  createdBy: "adminUserId"
}
```

### 3.3 Rooms Collection
```javascript
{
  roomId: "string (auto-generated)",
  hallId: "string (foreign key)",
  roomNumber: "Room 5",
  capacity: 50,
  features: {
    workingSockets: 12,
    hasProjector: true,
    hasMicSpeaker: true
  },
  createdAt: "timestamp"
}
```

### 3.4 Bookings Collection
```javascript
{
  bookingId: "string (auto-generated)",
  roomId: "string (foreign key)",
  staffId: "string (user who made booking)",
  type: "permanent | event",
  
  // Course/Class info
  courseName: "Data Structures",
  courseCode: "CS201",
  indexPrefix: "CS/DVB/22", // Which class this is for
  lecturerId: "string (optional)", // Reference to lecturer
  lecturerName: "string (can be 'Unspecified')",
  
  // Time details
  dayOfWeek: 1-7, // For permanent bookings
  startTime: "08:00",
  endTime: "10:00",
  date: "YYYY-MM-DD", // For event bookings
  
  // Status
  isActive: true,
  temporaryFreeDates: ["2026-02-10", "2026-02-17"], // Dates when this is marked free
  
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 3.5 Unavailable Periods Collection
```javascript
{
  periodId: "string",
  roomId: "string",
  date: "YYYY-MM-DD" or dayOfWeek: 1-7,
  startTime: "string",
  endTime: "string",
  reason: "maintenance | cleaning | student_study | closed",
  customMessage: "string (optional)",
  isRecurring: boolean,
  createdBy: "adminUserId"
}
```

---

## 4. Development Phases

### Phase 1: Project Setup & Foundation (Week 1)
**Goal**: Set up development environment and basic structure

#### Tasks:
1. Initialize Git repository
2. Set up project structure:
   ```
   uccapp/
   ├── index.html
   ├── css/
   │   ├── main.css
   │   ├── calendar.css
   │   └── components.css
   ├── js/
   │   ├── app.js
   │   ├── auth.js
   │   ├── firebase-config.js
   │   ├── models/
   │   ├── components/
   │   └── utils/
   ├── assets/
   │   └── icons/
   ├── admin.html (hidden page)
   ├── staff.html
   └── student.html
   ```
3. Set up Firebase project:
   - Create Firebase project
   - Enable Firestore
   - Enable Authentication (Email/Password)
   - Set up security rules
   - Add Firebase SDK to project
4. Create basic HTML shell with navigation
5. Implement responsive layout foundation

**Deliverables**: 
- Basic project structure
- Firebase integration working
- Responsive shell page

---

### Phase 2: Authentication System (Week 1-2)
**Goal**: Implement user registration and login

#### Tasks:
1. Create authentication UI:
   - Login form
   - Sign-up form with index number validation
   - Role selection (Student vs Staff)
   - Staff: Additional field for managed index prefixes
2. Implement index number validation:
   - Format: XX/XXX/XX/XXXX
   - Parse and validate pattern
3. Create user registration flow:
   - Validate index number format
   - For students: Auto-assign to matching staff
   - For staff: Store managed index prefixes
4. Implement login/logout functionality
5. Create session management
6. Build role-based routing:
   - Redirect students to student portal
   - Redirect staff to staff portal
   - Admin secret access (special button combo or URL)
7. Create user profile component

**Deliverables**:
- Working authentication system
- Role-based access control
- User profile management

---

### Phase 3: Admin Portal (Week 2)
**Goal**: Build admin interface for managing infrastructure

#### Tasks:
1. Create admin access mechanism:
   - Hidden button or keyboard shortcut (e.g., Ctrl+Alt+A on login page)
   - Special URL route (e.g., /admin-portal-secret)
2. Build Lecture Hall Management:
   - Add new lecture hall form
   - List all halls
   - Edit hall details
   - Delete hall (with confirmation)
3. Build Room Management:
   - Add rooms to lecture halls
   - Set room capacity
   - Configure room features (sockets, projector, PA)
   - Edit room details
   - Delete rooms
4. Build Unavailability Management:
   - Mark rooms as completely unavailable for specific periods
   - Set custom messages for closures
   - Create recurring unavailability rules
   - Distinguish between "closed" and "free for student study"
5. Create admin dashboard with statistics:
   - Total halls, rooms
   - Usage statistics
   - Recent bookings

**Deliverables**:
- Functional admin portal
- Full CRUD operations for halls and rooms
- Unavailability management system

---

### Phase 4: Visual Calendar Component (Week 3)
**Goal**: Build the core calendar/timeline visualization

#### Tasks:
1. Design calendar layout:
   - Timeline view (6 AM - 8 PM)
   - Day/Week view options
   - Lecture hall filter
   - Date picker
2. Implement Timeline Component:
   - Grid layout with time slots (30-minute intervals)
   - Lecture halls as columns
   - Rooms as sub-columns (shown on expand)
3. Color coding system:
   - **Booked** (permanent): Blue
   - **Booked** (event): Purple
   - **Available**: Green/White
   - **Temporarily Free**: Yellow (normally booked but marked free)
   - **Unavailable**: Red/Gray
   - **Closed for Study**: Light Green with icon
4. Implement Two View Modes:
   - **All View**: Full day schedule (6 AM - 8 PM)
   - **Current View**: Next 2 hours from current time
5. Add current hour highlighting:
   - Visual marker showing current time
   - Auto-scroll to current time on load
6. Implement room features icons:
   - Small icons next to room names
   - Tooltip showing full feature list
7. Make time slots clickable:
   - Show booking details modal
   - Display room features
   - Show course/lecturer info
8. Implement filtering:
   - By lecture hall
   - By date
   - By availability status
9. Add responsive behavior for mobile devices

**Deliverables**:
- Interactive visual calendar
- Two view modes working
- Color-coded time slots
- Room details on click

---

### Phase 5: Staff Booking System (Week 4)
**Goal**: Implement booking functionality for class reps and lecturers

#### Tasks:
1. Create booking interface:
   - Select lecture hall and room
   - Choose date and time range
   - Booking type: Permanent or Event
2. For Permanent Bookings:
   - Select day of week (recurring)
   - Input course details
   - Lecturer assignment (dropdown or "Unspecified")
   - Specify which class (index prefix) this is for
3. For Event Bookings:
   - Single date selection
   - Event name and purpose
   - Specify class if applicable
4. Implement Conflict Detection:
   - Check for overlapping bookings
   - Show error message if conflict exists
   - Suggest alternative times/rooms
   - Highlight conflicts in red
5. Build "Temporarily Free" marking:
   - For permanent bookings, option to mark specific dates as free
   - Show in calendar with special color
6. Implement booking modification:
   - Edit booking details
   - Update lecturer assignment
   - Modify time/room
7. Implement booking deletion:
   - Delete single occurrence
   - Delete entire recurring booking
   - Confirmation dialog
8. Create Staff Dashboard:
   - List all their bookings
   - Quick stats (upcoming classes)
   - Managed classes overview
9. For Lecturers:
   - View multiple classes they teach
   - Book for different class groups
   - See their full schedule across all classes

**Deliverables**:
- Complete booking system
- Conflict detection working
- Temporary free marking functional
- Booking CRUD operations working

---

### Phase 6: Student Portal (Week 5)
**Goal**: Build student-facing features

#### Tasks:
1. Create Student Dashboard:
   - Personal schedule view (auto-populated from staff bookings)
   - Upcoming classes
   - Room finder for personal study
2. Implement Schedule Auto-Population:
   - Query bookings where indexPrefix matches student's index
   - Display in personal calendar
   - Show course, time, room, lecturer details
3. Build Room Availability Finder:
   - Filter for available rooms now/soon
   - Show room features
   - Display how long room is available
4. Create "My Courses" Page:
   - List all courses student is enrolled in
   - Show which staff/lecturer manages each
   - Display schedule for each course
5. Implement visual calendar for students:
   - Read-only view
   - Highlight their own classes
   - Show all bookings with color coding
6. Add room details modal:
   - Working sockets count
   - Projector availability
   - PA/Mic availability
   - Capacity
   - Current availability status

**Deliverables**:
- Student dashboard
- Auto-populated personal schedule
- Room finder functionality
- My Courses page

---

### Phase 7: Polish & Optimization (Week 6)
**Goal**: Improve UX, performance, and fix bugs

#### Tasks:
1. UI/UX Improvements:
   - Smooth animations and transitions
   - Loading states for all async operations
   - Error handling and user-friendly messages
   - Success notifications (toast messages)
   - Confirmation dialogs for destructive actions
2. Performance Optimization:
   - Implement data caching
   - Lazy loading for large lists
   - Optimize Firebase queries
   - Add indexes in Firestore
3. Responsive Design:
   - Test on mobile devices
   - Adjust layouts for tablets
   - Ensure touch-friendly interface
4. Accessibility:
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Color contrast compliance
5. Testing:
   - Manual testing of all features
   - Edge case testing
   - Multi-user scenario testing
6. Documentation:
   - User guide for each role
   - Admin setup instructions
   - Code documentation

**Deliverables**:
- Polished, production-ready application
- Complete documentation
- Bug-free experience

---

### Phase 8: Deployment & GitHub Pages Setup (Week 6)
**Goal**: Deploy to GitHub Pages

#### Tasks:
1. Build optimization:
   - Minify CSS/JS files
   - Optimize images
   - Set up build process if using React/Vue
2. GitHub Pages setup:
   - Configure repository settings
   - Set up custom domain (if applicable)
   - Create CNAME file
3. Environment configuration:
   - Set up production Firebase config
   - Environment-specific settings
4. Deploy:
   - Push to GitHub Pages branch
   - Test live site
5. Monitoring:
   - Set up error tracking (optional: Sentry)
   - Analytics (optional: Google Analytics)

**Deliverables**:
- Live application on GitHub Pages
- Deployment documentation
- Monitoring setup

---

## 5. Firebase Security Rules

### Firestore Rules (Draft)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isStaff() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'staff';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if true; // Allow signup
      allow update, delete: if request.auth.uid == userId || isAdmin();
    }
    
    // Lecture Halls
    match /lectureHalls/{hallId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Rooms
    match /rooms/{roomId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read: if isSignedIn();
      allow create: if isStaff();
      allow update, delete: if isStaff() && 
                              request.auth.uid == resource.data.staffId;
    }
    
    // Unavailable Periods
    match /unavailablePeriods/{periodId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

---

## 6. Key Features Implementation Notes

### 6.1 Index Number System
- Format: `XX/XXX/XX/XXXX`
  - First segment: Department code (e.g., CS, PS, ITC)
  - Second segment: Program code (e.g., DVB, ITC)
  - Third segment: Year (e.g., 19, 20, 22)
  - Fourth segment: Student number (e.g., 0001-9999)

- **Staff Management**: Staff stores prefix `XX/XXX/XX`
- **Student Assignment**: On signup, match student's prefix to staff's managed prefixes
- **Auto-population**: Query bookings where `indexPrefix` matches student's prefix

### 6.2 Conflict Detection Algorithm
```javascript
function checkConflict(newBooking, existingBookings) {
  for (let booking of existingBookings) {
    // Same room check
    if (booking.roomId !== newBooking.roomId) continue;
    
    // For permanent bookings
    if (newBooking.type === 'permanent') {
      if (booking.type === 'permanent' && 
          booking.dayOfWeek === newBooking.dayOfWeek) {
        if (timeOverlap(booking, newBooking)) {
          // Check if marked as temporarily free
          if (!booking.temporaryFreeDates.includes(newBooking.date)) {
            return { conflict: true, booking };
          }
        }
      }
    }
    
    // For event bookings
    if (newBooking.type === 'event') {
      if (booking.type === 'event' && booking.date === newBooking.date) {
        if (timeOverlap(booking, newBooking)) {
          return { conflict: true, booking };
        }
      }
      // Check against permanent bookings on that date
      if (booking.type === 'permanent') {
        let dayOfWeek = getDayOfWeek(newBooking.date);
        if (booking.dayOfWeek === dayOfWeek) {
          if (!booking.temporaryFreeDates.includes(newBooking.date)) {
            if (timeOverlap(booking, newBooking)) {
              return { conflict: true, booking };
            }
          }
        }
      }
    }
  }
  return { conflict: false };
}
```

### 6.3 Timeline View Architecture
- **Grid System**: CSS Grid with 30-minute intervals (28 rows for 6 AM - 8 PM)
- **Columns**: Dynamic based on selected lecture halls
- **Expandable Rooms**: Click hall to see individual rooms
- **Time Blocks**: Calculate grid position based on start/end time
- **Current Time Marker**: Vertical line showing current time, updated every minute

### 6.4 Temporary Free System
- Staff can mark specific dates of permanent bookings as "temporarily free"
- Stored as array of dates in booking document
- Calendar shows with yellow/warning color
- Allows other staff to book for events on that date
- Students see it as available for study

---

## 7. Future Enhancements (Post-MVP)

### Phase 9+: Additional Features
1. **Notifications**:
   - Email reminders for upcoming classes
   - Push notifications for booking confirmations
   - Alerts for booking changes

2. **Advanced Search**:
   - Search by course name
   - Find rooms by feature requirements
   - Availability prediction

3. **Analytics Dashboard**:
   - Room utilization rates
   - Popular booking times
   - Peak usage patterns

4. **Mobile App**:
   - Native mobile version
   - Offline support
   - Location-based room finder

5. **QR Code System**:
   - QR codes on room doors
   - Scan to see room details and schedule
   - Quick booking from mobile

6. **Booking History**:
   - Archive of past bookings
   - Reports and statistics
   - Export functionality

7. **Collaborative Features**:
   - Comments on bookings
   - Request to use room (student to staff)
   - Swap room bookings

---

## 8. Testing Strategy

### Unit Testing
- Test authentication functions
- Test conflict detection algorithm
- Test date/time calculations
- Test index number validation

### Integration Testing
- Test Firebase operations
- Test booking flow end-to-end
- Test user role switching
- Test data synchronization

### User Acceptance Testing
- Test with real students
- Test with class reps and lecturers
- Test admin workflows
- Collect feedback and iterate

---

## 9. Deployment Checklist

- [ ] Firebase production environment configured
- [ ] Security rules deployed and tested
- [ ] All API keys secured (use environment variables)
- [ ] GitHub Actions workflow created (optional)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate verified
- [ ] Performance tested (Lighthouse score)
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] User documentation created
- [ ] Admin setup guide written
- [ ] Backup strategy implemented
- [ ] Error monitoring configured

---

## 10. Maintenance Plan

### Regular Tasks
- Monitor Firebase usage and costs
- Review security rules
- Update dependencies
- Backup Firestore data regularly
- Review and optimize slow queries

### User Support
- Create FAQ page
- Set up support contact method
- Monitor user feedback
- Regular feature updates based on feedback

---

## 11. Git Workflow

### Branch Strategy
- `main`: Production code (deployed to GitHub Pages)
- `develop`: Integration branch
- `feature/*`: Individual features
- `bugfix/*`: Bug fixes

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

---

## 12. File Structure (Detailed)

```
uccapp/
├── index.html                 # Landing/Login page
├── student.html              # Student portal
├── staff.html                # Staff booking portal
├── admin.html                # Admin management portal (hidden)
├── css/
│   ├── main.css              # Global styles
│   ├── auth.css              # Authentication styles
│   ├── calendar.css          # Calendar/Timeline styles
│   ├── components.css        # Reusable components
│   └── responsive.css        # Media queries
├── js/
│   ├── app.js                # Main application entry
│   ├── auth.js               # Authentication logic
│   ├── firebase-config.js    # Firebase initialization
│   ├── router.js             # Client-side routing
│   ├── models/
│   │   ├── User.js
│   │   ├── LectureHall.js
│   │   ├── Room.js
│   │   ├── Booking.js
│   │   └── UnavailablePeriod.js
│   ├── components/
│   │   ├── Timeline.js       # Timeline calendar component
│   │   ├── BookingForm.js    # Booking creation form
│   │   ├── RoomCard.js       # Room details card
│   │   ├── Modal.js          # Modal component
│   │   └── Toast.js          # Notification toasts
│   ├── services/
│   │   ├── bookingService.js # Booking CRUD operations
│   │   ├── roomService.js    # Room management
│   │   └── userService.js    # User operations
│   └── utils/
│       ├── dateUtils.js      # Date/time helpers
│       ├── validation.js     # Input validation
│       └── conflictDetector.js # Booking conflict logic
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── docs/
│   ├── USER_GUIDE.md
│   └── ADMIN_GUIDE.md
├── .gitignore
├── README.md
└── DEVELOPMENT_PLAN.md       # This file
```

---

## 13. Notes for GitHub Pages Integration

Since GitHub Pages is static hosting, all dynamic functionality must be handled client-side:

### Key Considerations:
1. **No Backend Server**: All logic runs in the browser
2. **Firebase for Backend**: Use Firebase for:
   - Authentication
   - Database (Firestore)
   - Real-time updates
   - File storage (if needed)
3. **Environment Variables**: 
   - Firebase config should be in a separate file
   - Use different projects for dev/prod
   - Add comments in code where sensitive config goes
4. **Build Process** (if using framework):
   - Configure build output to root or `docs/` folder
   - Set up GitHub Actions for auto-deployment
5. **Routing**: 
   - Use hash-based routing (#/student, #/staff, #/admin)
   - Or configure GitHub Pages for SPA routing

### Comments to Add in Code:
```javascript
// TODO: Add your Firebase configuration here
// Get this from Firebase Console > Project Settings > Web App
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
};
```

---

## Estimated Timeline: 6 Weeks

- **Week 1**: Setup + Authentication
- **Week 2**: Admin Portal
- **Week 3**: Calendar Component
- **Week 4**: Booking System
- **Week 5**: Student Portal
- **Week 6**: Polish + Deploy

---

## Success Criteria

✅ Students can view their schedule automatically  
✅ Students can find free rooms for study  
✅ Staff can book rooms without conflicts  
✅ Staff can mark dates as temporarily free  
✅ Admins can manage halls and rooms  
✅ Visual calendar clearly shows availability  
✅ System works on mobile devices  
✅ Deployed successfully on GitHub Pages  

---

*This plan is a living document and will be updated as development progresses.*
