import React, { ReactElement } from 'react'
import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { Features, FeatureImage } from '../css/index.styles'
import { Header } from '../components/Header'

const features = [
  {
    title: 'Easy to Use!!',
    imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        Docusaurus was designed from the ground up to be easily installed and
        used to get your website up and running quickly.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    imageUrl: 'img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Docusaurus lets you focus on your docs, and we&apos;ll do the chores. Go
        ahead and move your docs into the <code>docs</code> directory.
      </>
    ),
  },
  {
    title: 'Powered by React',
    imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can
        be extended while reusing the same header and footer.
      </>
    ),
  },
].filter(() => false)

function Feature({
  imageUrl,
  title,
  description,
}: {
  imageUrl: string
  title: string
  description: ReactElement
}) {
  const { baseUrl } = useDocusaurusContext().siteConfig
  const imgUrl = `${baseUrl}${imageUrl}`

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

  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="Zedux is a molecular state engine for React"
    >
      <Header />
      <main>
        {features && features.length ? (
          <Features>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </Features>
        ) : null}
      </main>
    </Layout>
  )
}

export default Home
