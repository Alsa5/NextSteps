import mockData from './mockData.json'

const TRAINEES_KEY = 'nextsteps_ld_trainees_v1'
const BATCHES_KEY = 'nextsteps_ld_batches_v1'

const FIRST_NAMES = [
  'Arjun', 'Priya', 'Rahul', 'Anjali', 'Vikram', 'Sneha', 'Karthik', 'Divya', 'Rohit', 'Meera',
  'Aditya', 'Pooja', 'Suresh', 'Kavya', 'Nitin', 'Shruti', 'Manish', 'Lakshmi', 'Deepak', 'Ananya',
  'Vivek', 'Swathi', 'Sanjay', 'Nisha', 'Ravi', 'Tejal', 'Manoj', 'Rani', 'Shankar', 'Gayatri',
  'Harish', 'Bhavna', 'Gopal', 'Keerthi', 'Farhan', 'Ishita', 'Mohit', 'Aishwarya', 'Varun', 'Neha',
]

const LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Mehta', 'Joshi', 'Rao', 'Pillai',
  'Gupta', 'Iyer', 'Menon', 'Verma', 'Shah', 'Mishra', 'Kaur', 'Choudhary', 'Bhatt', 'Naik',
]

const TRACKS = ['GET', 'STEP', 'LEAP', 'PGET']
const COLLEGES = [
  'IIT Bombay', 'NIT Trichy', 'VIT Vellore', 'BITS Pilani', 'IIIT Hyderabad', 'SRM Chennai', 'Amrita Coimbatore',
]

const BATCH_IDS = ['B-2025-13', 'B-2025-14', 'B-2025-15', 'B-2026-01']

const buildRecruitedUnassigned = () => {
  const base = Array.from({ length: 18 }, (_, i) => {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i + 3) % LAST_NAMES.length]
    return {
      id: `rec-${String(i + 1).padStart(3, '0')}`,
      name: `${fn} ${ln}`,
      personalEmail: `${fn.toLowerCase()}.${ln.toLowerCase()}.rec${i}@gmail.com`,
      hexEmail: null,
      employeeId: null,
      status: 'recruited',
      recruitmentStatus: 'recruited',
      batch: null,
      track: TRACKS[i % TRACKS.length],
      stream: null,
      college: COLLEGES[i % COLLEGES.length],
      recruitedDate: `2026-0${(i % 6) + 1}-15`,
      joiningDate: null,
      phase: 0,
      readinessScore: 0,
      assessmentScore: 55 + (i % 40),
      onboardingMailSent: false,
    }
  })
  const madhav = {
    id: 'rec-madhav',
    name: 'Madhav V S',
    personalEmail: 'madhavvs276@gmail.com',
    hexEmail: null,
    employeeId: null,
    status: 'recruited',
    recruitmentStatus: 'recruited',
    batch: null,
    track: 'GET',
    stream: null,
    college: 'VIT Vellore',
    recruitedDate: '2026-02-01',
    joiningDate: null,
    phase: 0,
    readinessScore: 0,
    assessmentScore: 78,
    onboardingMailSent: false,
  }
  if (!base.some((t) => t.personalEmail.toLowerCase() === madhav.personalEmail)) {
    base.unshift(madhav)
  }
  return base
}

const buildAssignedTrainees = () =>
  Array.from({ length: 32 }, (_, i) => {
    const fn = FIRST_NAMES[(i + 5) % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i + 7) % LAST_NAMES.length]
    const isPost = i >= 16
    return {
      id: `mav-${String(i + 1).padStart(3, '0')}`,
      name: `${fn} ${ln}`,
      personalEmail: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`,
      hexEmail: isPost ? `${fn.toLowerCase()}.${ln.toLowerCase()}@hexaware.com` : null,
      employeeId: isPost ? `HW${100200 + i}` : null,
      status: isPost ? 'post-onboarding' : 'pre-onboarding',
      recruitmentStatus: 'assigned',
      batch: BATCH_IDS[i % BATCH_IDS.length],
      track: TRACKS[i % TRACKS.length],
      stream: isPost ? 'Product Engineering' : null,
      college: COLLEGES[i % COLLEGES.length],
      recruitedDate: `2025-11-${String((i % 20) + 1).padStart(2, '0')}`,
      joiningDate: isPost ? `2025-${String((i % 12) + 1).padStart(2, '0')}-15` : `2026-${String((i % 6) + 1).padStart(2, '0')}-01`,
      phase: isPost ? Math.min(Math.floor(i / 6) + 1, 3) : 0,
      readinessScore: isPost ? Math.round(40 + (i % 4) * 15) : 0,
      assessmentScore: 60 + (i % 35),
      onboardingMailSent: false,
    }
  })

export const getDefaultTrainees = () => [...buildRecruitedUnassigned(), ...buildAssignedTrainees()]

export const getDefaultBatches = () =>
  mockData.batches.map((batch) => ({
    ...batch,
    capacity: 12,
    status: batch.phase === 0 ? 'forming' : 'active',
  }))

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback()
  } catch {
    return fallback()
  }
}

const toQueueTrainee = (trainee) => ({
  ...trainee,
  batch: null,
  status: 'recruited',
  recruitmentStatus: 'recruited',
  hexEmail: null,
  employeeId: null,
  joiningDate: null,
  phase: 0,
  readinessScore: 0,
  onboardingMailSent: false,
  onboardingDetails: undefined,
  stream: null,
})

/** Move a roster trainee back to the recruitment queue (unassigned). */
export const returnTraineeToQueue = (emailOrId, sourceTrainees) => {
  const trainees = sourceTrainees ?? loadTrainees()
  const needle = typeof emailOrId === 'string' ? emailOrId.trim().toLowerCase() : emailOrId
  const match = (t) =>
    t.id === emailOrId || t.personalEmail.toLowerCase() === needle

  if (!trainees.some(match)) {
    throw new Error('Trainee not found')
  }

  const updatedTrainees = trainees.map((t) => (match(t) ? toQueueTrainee(t) : t))
  const batches = syncBatchCounts(loadBatches(), updatedTrainees)
  saveTrainees(updatedTrainees)
  saveBatches(batches)
  return {
    trainee: updatedTrainees.find(match),
    trainees: updatedTrainees,
    batches,
  }
}

const SEED_VERSION_KEY = 'nextsteps_ld_seed_v3'

const ensureSeedData = (trainees) => {
  const defaults = getDefaultTrainees()
  const unassigned = defaults.filter((t) => !t.batch)
  const currentUnassigned = trainees.filter((t) => !t.batch)

  if (localStorage.getItem(SEED_VERSION_KEY) === '3' && currentUnassigned.length >= 10) {
    return trainees
  }

  if (currentUnassigned.length < 10 || trainees.length < 40) {
    const batches = syncBatchCounts(getDefaultBatches(), defaults)
    saveTrainees(defaults)
    saveBatches(batches)
    localStorage.setItem(SEED_VERSION_KEY, '3')
    return defaults
  }

  localStorage.setItem(SEED_VERSION_KEY, '3')
  return trainees
}

export const loadTrainees = () => {
  let trainees = readStorage(TRAINEES_KEY, getDefaultTrainees)
  trainees = ensureSeedData(trainees)

  const madhavEmail = 'madhavvs276@gmail.com'
  const madhavMigrationKey = 'nextsteps_madhav_to_queue_v1'
  if (!localStorage.getItem(madhavMigrationKey)) {
    const hasMadhav = trainees.some((t) => t.personalEmail.toLowerCase() === madhavEmail)
    if (hasMadhav) {
      trainees = trainees.map((t) =>
        t.personalEmail.toLowerCase() === madhavEmail ? toQueueTrainee(t) : t,
      )
      saveTrainees(trainees)
      saveBatches(syncBatchCounts(loadBatches(), trainees))
    }
    localStorage.setItem(madhavMigrationKey, '1')
  }

  if (!localStorage.getItem(TRAINEES_KEY)) {
    saveTrainees(trainees)
  }
  return trainees
}

export const saveTrainees = (trainees) => {
  localStorage.setItem(TRAINEES_KEY, JSON.stringify(trainees))
}

export const isEligibleForBatchAssignment = (trainee) =>
  Boolean(trainee) && (!trainee.batch || trainee.recruitmentStatus === 'recruited')

export const getBatchSeatCount = (batchId, trainees) =>
  trainees.filter((t) => t.batch === batchId).length

export const syncBatchCounts = (batches, trainees) =>
  batches.map((b) => ({
    ...b,
    maverickCount: getBatchSeatCount(b.id, trainees),
  }))

export const loadBatches = () => {
  const batches = readStorage(BATCHES_KEY, getDefaultBatches)
  const trainees = readStorage(TRAINEES_KEY, getDefaultTrainees)
  const synced = syncBatchCounts(batches, trainees)
  if (!localStorage.getItem(BATCHES_KEY)) {
    saveBatches(synced)
  }
  return synced
}

export const saveBatches = (batches) => {
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches))
}

export const getUnassignedTrainees = (trainees = loadTrainees()) =>
  trainees.filter(isEligibleForBatchAssignment)

export const getAvailableBatchSeats = (batchId, batches = loadBatches(), trainees = loadTrainees()) => {
  const batch = batches.find((b) => b.id === batchId)
  if (!batch) return 0
  const capacity = batch.capacity ?? 12
  return Math.max(0, capacity - getBatchSeatCount(batchId, trainees))
}

export const nextBatchId = (batches) => {
  const year = new Date().getFullYear()
  const nums = batches
    .map((b) => b.id)
    .filter((id) => id.startsWith(`B-${year}-`))
    .map((id) => Number(id.split('-')[2]))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `B-${year}-${String(next).padStart(2, '0')}`
}

export const createBatch = ({ name, track, trainer, startDate, capacity = 12 }) => {
  const batches = loadBatches()
  const id = nextBatchId(batches)
  const batch = {
    id,
    name: name.trim() || `Batch ${id.split('-')[2]} - ${new Date().getFullYear()}`,
    phase: 0,
    maverickCount: 0,
    health: 'green',
    feedbackCompletion: 0,
    avgReadiness: 0,
    trainer: trainer.trim() || 'TBD',
    startDate: startDate || new Date().toISOString().slice(0, 10),
    track: track || 'GET',
    capacity,
    status: 'forming',
  }
  const next = [...batches, batch]
  saveBatches(next)
  return batch
}

export const addTrainee = ({
  name,
  personalEmail,
  college = '',
  track = 'GET',
  assessmentScore = 70,
  batchId = null,
}) => {
  const trimmedName = name?.trim()
  const email = personalEmail?.trim().toLowerCase()
  if (!trimmedName || !email) {
    throw new Error('Name and personal email are required')
  }

  const trainees = loadTrainees()
  if (trainees.some((t) => t.personalEmail.toLowerCase() === email)) {
    throw new Error('A trainee with this email already exists')
  }

  let batches = loadBatches()
  let batch = null
  if (batchId) {
    batch = batches.find((b) => b.id === batchId)
    if (!batch) {
      throw new Error('Batch not found')
    }
    const currentCount = trainees.filter((t) => t.batch === batchId).length
    const capacity = batch.capacity ?? 12
    if (currentCount >= capacity) {
      throw new Error(`${batchId} is full (${capacity} seats)`)
    }
  }

  const trainee = {
    id: `manual-${Date.now().toString(36)}`,
    name: trimmedName,
    personalEmail: email,
    hexEmail: null,
    employeeId: null,
    status: batchId ? 'pre-onboarding' : 'recruited',
    recruitmentStatus: batchId ? 'assigned' : 'recruited',
    batch: batchId || null,
    track: track || 'GET',
    stream: null,
    college: college.trim() || '—',
    recruitedDate: new Date().toISOString().slice(0, 10),
    joiningDate: batchId ? batch?.startDate ?? null : null,
    phase: 0,
    readinessScore: 0,
    assessmentScore: Math.min(100, Math.max(0, Number(assessmentScore) || 0)),
    onboardingMailSent: false,
  }

  const updatedTrainees = [...trainees, trainee]

  if (batchId) {
    const assignedCount = updatedTrainees.filter((t) => t.batch === batchId).length
    batches = batches.map((b) =>
      b.id === batchId ? { ...b, maverickCount: assignedCount } : b,
    )
    saveBatches(batches)
  }

  saveTrainees(updatedTrainees)
  const syncedBatches = syncBatchCounts(batches, updatedTrainees)
  saveBatches(syncedBatches)
  return { trainee, trainees: updatedTrainees, batches: syncedBatches }
}

export const assignTraineesToBatch = (traineeIds, batchId, sourceTrainees, sourceBatches) => {
  const trainees = sourceTrainees ?? loadTrainees()
  let batches = sourceBatches ?? loadBatches()
  const batch = batches.find((b) => b.id === batchId)
  if (!batch) {
    throw new Error('Batch not found')
  }

  const idSet = new Set(traineeIds)
  const toAssign = trainees.filter((t) => idSet.has(t.id) && isEligibleForBatchAssignment(t))
  if (toAssign.length === 0) {
    throw new Error('No eligible recruits selected — pick students from the queue')
  }

  const availableSeats = getAvailableBatchSeats(batchId, batches, trainees)
  if (toAssign.length > availableSeats) {
    throw new Error(
      `Cannot assign ${toAssign.length} — only ${availableSeats} seat${availableSeats !== 1 ? 's' : ''} left in ${batchId}`,
    )
  }

  const updatedTrainees = trainees.map((t) => {
    if (!idSet.has(t.id) || !isEligibleForBatchAssignment(t)) return t
    return {
      ...t,
      batch: batchId,
      recruitmentStatus: 'assigned',
      status: t.status === 'recruited' || t.status === 'pre-onboarding' ? 'pre-onboarding' : t.status,
      joiningDate: t.joiningDate || batch.startDate,
    }
  })

  batches = syncBatchCounts(batches, updatedTrainees)

  saveTrainees(updatedTrainees)
  saveBatches(batches)

  return { trainees: updatedTrainees, batches, assigned: toAssign.length }
}

/** Launch a forming batch — makes it visible on Ops Dashboard and active for training. */
export const activateBatch = (batchId) => {
  const batches = loadBatches()
  const idx = batches.findIndex((b) => b.id === batchId)
  if (idx === -1) throw new Error('Batch not found')
  const batch = batches[idx]
  if (batch.status === 'active') throw new Error('Batch is already active')
  batches[idx] = {
    ...batch,
    status: 'active',
    phase: Math.max(batch.phase ?? 0, 1),
    activatedAt: new Date().toISOString(),
  }
  saveBatches(batches)
  return batches[idx]
}

export const advanceBatchPhase = (batchId) => {
  const batches = loadBatches()
  const idx = batches.findIndex((b) => b.id === batchId)
  if (idx === -1) throw new Error('Batch not found')
  const batch = batches[idx]
  if (batch.phase >= 6) throw new Error('Batch is already at final phase')
  batches[idx] = {
    ...batch,
    phase: batch.phase + 1,
    lastPhaseAdvanceAt: new Date().toISOString(),
  }
  saveBatches(batches)
  return batches[idx]
}

export const convertTrainee = (traineeId) => {
  const trainees = loadTrainees()
  const idx = trainees.findIndex((t) => t.id === traineeId)
  if (idx === -1) throw new Error('Trainee not found')
  const t = trainees[idx]
  const [first, ...rest] = t.name.split(' ')
  const last = rest.join(' ') || 'Maverick'
  trainees[idx] = {
    ...t,
    status: 'post-onboarding',
    hexEmail: t.hexEmail || `${first.toLowerCase()}.${last.toLowerCase().replace(/\s+/g, '')}@hexaware.com`,
    employeeId: t.employeeId || `HW${200000 + idx}`,
    lifecycleStatus: 'converted',
    lifecycleNote: `Converted on ${new Date().toLocaleDateString()}`,
    lifecycleAt: new Date().toISOString(),
  }
  saveTrainees(trainees)
  return trainees[idx]
}

export const letDownTrainee = (traineeId) => {
  const trainees = loadTrainees()
  const idx = trainees.findIndex((t) => t.id === traineeId)
  if (idx === -1) throw new Error('Trainee not found')
  trainees[idx] = {
    ...trainees[idx],
    status: 'let-down',
    lifecycleStatus: 'let_down',
    lifecycleNote: `Let-down on ${new Date().toLocaleDateString()}`,
    lifecycleAt: new Date().toISOString(),
    batch: null,
    recruitmentStatus: 'recruited',
  }
  const batches = syncBatchCounts(loadBatches(), trainees)
  saveTrainees(trainees)
  saveBatches(batches)
  return trainees[idx]
}

export const getLifecycleTraineesForBatch = (batchId) =>
  loadTrainees().filter((t) => t.batch === batchId)

export const resetLdTraineeStore = () => {
  localStorage.removeItem(TRAINEES_KEY)
  localStorage.removeItem(BATCHES_KEY)
}
