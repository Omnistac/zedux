import React from 'react'
import { AiOutlineApartment } from 'react-icons/ai'
import { BsChevronExpand, BsGearFill } from 'react-icons/bs'
import { GiAtom } from 'react-icons/gi'
import { GrClear, GrCycle } from 'react-icons/gr'
import { FaFlag } from 'react-icons/fa'
import { FiGlobe } from 'react-icons/fi'
import { IoMdKey, IoMdList } from 'react-icons/io'
import { MdClear } from 'react-icons/md'
import { IconType } from 'react-icons/lib'

const AtomInstanceIcon = ({ className }: { className?: string }) => {
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

const EdgeIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} height="1em" viewBox="0 0 240 240" width="1em">
      <circle cx="200" cy="40" r="40" fill="currentColor" />
      <line
        x1="40"
        x2="200"
        y1="200"
        y2="40"
        stroke="currentColor"
        strokeWidth="30"
      />
      <circle cx="40" cy="200" r="40" fill="currentColor" />
    </svg>
  )
}

const FilterIcon = ({ className }: { className?: string }) => {
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

const LogIcon = ({ className }: { className?: string }) => {
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

const RemoveItemIcon = ({ className }: { className?: string }) => {
  const id = 'test'

  return (
    <svg className={className} height="1em" viewBox="0 0 240 240" width="1em">
      <line
        x1="0"
        x2="240"
        y1="15"
        y2="15"
        stroke="currentColor"
        strokeWidth="30"
      />
      <line
        x1="0"
        x2="240"
        y1="85"
        y2="85"
        stroke="currentColor"
        strokeWidth="30"
      />
      <filter filterUnits="userSpaceOnUse" id={id}>
        <feComponentTransfer>
          <feFuncA slope="0.4" type="linear" />
        </feComponentTransfer>
      </filter>
      <g>
        <line
          x1="10"
          x2="70"
          y1="125"
          y2="185"
          stroke="currentColor"
          strokeWidth="20"
        />
        <line
          x1="10"
          x2="70"
          y1="185"
          y2="125"
          stroke="currentColor"
          strokeWidth="20"
        />
      </g>
      <line
        x1="80"
        x2="240"
        y1="155"
        y2="155"
        stroke="currentColor"
        strokeWidth="30"
        filter={`url('#${id}')`}
      />
      <line
        x1="0"
        x2="240"
        y1="225"
        y2="225"
        stroke="currentColor"
        strokeWidth="30"
      />
    </svg>
  )
}

const wrap = <R extends Record<string, IconType>>(icons: R) => {
  // just mutate just 'cause...
  Object.entries(icons).forEach(([key, Icon]) => {
    const WrappedIcon = ({ className }: { className?: string }) => (
      <Icon className={className} />
    )

    icons[key as keyof R] = WrappedIcon as any
  })

  return icons
}

const wrappedIcons = wrap({
  Atom: GiAtom,
  Clear: GrClear,
  Cycle: GrCycle,
  Expand: BsChevronExpand,
  Flag: FaFlag,
  Gear: BsGearFill,
  Graph: AiOutlineApartment,
  Key: IoMdKey,
  List: IoMdList,
  X: MdClear,
  World: FiGlobe,
})

export const rawIcons = {
  ...wrappedIcons,
  AtomInstance: AtomInstanceIcon,
  Edge: EdgeIcon,
  Filter: FilterIcon,
  Log: LogIcon,
  RemoveItem: RemoveItemIcon,
}
