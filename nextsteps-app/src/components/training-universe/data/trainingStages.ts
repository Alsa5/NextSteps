/** Training journey planets — each maps to a Maverick program phase. */

export interface TrainingStage {
  id: number
  name: string
  skill: string
  description: string
  texture: string
  cloudTexture?: string
  color: string
  ringColor: string
  emissive: string
  position: [number, number, number]
  size: number
  time: string
  estimatedHours: number
  difficulty: number
  ringTilt: number
  rotationSpeed: number
  phaseId: number
}

export const TRAINING_STAGES: TrainingStage[] = [
  {
    id: 0,
    name: 'Spark: Soft Skills',
    skill: 'Communication & Teamwork',
    texture: '/textures/8k_venus_surface.jpg',
    cloudTexture: '/textures/4k_venus_atmosphere.jpg',
    color: '#e8a060',
    ringColor: '#c47830',
    emissive: '#e8a060',
    position: [-9, 1, -1],
    size: 0.72,
    description: 'Communication, presentation, teamwork, and critical thinking foundations.',
    time: '3 weeks',
    estimatedHours: 3,
    difficulty: 1,
    ringTilt: Math.PI / 4,
    rotationSpeed: 0.003,
    phaseId: 1,
  },
  {
    id: 1,
    name: 'Foundation Tech',
    skill: 'Core Engineering',
    texture: '/textures/8k_moon.jpg',
    color: '#4a9eff',
    ringColor: '#2266cc',
    emissive: '#4a9eff',
    position: [-5, -2, 3],
    size: 0.88,
    description: 'Java, SQL, HTML/CSS, JavaScript, REST APIs, Git, and OOP principles.',
    time: '6–11 weeks',
    estimatedHours: 8,
    difficulty: 2,
    ringTilt: Math.PI / 2.5,
    rotationSpeed: 0.004,
    phaseId: 2,
  },
  {
    id: 2,
    name: 'Stream Training',
    skill: 'Specialization Track',
    texture: '/textures/8k_mars.jpg',
    color: '#cc5533',
    ringColor: '#aa3311',
    emissive: '#cc5533',
    position: [-1, 3, -4],
    size: 0.78,
    description: 'Angular, React, Spring Boot, or cloud stack based on your GET/PGET stream.',
    time: '6 weeks',
    estimatedHours: 6,
    difficulty: 3,
    ringTilt: Math.PI / 6,
    rotationSpeed: 0.005,
    phaseId: 3,
  },
  {
    id: 3,
    name: 'Project Internship',
    skill: 'Delivery Practice',
    texture: '/textures/8k_jupiter.jpg',
    color: '#c88b5a',
    ringColor: '#a06030',
    emissive: '#c88b5a',
    position: [4, -1, 2],
    size: 1.0,
    description: 'Real squad project with mentors — ship features end to end.',
    time: '4–8 weeks',
    estimatedHours: 5,
    difficulty: 3,
    ringTilt: Math.PI / 3.5,
    rotationSpeed: 0.0035,
    phaseId: 4,
  },
  {
    id: 4,
    name: 'Deployment & Onboarding',
    skill: 'Day Zero Ready',
    texture: '/textures/8k_saturn.jpg',
    color: '#e8d5a0',
    ringColor: '#c4b060',
    emissive: '#e8d5a0',
    position: [8, 2, -3],
    size: 0.85,
    description:
      'Welcome kit, offer acceptance, and platform orientation — then Hex ID assignment, manager pairing, and production readiness for day one.',
    time: 'Pre-joining → Day 0',
    estimatedHours: 2,
    difficulty: 4,
    ringTilt: Math.PI / 2.2,
    rotationSpeed: 0.0045,
    phaseId: 5,
  },
]

/** Final planet — locked until Project Internship is complete. */
export const FINAL_STAGE_INDEX = TRAINING_STAGES.length - 1
