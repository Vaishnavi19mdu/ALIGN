/**
 * ALIGN — Firestore Seed Script
 * Run once with: npx tsx scripts/seedFirestore.ts
 *
 * Uses the Firebase Admin SDK which bypasses security rules entirely.
 * Install deps first:  npm install -D firebase-admin tsx
 *
 * Set your service account key path below, OR set the env var:
 *   export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
 *
 * Get the key from: Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// ── Init ──────────────────────────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS as string),
    // OR inline the JSON directly:
    // credential: cert(require('./serviceAccountKey.json')),
  });
}

const db   = getFirestore();
const auth = getAuth();

// ── Shared org data ───────────────────────────────────────────────────────────
const ORG_CODE_1 = 'HLP-1001';
const ORG_CODE_2 = 'GRN-2002';
const ORG_NAME_1 = 'HelpForward NGO';
const ORG_NAME_2 = 'GreenRoots Foundation';

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = () => Timestamp.now();
const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));
const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

async function createAuthUser(email: string, password: string, displayName: string) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`  ↩  Auth user exists: ${email} (${existing.uid})`);
    return existing.uid;
  } catch {
    const user = await auth.createUser({ email, password, displayName });
    console.log(`  ✓  Created auth user: ${email} (${user.uid})`);
    return user.uid;
  }
}

async function upsertDoc(col: string, id: string, data: object) {
  await db.collection(col).doc(id).set(data, { merge: true });
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. ORG ADMINS (2)
// ══════════════════════════════════════════════════════════════════════════════
const orgAdmins = [
  {
    email: 'admin@helpforward.org', password: 'Align@1234',
    fullName: 'Meena Nair',
    orgName: ORG_NAME_1, orgCode: ORG_CODE_1,
    orgType: 'NGO', orgSize: '11–50', orgWebsite: 'https://helpforward.org',
    regNum: 'NGO/REG/2018/00101',
  },
  {
    email: 'admin@greenroots.org', password: 'Align@1234',
    fullName: 'Karthik Rajan',
    orgName: ORG_NAME_2, orgCode: ORG_CODE_2,
    orgType: 'Community', orgSize: '51–200', orgWebsite: 'https://greenroots.org',
    regNum: 'NGO/REG/2020/00204',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// 2. ORG STAFF (10 — 5 per org)
// ══════════════════════════════════════════════════════════════════════════════
const orgStaff = [
  // HelpForward
  { email: 'ravi.m@helpforward.org',  password: 'Align@1234', fullName: 'Ravi Menon',     orgCodeUsed: ORG_CODE_1, orgName: ORG_NAME_1, canCreateTask: true  },
  { email: 'priya.s@helpforward.org', password: 'Align@1234', fullName: 'Priya Sharma',   orgCodeUsed: ORG_CODE_1, orgName: ORG_NAME_1, canCreateTask: false },
  { email: 'deepak.n@helpforward.org',password: 'Align@1234', fullName: 'Deepak Nair',    orgCodeUsed: ORG_CODE_1, orgName: ORG_NAME_1, canCreateTask: true  },
  { email: 'anita.j@helpforward.org', password: 'Align@1234', fullName: 'Anita Joseph',   orgCodeUsed: ORG_CODE_1, orgName: ORG_NAME_1, canCreateTask: false },
  { email: 'suresh.k@helpforward.org',password: 'Align@1234', fullName: 'Suresh Kumar',   orgCodeUsed: ORG_CODE_1, orgName: ORG_NAME_1, canCreateTask: true  },
  // GreenRoots
  { email: 'divya.p@greenroots.org',  password: 'Align@1234', fullName: 'Divya Pillai',   orgCodeUsed: ORG_CODE_2, orgName: ORG_NAME_2, canCreateTask: true  },
  { email: 'arjun.r@greenroots.org',  password: 'Align@1234', fullName: 'Arjun Rao',      orgCodeUsed: ORG_CODE_2, orgName: ORG_NAME_2, canCreateTask: false },
  { email: 'nalini.v@greenroots.org', password: 'Align@1234', fullName: 'Nalini Verma',   orgCodeUsed: ORG_CODE_2, orgName: ORG_NAME_2, canCreateTask: true  },
  { email: 'mohan.t@greenroots.org',  password: 'Align@1234', fullName: 'Mohan Thomas',   orgCodeUsed: ORG_CODE_2, orgName: ORG_NAME_2, canCreateTask: false },
  { email: 'lakshmi.g@greenroots.org',password: 'Align@1234', fullName: 'Lakshmi Ghosh',  orgCodeUsed: ORG_CODE_2, orgName: ORG_NAME_2, canCreateTask: true  },
];

// ══════════════════════════════════════════════════════════════════════════════
// 3. VOLUNTEERS (15)
// ══════════════════════════════════════════════════════════════════════════════
const volunteers = [
  { email: 'vol1@example.com',  password: 'Align@1234', fullName: 'Arun Krishnan',    location: 'Chennai',    skills: ['First Aid', 'Logistics'],           reliabilityScore: 92, availableDays: ['Mon','Wed','Fri'] },
  { email: 'vol2@example.com',  password: 'Align@1234', fullName: 'Bhavna Iyer',      location: 'Mumbai',     skills: ['Teaching', 'Translation'],          reliabilityScore: 88, availableDays: ['Tue','Thu'] },
  { email: 'vol3@example.com',  password: 'Align@1234', fullName: 'Chirag Desai',     location: 'Ahmedabad',  skills: ['Coding', 'Events'],                 reliabilityScore: 75, availableDays: ['Sat','Sun'] },
  { email: 'vol4@example.com',  password: 'Align@1234', fullName: 'Deepika Rao',      location: 'Bengaluru',  skills: ['Photography', 'Content Writing'],   reliabilityScore: 81, availableDays: ['Mon','Tue','Wed'] },
  { email: 'vol5@example.com',  password: 'Align@1234', fullName: 'Elan Murugan',     location: 'Chennai',    skills: ['First Aid', 'Medical'],             reliabilityScore: 95, availableDays: ['Mon','Wed','Fri'] },
  { email: 'vol6@example.com',  password: 'Align@1234', fullName: 'Fatima Sheikh',    location: 'Hyderabad',  skills: ['Translation', 'Teaching'],          reliabilityScore: 70, availableDays: ['Thu','Fri'] },
  { email: 'vol7@example.com',  password: 'Align@1234', fullName: 'Ganesh Pillai',    location: 'Kochi',      skills: ['Logistics', 'Construction'],        reliabilityScore: 83, availableDays: ['Mon','Sat'] },
  { email: 'vol8@example.com',  password: 'Align@1234', fullName: 'Harini Suresh',    location: 'Coimbatore', skills: ['Teaching', 'Events'],               reliabilityScore: 77, availableDays: ['Tue','Thu','Sat'] },
  { email: 'vol9@example.com',  password: 'Align@1234', fullName: 'Imran Khan',       location: 'Delhi',      skills: ['Logistics', 'Coding'],              reliabilityScore: 68, availableDays: ['Mon','Fri'] },
  { email: 'vol10@example.com', password: 'Align@1234', fullName: 'Janani Balaji',    location: 'Chennai',    skills: ['First Aid', 'Teaching'],            reliabilityScore: 90, availableDays: ['Wed','Thu','Fri'] },
  { email: 'vol11@example.com', password: 'Align@1234', fullName: 'Kiran Mehta',      location: 'Pune',       skills: ['Photography', 'Events'],            reliabilityScore: 72, availableDays: ['Sat','Sun'] },
  { email: 'vol12@example.com', password: 'Align@1234', fullName: 'Lakshmi Nair',     location: 'Trivandrum', skills: ['Medical', 'First Aid'],             reliabilityScore: 86, availableDays: ['Mon','Wed'] },
  { email: 'vol13@example.com', password: 'Align@1234', fullName: 'Manohar Reddy',    location: 'Hyderabad',  skills: ['Construction', 'Logistics'],        reliabilityScore: 79, availableDays: ['Tue','Fri'] },
  { email: 'vol14@example.com', password: 'Align@1234', fullName: 'Nisha Thomas',     location: 'Kochi',      skills: ['Content Writing', 'Translation'],   reliabilityScore: 84, availableDays: ['Mon','Thu'] },
  { email: 'vol15@example.com', password: 'Align@1234', fullName: 'Omar Farouq',      location: 'Chennai',    skills: ['Coding', 'Events', 'Photography'],  reliabilityScore: 91, availableDays: ['Wed','Sat'] },
];

// ══════════════════════════════════════════════════════════════════════════════
// 4. TASKS (seeded for HelpForward org)
// ══════════════════════════════════════════════════════════════════════════════
const tasks = [
  { title: 'Community Teaching Session',  description: 'Run a 2-hour literacy session at the community hall.', priority: 'High',      category: 'Education', deadline: '2026-05-10', status: 'Completed',   assignedTo: 'Arun Krishnan',  hoursLogged: 6,  orgCode: ORG_CODE_1 },
  { title: 'Medical Camp Setup',          description: 'Coordinate logistics for the monthly free medical camp.', priority: 'High',   category: 'Medical',   deadline: '2026-05-12', status: 'Completed',   assignedTo: 'Elan Murugan',   hoursLogged: 8,  orgCode: ORG_CODE_1 },
  { title: 'Ration Kit Packing',          description: 'Pack 200 ration kits for the weekly relief distribution.', priority: 'Medium', category: 'Relief',  deadline: '2026-05-08', status: 'Completed',   assignedTo: 'Ganesh Pillai',  hoursLogged: 4,  orgCode: ORG_CODE_1 },
  { title: 'Awareness Walk — Hygiene',    description: 'Lead a hygiene awareness walk in 3 local streets.', priority: 'Medium',       category: 'Outreach', deadline: '2026-05-15', status: 'In Progress', assignedTo: 'Bhavna Iyer',    hoursLogged: 0,  orgCode: ORG_CODE_1 },
  { title: 'Flood Relief Volunteer Drive',description: 'Emergency volunteer coordination for flood-affected zone.', priority: 'Emergency', category: 'Relief', deadline: '2026-05-05', status: 'Open',       assignedTo: 'Unassigned',     hoursLogged: 0,  orgCode: ORG_CODE_1 },
  { title: 'School Supply Distribution',  description: 'Distribute stationery kits to 3 government schools.', priority: 'Low',        category: 'Education', deadline: '2026-05-20', status: 'Open',       assignedTo: 'Unassigned',     hoursLogged: 0,  orgCode: ORG_CODE_1 },
  { title: 'Elder Care Visit',            description: 'Weekly check-in visits to 10 senior citizens in the ward.', priority: 'Medium', category: 'Care',   deadline: '2026-05-09', status: 'In Progress', assignedTo: 'Janani Balaji',  hoursLogged: 3,  orgCode: ORG_CODE_1 },
  // GreenRoots tasks
  { title: 'Tree Plantation Drive',       description: 'Plant 500 saplings along the eastern highway corridor.', priority: 'Medium',  category: 'Environment', deadline: '2026-05-18', status: 'Open',      assignedTo: 'Unassigned',     hoursLogged: 0,  orgCode: ORG_CODE_2 },
  { title: 'River Cleanup Campaign',      description: 'Collect and categorise waste along the riverbank.', priority: 'High',         category: 'Environment', deadline: '2026-05-11', status: 'In Progress', assignedTo: 'Manohar Reddy', hoursLogged: 5,  orgCode: ORG_CODE_2 },
  { title: 'Composting Workshop',         description: 'Host a composting and waste-management workshop.', priority: 'Low',           category: 'Education',   deadline: '2026-05-25', status: 'Open',      assignedTo: 'Unassigned',     hoursLogged: 0,  orgCode: ORG_CODE_2 },
];

// ══════════════════════════════════════════════════════════════════════════════
// 5. VERIFICATIONS — one per Completed task
// ══════════════════════════════════════════════════════════════════════════════
const verifications = [
  { taskTitle: 'Community Teaching Session', volunteerName: 'Arun Krishnan',  hoursLogged: 6, status: 'pending', orgCode: ORG_CODE_1 },
  { taskTitle: 'Medical Camp Setup',         volunteerName: 'Elan Murugan',   hoursLogged: 8, status: 'pending', orgCode: ORG_CODE_1 },
  { taskTitle: 'Ration Kit Packing',         volunteerName: 'Ganesh Pillai',  hoursLogged: 4, status: 'pending', orgCode: ORG_CODE_1 },
];

// ══════════════════════════════════════════════════════════════════════════════
// 6. COLLAB POSTS
// ══════════════════════════════════════════════════════════════════════════════
const collabPosts = [
  { user: 'Meena Nair',   message: 'Need 2 more volunteers for the flood relief drive. Anyone available this weekend?', orgCode: ORG_CODE_1 },
  { user: 'Ravi Menon',   message: 'Medical camp setup delayed by 1 day due to venue issue. Updated task deadline accordingly.', orgCode: ORG_CODE_1 },
  { user: 'Priya Sharma', message: 'Great job everyone — elder care visits completed ahead of schedule this week!', orgCode: ORG_CODE_1 },
  { user: 'Karthik Rajan',message: 'River cleanup campaign volunteers: please wear proper footwear tomorrow.', orgCode: ORG_CODE_2 },
  { user: 'Divya Pillai', message: 'Composting workshop venue confirmed — community centre, block B.', orgCode: ORG_CODE_2 },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function seed() {
  console.log('\n🌱  ALIGN Firestore Seed\n' + '─'.repeat(40));

  // ── Org Admins ──
  console.log('\n[1/6] Org Admins');
  for (const a of orgAdmins) {
    const uid = await createAuthUser(a.email, a.password, a.fullName);
    await upsertDoc('users', uid, {
      uid, role: 'org_admin', status: 'approved',
      fullName: a.fullName, email: a.email,
      orgName: a.orgName, orgCode: a.orgCode,
      orgType: a.orgType, orgSize: a.orgSize,
      orgWebsite: a.orgWebsite, regNum: a.regNum,
      isAdmin: true, createdAt: now(),
    });
    // Org doc
    await upsertDoc('organisations', a.orgCode, {
      orgCode: a.orgCode, orgName: a.orgName,
      orgType: a.orgType, orgSize: a.orgSize,
      adminUid: uid, adminEmail: a.email,
      createdAt: now(),
    });
  }

  // ── Org Staff ──
  console.log('\n[2/6] Org Staff');
  for (const s of orgStaff) {
    const uid = await createAuthUser(s.email, s.password, s.fullName);
    await upsertDoc('users', uid, {
      uid, role: 'org_staff', status: 'approved',
      fullName: s.fullName, email: s.email,
      orgCodeUsed: s.orgCodeUsed, orgName: s.orgName,
      canCreateTask: s.canCreateTask,
      createdAt: now(),
    });
  }

  // ── Volunteers ──
  console.log('\n[3/6] Volunteers');
  for (const v of volunteers) {
    const uid = await createAuthUser(v.email, v.password, v.fullName);
    await upsertDoc('users', uid, {
      uid, role: 'volunteer', status: 'active',
      fullName: v.fullName, email: v.email,
      location: v.location, skills: v.skills,
      reliabilityScore: v.reliabilityScore,
      availableDays: v.availableDays,
      acceptanceRate: Math.floor(Math.random() * 20 + 80), // 80–100%
      tasksCompleted: Math.floor(Math.random() * 15),
      createdAt: daysAgo(Math.floor(Math.random() * 60)),
    });
  }

  // ── Tasks ──
  console.log('\n[4/6] Tasks');
  for (const t of tasks) {
    const ref = db.collection('tasks').doc();
    await ref.set({
      ...t,
      createdBy: t.orgCode === ORG_CODE_1 ? 'Meena Nair' : 'Karthik Rajan',
      createdAt: daysAgo(Math.floor(Math.random() * 14)),
    });
    console.log(`  ✓  ${t.title} [${t.status}]`);
  }

  // ── Verifications ──
  console.log('\n[5/6] Verifications');
  for (const v of verifications) {
    const ref = db.collection('verifications').doc();
    await ref.set({
      ...v,
      rating: 0, feedback: '',
      submittedAt: daysAgo(1),
      createdAt: now(),
    });
    console.log(`  ✓  ${v.taskTitle} — ${v.volunteerName}`);
  }

  // ── Collab Posts ──
  console.log('\n[6/6] Collaboration posts');
  const postTimes = [1, 3, 5, 2, 4]; // daysAgo
  for (let i = 0; i < collabPosts.length; i++) {
    const ref = db.collection('collabPosts').doc();
    await ref.set({ ...collabPosts[i], createdAt: daysAgo(postTimes[i]) });
    console.log(`  ✓  ${collabPosts[i].user}: "${collabPosts[i].message.slice(0, 50)}…"`);
  }

  console.log('\n✅  Seed complete!\n');
  console.log('Credentials summary:');
  console.log('  Org Admin 1 : admin@helpforward.org  / Align@1234  (code: HLP-1001)');
  console.log('  Org Admin 2 : admin@greenroots.org   / Align@1234  (code: GRN-2002)');
  console.log('  Org Staff   : ravi.m@helpforward.org / Align@1234  (and 9 others)');
  console.log('  Volunteers  : vol1@example.com … vol15@example.com / Align@1234\n');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });