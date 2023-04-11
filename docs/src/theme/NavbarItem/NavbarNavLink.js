import React from 'react'
import { BsBook } from 'react-icons/bs'
import { FiBook } from 'react-icons/fi'
import { FaGithub } from 'react-icons/fa'
import NavbarNavLink from '@theme-original/NavbarItem/NavbarNavLink'

export default function NavbarNavLinkWrapper(props) {
  if (props.label === 'GitHub') {
    return (
      <a
        className={`${props.className} navbar__item--highlighted`}
        href={props.href}
        rel="noreferrer"
        style={{
          marginRight: '10px',
        }}
        target="_blank"
      >
        <span>GitHub</span>
        <FaGithub style={{ fontSize: '1.4em' }} />
      </a>
    )
  }

  if (props.label !== 'Docs') {
    return <NavbarNavLink {...props} />
  }

  return (
    <>
      <NavbarNavLink
        {...props}
        className={`${props.className} navbar__item--highlighted`}
        label={
          <>
            <span>Docs</span>
            <BsBook className="active" />
            <FiBook className="inactive" />
          </>
        }
      />
    </>
  )
}
