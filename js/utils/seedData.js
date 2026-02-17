
import { db, auth } from '../firebase-config.js';
import { showToast } from '../components/Toast.js';

/**
 * Seed Admin Data: Lecture Halls and Rooms
 */
export async function seedLectureHallsAndRooms() {
    const halls = [
        {
            name: "New Lecture Theatre (NLT)",
            rooms: [
                { number: "NLT 1", capacity: 300, features: ["Projector", "Sound System", "AC"] },
                { number: "NLT 2", capacity: 300, features: ["Projector", "Sound System", "AC"] },
                { number: "NLT 3", capacity: 150, features: ["Projector", "AC"] }
            ]
        },
        {
            name: "Science Complex",
            rooms: [
                { number: "SC 101", capacity: 60, features: ["Whiteboard", "Lab Tables"] },
                { number: "SC 102", capacity: 60, features: ["Whiteboard", "Lab Tables"] },
                { number: "SC Auditorium", capacity: 200, features: ["Projector", "Tiered Seating"] }
            ]
        },
        {
            name: "Sandwich Lecture Theatre",
            rooms: [
                { number: "SLT Lower", capacity: 500, features: ["Projector", "Sound System", "Stage"] },
                { number: "SLT Upper", capacity: 200, features: ["Projector", "Sound System"] }
            ]
        },
        {
            name: "Calabash Hub",
            rooms: [
                { number: "CB 1", capacity: 40, features: ["Smart Screen"] },
                { number: "CB 2", capacity: 40, features: ["Smart Screen"] },
                { number: "CB 3", capacity: 30, features: ["Discussion Tables"] }
            ]
        }
    ];

    let createdCount = 0;

    try {
        const batch = db.batch();

        for (const h of halls) {
            // Check if hall exists by name roughly
            const hallRef = db.collection('lectureHalls').doc();
            batch.set(hallRef, {
                name: h.name,
                createdAt: new Date().toISOString()
            });

            for (const r of h.rooms) {
                const roomRef = db.collection('rooms').doc();
                batch.set(roomRef, {
                    hallId: hallRef.id,
                    number: r.number,
                    capacity: r.capacity,
                    features: r.features,
                    createdAt: new Date().toISOString()
                });
            }
            createdCount++;
        }

        await batch.commit();
        return { success: true, message: `Added ${createdCount} halls and their rooms.` };
    } catch (error) {
        console.error("Error seeding halls:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Seed Staff Data: Bookings
 */
export async function seedBookingsForStaff(staffUser) {
    // Fallback: if staffUser is missing/improper, try to get current auth user
    let userId = staffUser?.id || staffUser?.uid;
    let userName = staffUser?.name || staffUser?.displayName || 'Staff User';

    if (!userId) {
        console.warn('No staffUser passed to seedBookingsForStaff, checking auth.currentUser');
        const user = auth.currentUser;
        if (user) {
            userId = user.uid;
            userName = user.displayName || 'Auth User';
        }
    }

    if (!userId) {
        console.error('seedBookingsForStaff: No user ID found', { staffUser });
        return { success: false, error: "Not authenticated (No User ID)" };
    }

    // 1. Get some halls and rooms to book
    const roomsSnap = await db.collection('rooms').limit(5).get();
    if (roomsSnap.empty) {
        return { success: false, error: "No rooms found. Ask Admin to populate halls first." };
    }
    
    const rooms = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // 2. Generate bookings
    const courses = [
        { code: "CSC101", name: "Intro to Computer Science" },
        { code: "CSC202", name: "Data Structures" },
        { code: "MAT101", name: "Calculus I" },
        { code: "ENG102", name: "Communication Skills" },
        { code: "PHY103", name: "Physics for Engineers" }
    ];

    // Pick random days and times
    const days = [1, 2, 3, 4, 5]; // Mon-Fri
    const times = ["08:00", "10:00", "12:00", "14:00", "16:00"];

    const batch = db.batch();
    let count = 0;

    // Create 5 permanent bookings
    for (let i = 0; i < 5; i++) {
        const room = rooms[i % rooms.length];
        // Need hall Name for the booking record
        let hallName = "Unknown Hall";
        if (room.hallId) {
            const hSnap = await db.collection('lectureHalls').doc(room.hallId).get();
            if (hSnap.exists) hallName = hSnap.data().name;
        }

        const course = courses[i % courses.length];
        const day = days[i % days.length];
        const startTime = times[i % times.length];
        // End time 2 hours later
        const [h, m] = startTime.split(':').map(Number);
        const endH = h + 2;
        const endTime = `${String(endH).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        
        const bookingRef = db.collection('bookings').doc();
        batch.set(bookingRef, {
            type: 'permanent',
            title: `${course.code} - ${course.name}`,
            courseName: course.name,
            courseCode: course.code,
            description: "Seeded booking for testing",
            staffId: userId,
            userName: staffUser.name || 'Staff User',
            hallId: room.hallId,
            hallName: hallName,
            roomId: room.id,
            roomName: room.number,
            dayOfWeek: day,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            indexPrefix: "CS/DVB/22", // Default for testing
            temporaryFreeDates: [],
            createdAt: new Date().toISOString()
        });
        count++;
    }

    try {
        await batch.commit();
        return { success: true, message: `Created ${count} permanent bookings.` };
    } catch (error) {
        console.error("Error seeding bookings:", error);
        return { success: false, error: error.message };
    }
}
