import React from 'react'
import NavbarNavLink from '@theme-original/NavbarItem/NavbarNavLink'

// Docusaurus 3.7's external-link icon uses a conditional prop spread that is
// incompatible with this site's React 19 runtime in development. Keep the
// standard navbar item for internal links and render the one external item
// directly until Docusaurus is upgraded.
export default function NavbarNavLinkWrapper(props) {
  if (props.label !== 'GitHub') {
    return <NavbarNavLink {...props} />
  }

  return (
    <a
      aria-label="Zedux on GitHub"
      className={`${props.className || ''} githubNavbarLink`}
      href={props.href}
      rel="noreferrer"
      target="_blank"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.84a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
          fill="currentColor"
        />
      </svg>
      <span>GitHub</span>
      <span aria-hidden="true" className="githubNavbarExternal">↗</span>
    </a>
  )
}
