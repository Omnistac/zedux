import React from 'react'
import { ThemeClassNames } from '@docusaurus/theme-common'
import { useDoc } from '@docusaurus/theme-common/internal'
import TOC from '@theme/TOC'
export default function DocItemTOCDesktop() {
  const { toc, frontMatter } = useDoc()
  const clonedToc = [...toc]

  const otherElements = document.querySelectorAll('.markdown > * > div.anchor')

  ;[...otherElements].reverse().forEach(el => {
    let prevAnchor = el.parentElement.previousElementSibling

    while (prevAnchor && !prevAnchor.classList.contains('anchor')) {
      prevAnchor = prevAnchor.previousElementSibling
    }

    if (!prevAnchor) return

    const prevAnchorIndex = clonedToc.findIndex(
      item => item.id === prevAnchor.id
    )

    if (prevAnchorIndex === -1) return

    clonedToc.splice(prevAnchorIndex + 1, 0, {
      id: el.id,
      level: 3,
      value: el.innerHTML,
    })
  })

  return (
    <TOC
      toc={clonedToc}
      minHeadingLevel={frontMatter.toc_min_heading_level}
      maxHeadingLevel={frontMatter.toc_max_heading_level}
      className={ThemeClassNames.docs.docTocDesktop}
    />
  )
}
