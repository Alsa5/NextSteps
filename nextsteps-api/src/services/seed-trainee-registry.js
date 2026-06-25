const FIRST_NAMES = [
    'Arjun', 'Priya', 'Rahul', 'Anjali', 'Vikram', 'Sneha', 'Karthik', 'Divya', 'Rohit', 'Meera',
    'Aditya', 'Pooja', 'Suresh', 'Kavya', 'Nitin', 'Shruti', 'Manish', 'Lakshmi', 'Deepak', 'Ananya',
];
const LAST_NAMES = [
    'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Mehta', 'Joshi', 'Rao', 'Pillai',
];
const TRACKS = ['GET', 'STEP', 'LEAP', 'PGET'];
const COLLEGES = [
    'IIT Bombay', 'NIT Trichy', 'VIT Vellore', 'BITS Pilani', 'IIIT Hyderabad', 'SRM Chennai', 'Amrita Coimbatore',
];
const BATCH_IDS = ['B-2025-13', 'B-2025-14', 'B-2025-15', 'B-2026-01'];
const buildQueueRecruits = () => Array.from({ length: 18 }, (_, i) => {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i + 3) % LAST_NAMES.length];
    return {
        externalId: `rec-${String(i + 1).padStart(3, '0')}`,
        fullName: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}.rec${i}@gmail.com`,
        batch: null,
        status: 'recruited',
    };
});
const buildRosterTrainees = () => Array.from({ length: 32 }, (_, i) => {
    const fn = FIRST_NAMES[(i + 5) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i + 7) % LAST_NAMES.length];
    const isPost = i >= 16;
    return {
        externalId: `mav-${String(i + 1).padStart(3, '0')}`,
        fullName: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`,
        batch: BATCH_IDS[i % BATCH_IDS.length],
        status: isPost ? 'post-onboarding' : 'pre-onboarding',
    };
});
/** Mirrors frontend ldTraineeStore defaults — queue blocked, roster allowed. */
export const buildTraineeSeedEntries = () => [...buildQueueRecruits(), ...buildRosterTrainees()].map((t) => ({
    email: t.email,
    fullName: t.fullName,
    batch: t.batch,
    status: t.status,
    externalId: t.externalId,
}));
export const seedTraineeRegistry = async (registry) => {
    await registry.upsertMany(buildTraineeSeedEntries());
};
