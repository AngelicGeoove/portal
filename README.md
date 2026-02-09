# UCC Lecture Hall Scheduling Portal

A comprehensive web-based scheduling system for managing university lecture hall bookings. Built for students, staff (class reps and lecturers), and administrators.

## 🎯 Features

### For Students
- **View Personal Schedule**: Automatically populated based on class enrollment
- **Find Available Rooms**: Search for free rooms for personal study
- **Room Details**: View room features (capacity, projector, sockets, PA system)
- **Visual Calendar**: Interactive timeline showing all bookings

### For Staff (Class Reps & Lecturers)
- **Book Rooms**: Create permanent (recurring) or event (one-time) bookings
- **Conflict Detection**: Automatic detection of booking conflicts
- **Temporary Free Marking**: Mark normally booked rooms as free for specific dates
- **Manage Multiple Classes**: Lecturers can manage multiple class groups
- **Edit/Delete Bookings**: Full control over your bookings

### For Admins
- **Manage Infrastructure**: Add/edit lecture halls and rooms
- **Room Features**: Configure room capacity and features
- **Unavailability Management**: Mark rooms as unavailable or closed
- **Dashboard**: View statistics and recent activity

## 🚀 Getting Started

### Prerequisites

1. **Firebase Account**: Create a free account at [Firebase Console](https://console.firebase.google.com/)
2. **Web Browser**: Modern browser with JavaScript enabled
3. **Text Editor**: VS Code, Sublime, or any code editor

### Installation

1. **Clone or Download** this repository

2. **Set up Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable **Authentication** (Email/Password)
   - Enable **Firestore Database**
   - Create a Web App in your Firebase project

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

4. **Set up Firestore Security Rules**:
   - Copy the security rules from `DEVELOPMENT_PLAN.md` Section 5
   - Paste into Firestore Rules in Firebase Console

5. **Add Firebase SDK to HTML files**:
   - Open `index.html`, `student.html`, `staff.html`, and `admin.html`
   - Uncomment the Firebase SDK script tags
   - Update version numbers to latest (currently 9.x.x)
   
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
   ```

6. **Run Locally**:
   - Simply open `index.html` in your browser
   - Or use a local server:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js (if you have http-server installed)
     npx http-server
     ```
   - Navigate to `http://localhost:8000`

## 📖 User Guide

### Creating Your First Admin Account

The admin portal is hidden for security. To access it:

1. Go to the login page
2. **Triple-click** the empty space in the top-right corner, OR
3. Press **Ctrl + Alt + A**
4. Sign up as an admin (manually change role in Firestore to 'admin')

### Index Number Format

All users must use the university index number format: **XX/XXX/XX/XXXX**

Example: `CS/DVB/22/0001`
- **CS**: Department code
- **DVB**: Program code
- **22**: Year of enrollment
- **0001**: Student number

### For Class Reps/Lecturers

When signing up as staff:
1. Enter your index number
2. Select "Class Rep / Lecturer"
3. Check "I am a Lecturer" if applicable
4. Enter the index prefixes you manage (e.g., `CS/DVB/22`)
   - One per line
   - Students with matching prefixes will auto-populate their schedules

### Booking Rooms

**Permanent Bookings**: Recurring weekly classes
- Select day of week
- Choose time slot
- Assign to class and lecturer

**Event Bookings**: One-time events
- Select specific date
- Choose time slot
- Provide event name

## 🏗️ Project Structure

```
uccapp/
├── index.html              # Login/Landing page
├── student.html           # Student portal
├── staff.html             # Staff portal
├── admin.html             # Admin portal
├── css/
│   ├── main.css           # Global styles
│   ├── auth.css           # Authentication styles
│   ├── calendar.css       # Timeline/calendar styles
│   └── components.css     # Component styles
├── js/
│   ├── app.js             # Application entry point
│   ├── auth.js            # Authentication logic
│   ├── router.js          # Client-side routing
│   ├── firebase-config.js # Firebase configuration
│   ├── components/        # UI components
│   ├── services/          # Data services
│   └── utils/             # Utility functions
├── assets/                # Images and icons
├── DEVELOPMENT_PLAN.md    # Detailed development plan
└── README.md              # This file
```

## 🚢 Deployment to GitHub Pages

1. **Prepare Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**:
   - Go to GitHub and create a new repository
   - Follow the instructions to push your local repository

3. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Source: Deploy from branch
   - Branch: `main` or `master`
   - Folder: `/ (root)`
   - Save

4. **Access Your Site**:
   - Your site will be available at: `https://yourusername.github.io/uccapp/`

5. **Custom Domain** (Optional):
   - Add a `CNAME` file with your domain
   - Configure DNS settings with your domain provider

## 🔒 Security Notes

- Never commit sensitive Firebase config if repository is public
- Use environment variables for production
- Keep Firebase security rules strict
- Regularly review user access and permissions
- The admin portal should only be accessible via the secret method

## 🛠️ Development

### Adding New Features

1. Follow the structure in `DEVELOPMENT_PLAN.md`
2. Create new services in `js/services/`
3. Create new components in `js/components/`
4. Update CSS in appropriate stylesheet
5. Test thoroughly before deployment

### Code Style

- Use ES6+ JavaScript features
- Follow existing naming conventions
- Comment complex logic
- Keep functions focused and small

## 📝 Data Models

### Users
- userId, email, name, indexNumber
- role: 'student' | 'staff' | 'admin'
- Staff: managedIndexPrefixes[], isLecturer
- Students: assignedToStaff[]

### Lecture Halls
- hallId, name, location

### Rooms
- roomId, hallId, roomNumber, capacity
- features: { workingSockets, hasProjector, hasMicSpeaker }

### Bookings
- bookingId, roomId, staffId
- type: 'permanent' | 'event'
- For permanent: dayOfWeek, startTime, endTime
- For events: date, startTime, endTime
- courseName, courseCode, indexPrefix
- temporaryFreeDates[]

## 🐛 Troubleshooting

### Firebase Not Initialized
- Check that Firebase SDK scripts are loaded
- Verify firebase-config.js has correct credentials
- Check browser console for errors

### Login Not Working
- Verify Firebase Authentication is enabled
- Check Firestore security rules
- Ensure user document exists in Firestore

### Bookings Not Showing
- Check Firestore indexes (may need to create)
- Verify user role and permissions
- Check browser console for errors

## 📞 Support

For issues and questions:
1. Check `DEVELOPMENT_PLAN.md` for detailed implementation guides
2. Review Firebase documentation
3. Check browser console for error messages

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

Built for University of Cape Coast (UCC) to streamline lecture hall management and improve student experience.

---

**Version**: 1.0.0  
**Last Updated**: February 2026
