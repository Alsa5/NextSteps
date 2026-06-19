export interface Course {
  id: number
  name: string
  skill: string
  description: string
  texture: string
  cloudTexture?: string
  ringTexture?: string
  color: string
  ringColor: string
  /** @deprecated use color — kept for particle/trail compatibility */
  emissive: string
  position: [number, number, number]
  size: number
  time: string
  estimatedHours: number
  difficulty: number
  ringTilt: number
  rotationSpeed: number
}

export const COURSES: Course[] = [
  {
    id: 0,
    name: 'Python Basics',
    skill: 'Backend Foundation',
    texture: '/textures/2k_mercury.jpg',
    color: '#b5a99a',
    ringColor: '#8a7a6a',
    emissive: '#b5a99a',
    position: [-8, 2, -2], // far left
    size: 0.55, // small starter planet
    description: 'Variables, functions, OOP, and core Python patterns.',
    time: '~2 hrs',
    estimatedHours: 2,
    difficulty: 1,
    ringTilt: Math.PI / 3,
    rotationSpeed: 0.002,
  },
  {
    id: 1,
    name: 'FastAPI',
    skill: 'REST APIs',
    texture: '/textures/8k_venus_surface.jpg',
    color: '#e8a060',
    ringColor: '#c47830',
    emissive: '#e8a060',
    position: [-4, -2, 3],
    size: 0.75,
    description: 'Build high-performance async APIs with routing and validation.',
    time: '~2.5 hrs',
    estimatedHours: 2.5,
    difficulty: 2,
    ringTilt: Math.PI / 4,
    rotationSpeed: 0.003,
  },
  {
    id: 2,
    name: 'Django',
    skill: 'Full Stack Web',
    texture: '/textures/8k_moon.jpg',
    color: '#4a9eff',
    ringColor: '#2266cc',
    emissive: '#4a9eff',
    position: [0, 3, -4], // top center
    size: 0.90,
    description: 'Full stack web development with Django ORM and templates.',
    time: '~4 hrs',
    estimatedHours: 4,
    difficulty: 2,
    ringTilt: Math.PI / 2.5,
    rotationSpeed: 0.004,
  },
  {
    id: 3,
    name: 'React & Next.js',
    skill: 'Frontend Dev',
    texture: '/textures/8k_mars.jpg',
    color: '#cc5533',
    ringColor: '#aa3311',
    emissive: '#cc5533',
    position: [4, -1, 2],
    size: 0.70,
    description: 'Components, hooks, SSR, and App Router with React and Next.js.',
    time: '~3.5 hrs',
    estimatedHours: 3.5,
    difficulty: 3,
    ringTilt: Math.PI / 6,
    rotationSpeed: 0.005,
  },
  {
    id: 4,
    name: 'TypeScript',
    skill: 'Type Safety',
    texture: '/textures/8k_jupiter.jpg',
    color: '#c88b5a',
    ringColor: '#a06030',
    emissive: '#c88b5a',
    position: [8, 2, -3], // far right
    size: 1.10, // largest - hardest course
    description: 'Static typing, generics, and advanced TypeScript patterns.',
    time: '~3 hrs',
    estimatedHours: 3,
    difficulty: 3,
    ringTilt: Math.PI / 3.5,
    rotationSpeed: 0.0035,
  },
  {
    id: 5,
    name: 'PostgreSQL',
    skill: 'Database Layer',
    texture: '/textures/8k_saturn.jpg',
    color: '#e8d5a0',
    ringColor: '#c4b060',
    emissive: '#e8d5a0',
    position: [-6, -3, -4], // bottom left
    size: 0.80,
    description: 'Schema design, queries, indexes, and transactions.',
    time: '~3 hrs',
    estimatedHours: 3,
    difficulty: 3,
    ringTilt: Math.PI / 2.2,
    rotationSpeed: 0.0045,
  },
  {
    id: 6,
    name: 'Docker & DevOps',
    skill: 'Infrastructure',
    texture: '/textures/2k_uranus.jpg',
    color: '#88ccdd',
    ringColor: '#4499aa',
    emissive: '#88ccdd',
    position: [2, -4, -2],
    size: 0.72,
    description: 'Containers, CI/CD pipelines, and cloud deployment.',
    time: '~4 hrs',
    estimatedHours: 4,
    difficulty: 4,
    ringTilt: Math.PI / 4.5,
    rotationSpeed: 0.0055,
  },
  {
    id: 7,
    name: 'System Design',
    skill: 'Architecture',
    texture: '/textures/2k_neptune.jpg',
    color: '#3355cc',
    ringColor: '#1133aa',
    emissive: '#3355cc',
    position: [6, -3, 4],
    size: 0.95,
    description: 'Scalable systems, load balancing, caching, and databases.',
    time: '~5 hrs',
    estimatedHours: 5,
    difficulty: 4,
    ringTilt: Math.PI / 5,
    rotationSpeed: 0.006,
  },
  {
    id: 8,
    name: 'GraphQL',
    skill: 'API Layer',
    texture: '/textures/4k_ceres_fictional.jpg',
    color: '#e91e63',
    ringColor: '#c2185b',
    emissive: '#e91e63',
    position: [-2, -2, 4],
    size: 0.60,
    description: 'Query language, schemas, resolvers, and API optimization.',
    time: '~2.5 hrs',
    estimatedHours: 2.5,
    difficulty: 3,
    ringTilt: Math.PI / 4,
    rotationSpeed: 0.007,
  },
  {
    id: 9,
    name: 'Kubernetes',
    skill: 'Container Orchestration',
    texture: '/textures/4k_makemake_fictional.jpg',
    color: '#00bcd4',
    ringColor: '#0097a7',
    emissive: '#00bcd4',
    position: [-7, -1, -1],
    size: 0.85,
    description: 'Pods, services, deployments, and cluster management.',
    time: '~4 hrs',
    estimatedHours: 4,
    difficulty: 4,
    ringTilt: Math.PI / 3,
    rotationSpeed: 0.0065,
  },
]
