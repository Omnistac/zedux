import React from 'react'
import { GiAtom as AtomIcon } from 'react-icons/gi'

export { AtomIcon }
export { GrCycle as CycleIcon } from 'react-icons/gr'
export { FaFlag as FlagIcon } from 'react-icons/fa'
export { FiGlobe as WorldIcon } from 'react-icons/fi'
export { IoMdKey as KeyIcon } from 'react-icons/io'
export { FaTimes as XIcon } from 'react-icons/fa'

export const AtomInstanceIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} height="1em" viewBox="0 0 240 240" width="1em">
      <ellipse
        cx="120"
        cy="120"
        rx="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="20"
        ry="110"
      />
      <ellipse
        cx="120"
        cy="120"
        rx="30"
        ry="110"
        fill="none"
        stroke="currentColor"
        strokeWidth="20"
        style={{ transform: 'rotate(120deg)', transformOrigin: 'center' }}
      />
      <ellipse
        cx="120"
        cy="120"
        rx="30"
        ry="110"
        fill="none"
        stroke="currentColor"
        strokeWidth="20"
        style={{ transform: 'rotate(240deg)', transformOrigin: 'center' }}
      />
      <circle cx="120" cy="120" r="10" fill="currentColor" />
      <line
        x1="120"
        x2="120"
        y1="160"
        y2="240"
        stroke="currentColor"
        strokeWidth="20"
        style={{ filter: Array(5).fill('drop-shadow(0 0 4px #000)').join(' ') }}
      />
    </svg>
  )
}

export const FilterIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} height="1em" viewBox="0 0 240 240" width="1em">
      <line
        x1="0"
        x2="240"
        y1="50"
        y2="50"
        stroke="currentColor"
        strokeWidth="30"
      />
      <line
        x1="50"
        x2="190"
        y1="120"
        y2="120"
        stroke="currentColor"
        strokeWidth="30"
      />
      <line
        x1="100"
        x2="140"
        y1="190"
        y2="190"
        stroke="currentColor"
        strokeWidth="30"
      />
    </svg>
  )
}

export const LogIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} height="1em" viewBox="0 0 240 240" width="1em">
      <circle
        cx="100"
        cy="65"
        r="50"
        fill="none"
        stroke="currentColor"
        strokeWidth="30"
      />
      <line
        x1="15"
        x2="100"
        y1="230"
        y2="65"
        stroke="currentColor"
        strokeDasharray="145"
        strokeWidth="30"
      />
      <line
        x1="120"
        x2="170"
        y1="160"
        y2="160"
        stroke="currentColor"
        strokeWidth="30"
      />
      <polygon points="170 100 240 160 170 220" fill="currentColor" />
    </svg>
  )
}
