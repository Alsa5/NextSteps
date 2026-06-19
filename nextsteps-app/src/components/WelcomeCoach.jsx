import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getWelcomeCopy, NEBULA_TOUR } from '../theme/maverickNebula'
import {
  isWelcomeCoachDismissed,
  markWelcomeCoachDismissed,
} from '../theme/welcomeStorage'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import './WelcomeCoach.css'

export default function WelcomeCoach({ userId, role, onDismiss }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const copy = getWelcomeCopy(role)
  const tourSteps = NEBULA_TOUR[role] ?? NEBULA_TOUR.maverick
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState(null)

  useEffect(() => {
    if (!userId || !role || isWelcomeCoachDismissed(userId, role)) {
      setVisible(false)
      return
    }
    setVisible(true)
    setStep(0)
  }, [userId, role])

  const currentStep = tourSteps[step] ?? tourSteps[0]

  useEffect(() => {
    if (!visible || prefersReducedMotion || !currentStep.selector) {
      setSpotlightRect(null)
      return
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.selector)
      if (!el) { setSpotlightRect(null); return }
      const rect = el.getBoundingClientRect()
      setSpotlightRect({
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      })
    }

    const id = window.requestAnimationFrame(updateRect)
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [visible, prefersReducedMotion, currentStep.selector])

  const handleNext = useCallback(() => {
    if (step < tourSteps.length - 1) {
      setStep((s) => s + 1)
    } else {
      markWelcomeCoachDismissed(userId, role)
      setVisible(false)
      onDismiss?.()
    }
  }, [step, tourSteps.length, userId, role, onDismiss])

  const handleSkip = useCallback(() => {
    markWelcomeCoachDismissed(userId, role)
    setVisible(false)
    onDismiss?.()
  }, [userId, role, onDismiss])

  if (!visible) return null

  const isLast = step === tourSteps.length - 1

  return (
    <div
      className={`welcome-coach${prefersReducedMotion ? ' welcome-coach--reduced' : ''}`}
      role="dialog"
      aria-labelledby="welcome-coach-title"
      aria-describedby="welcome-coach-body"
    >
      {!prefersReducedMotion && spotlightRect && (
        <div
          className="welcome-coach__spotlight"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
          aria-hidden="true"
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="welcome-coach__panel"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.28 }}
        >
          <p className="welcome-coach__eyebrow">{copy.dashboardCodename} · Step {step + 1} of {tourSteps.length}</p>

          <div className="welcome-coach__progress">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`welcome-coach__pip${i <= step ? ' welcome-coach__pip--done' : ''}`}
              />
            ))}
          </div>

          <h3 id="welcome-coach-title" className="welcome-coach__title">
            {currentStep.title}
          </h3>
          <p id="welcome-coach-body" className="welcome-coach__body">
            {currentStep.body}
          </p>

          <div className="welcome-coach__actions">
            {!isLast && (
              <button
                type="button"
                className="welcome-coach__skip-btn"
                onClick={handleSkip}
              >
                Skip tour
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary welcome-coach__cta"
              onClick={handleNext}
            >
              {isLast ? 'Enter the Nebula →' : 'Next →'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
