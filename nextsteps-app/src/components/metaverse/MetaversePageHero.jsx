import { NEBULA_STORY } from '../../theme/maverickNebula'

export default function MetaversePageHero({ role, title, subtitle }) {
  const chapter = NEBULA_STORY.chapters[role] || NEBULA_STORY.tagline

  return (
    <div className="metaverse-page-hero metaverse-page-hero--no-canvas">
      <div className="metaverse-page-hero-content">
        <p className="metaverse-story-line font-display">{chapter}</p>
        <h1 className="font-display metaverse-page-hero__title">{title}</h1>
        {subtitle && <p className="metaverse-page-hero__subtitle">{subtitle}</p>}
      </div>
    </div>
  )
}
