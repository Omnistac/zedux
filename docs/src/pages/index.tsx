import React from 'react'
import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import {
  Buttons,
  Features,
  FeatureImage,
  H1,
  Header,
  HeaderContent,
  Link,
  SlidingBg,
  Tagline,
} from './index.styles'

const features = [
  {
    title: <>Easy to Use!!</>,
    imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        Docusaurus was designed from the ground up to be easily installed and
        used to get your website up and running quickly.
      </>
    ),
  },
  {
    title: <>Focus on What Matters</>,
    imageUrl: 'img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Docusaurus lets you focus on your docs, and we&apos;ll do the chores. Go
        ahead and move your docs into the <code>docs</code> directory.
      </>
    ),
  },
  {
    title: <>Powered by React</>,
    imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can
        be extended while reusing the same header and footer.
      </>
    ),
  },
]

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl)
  return (
    <div className="col col--4">
      {imgUrl && (
        <div className="text--center">
          <FeatureImage src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function Home() {
  const { siteConfig } = useDocusaurusContext()
  const textureUrl = useBaseUrl('img/bg-texture.png')

  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="Zedux is an elite state management tool for React"
    >
      <Header>
        <SlidingBg url={textureUrl} />
        <HeaderContent className="container">
          <H1>{siteConfig.title}</H1>
          <Tagline>{siteConfig.tagline}</Tagline>
          <Buttons>
            <Link to={useBaseUrl('docs/react/tutorial/quick-start')}>
              Quick Start!
            </Link>
            <Link to={useBaseUrl('docs/api')}>API Docs</Link>
          </Buttons>
        </HeaderContent>
      </Header>
      <main>
        {features && features.length && (
          <Features>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </Features>
        )}
      </main>
    </Layout>
  )
}

export default Home
