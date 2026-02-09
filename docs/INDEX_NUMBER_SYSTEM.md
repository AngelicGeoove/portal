# Index Number System Reference

## Format: XX/XXX/XX/XXXX

### Components

1. **XX** - Department Code (2 letters)
   - Examples: CS, PS, MA, EN, BU, SC

2. **XXX** - Program Code (3 letters)
   - Examples: DVB, ITC, NET, SWE, MBA

3. **XX** - Year of Enrollment (2 digits)
   - Examples: 19, 20, 21, 22, 23, 24

4. **XXXX** - Student Number (4 digits)
   - Examples: 0001, 0002, 0273, 1234

### Complete Examples

- `CS/DVB/22/0001` - Computer Science, DVB program, 2022 cohort, student #1
- `PS/ITC/19/0273` - (Department PS), ITC program, 2019 cohort, student #273
- `EN/SWE/23/0045` - Engineering, Software Engineering, 2023 cohort, student #45

### How It Works in the System

#### For Students
- Enter full index: `CS/DVB/22/0001`
- System extracts prefix: `CS/DVB/22`
- Finds staff managing this prefix
- Auto-populates schedule from those staff bookings

#### For Staff (Class Reps & Lecturers)
- Enter their own full index: `CS/DVB/22/0001`
- Enter managed prefixes (one per line):
  ```
  CS/DVB/22
  CS/ITC/21
  PS/DVB/20
  ```
- Any student signing up with these prefixes gets assigned to them
- Their bookings appear in those students' schedules

#### For Bookings
- When creating a booking, staff selects which class (prefix) it's for
- Example: Booking for `CS/DVB/22` appears in all `CS/DVB/22/XXXX` students' schedules

### Validation Rules

- Must match exact format: `XX/XXX/XX/XXXX`
- Department and Program codes must be uppercase letters
- Year must be 2 digits (00-99)
- Student number must be 4 digits (0000-9999)
- No spaces allowed
- Forward slashes required

### Examples of Valid Index Numbers

✅ `CS/DVB/22/0001`
✅ `PS/ITC/19/0273`
✅ `MA/NET/20/0500`
✅ `EN/SWE/23/1234`

### Examples of Invalid Index Numbers

❌ `cs/dvb/22/0001` - Lowercase not allowed
❌ `CS/DVB/2022/0001` - Year must be 2 digits
❌ `CS/DVB/22/1` - Student number must be 4 digits
❌ `CS-DVB-22-0001` - Must use forward slashes
❌ `CS/DVB/22 /0001` - No spaces allowed

### Database Structure

```javascript
// Student document
{
  indexNumber: "CS/DVB/22/0001",
  indexPrefix: "CS/DVB/22",  // Auto-extracted
  assignedToStaff: ["staffUserId1", "staffUserId2"]
}

// Staff document
{
  indexNumber: "CS/DVB/22/0001",
  managedIndexPrefixes: ["CS/DVB/22", "CS/ITC/21"],
  isLecturer: true
}

// Booking document
{
  indexPrefix: "CS/DVB/22",  // Which class this booking is for
  courseName: "Data Structures",
  // ... other fields
}
```

### Common Scenarios

#### Scenario 1: New Student Signs Up
1. Student enters: `CS/DVB/22/0001`
2. System extracts: `CS/DVB/22`
3. Queries for staff with `managedIndexPrefixes` containing `CS/DVB/22`
4. Adds those staff IDs to student's `assignedToStaff` array
5. Student's schedule shows all bookings with `indexPrefix: "CS/DVB/22"`

#### Scenario 2: Class Rep Creates Booking
1. Class rep creates booking for Monday 10:00-12:00
2. Selects class: `CS/DVB/22` from their managed prefixes
3. Booking saved with `indexPrefix: "CS/DVB/22"`
4. All students with index starting with `CS/DVB/22/XXXX` see it in their schedule

#### Scenario 3: Lecturer Manages Multiple Classes
1. Lecturer manages: `CS/DVB/22`, `CS/DVB/21`, `PS/ITC/20`
2. When booking, dropdown shows all three
3. Can create different bookings for different classes
4. Each class's students only see their own bookings

### Tips for Users

**For Students:**
- Make sure your index number is correct
- Contact your class rep if schedule doesn't populate
- Your schedule updates automatically when class rep makes bookings

**For Class Reps:**
- Enter all prefixes you're responsible for during signup
- Be careful with the format: `XX/XXX/XX` (no student number part)
- You can manage multiple classes

**For Lecturers:**
- Check "I am a Lecturer" during signup
- Add all classes you teach
- You can assign yourself to bookings or leave as "Unspecified"

**For Admins:**
- Users cannot change their index number after signup
- Manually edit Firestore if correction needed
- First admin account may need manual role assignment in Firestore

### Advanced: Prefix Matching Algorithm

```javascript
// Extract prefix from full index
function extractPrefix(indexNumber) {
  const parts = indexNumber.split('/');
  return parts.slice(0, 3).join('/');
  // "CS/DVB/22/0001" → "CS/DVB/22"
}

// Find matching staff
function findStaff(studentPrefix) {
  return db.collection('users')
    .where('role', '==', 'staff')
    .where('managedIndexPrefixes', 'array-contains', studentPrefix)
    .get();
}

// Get bookings for student
function getStudentSchedule(studentPrefix) {
  return db.collection('bookings')
    .where('indexPrefix', '==', studentPrefix)
    .where('isActive', '==', true)
    .get();
}
```

---

**Remember:** The index number system is central to the automatic schedule population feature. All students with the same prefix (first 3 parts) will have the same schedule!
