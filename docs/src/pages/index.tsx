import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import CodeBlock from '@theme/CodeBlock'
import Layout from '@theme/Layout'
import React from 'react'
import styles from './index.module.css'

const exampleCode = `import { atom, useAtomState } from '@zedux/react'

const greetingAtom = atom('greeting', 'Hello, World!')

function Greeting() {
  const [greeting, setGreeting] = useAtomState(greetingAtom)

  return (
    <input
      value={greeting}
      onChange={event => setGreeting(event.target.value)}
    />
  )
}`

const features = [
  {
    title: 'Atomic',
    description:
      'Build state from focused atoms with automatic lifecycles, caching, and fine-grained subscriptions.',
  },
  {
    title: 'Molecular',
    description:
      'Connect atoms through a dynamic dependency graph that keeps updates predictable and efficient.',
  },
  {
    title: 'Composable',
    description:
      'Combine signals, stores, selectors, and injectors without locking your app into a single pattern.',
  },
  {
    title: 'A complete state engine',
    description:
      'Manage client state, async data, dependency injection, side effects, and React integration together.',
  },
]

const learningPaths = [
  {
    title: 'Walkthrough',
    description: 'Learn Zedux from its core concepts through advanced patterns.',
    to: '/docs/walkthrough/quick-start',
    metrics: [
      { label: 'Fun', score: 6 },
      { label: 'Detailed', score: 8 },
      { label: 'Easy', score: 8 },
      { label: 'Applicable', score: 6 },
    ],
  },
  {
    title: 'API reference',
    description: 'Find detailed documentation for every public Zedux API.',
    to: '/docs/api/api-overview',
    metrics: [
      { label: 'Fun', score: 1 },
      { label: 'Detailed', score: 10 },
      { label: 'Easy', score: 2 },
      { label: 'Applicable', score: 4 },
    ],
  },
  {
    title: 'Examples',
    description: 'Explore practical Zedux patterns in editable examples.',
    to: '/examples',
    metrics: [
      { label: 'Fun', score: 7 },
      { label: 'Detailed', score: 4 },
      { label: 'Easy', score: 5 },
      { label: 'Applicable', score: 10 },
    ],
  },
  {
    title: 'Source code',
    description: 'Read the packages, tests, and implementation on GitHub.',
    to: 'https://github.com/Omnistac/zedux',
    metrics: [
      { label: 'Fun', score: 3 },
      { label: 'Detailed', score: 9 },
      { label: 'Easy', score: 2 },
      { label: 'Applicable', score: 1 },
    ],
  },
]

const MetricNodes = ({ score }: { score: number }) => (
  <span aria-hidden="true" className={styles.metricNodes}>
    {Array.from({ length: 10 }, (_, index) => (
      <span
        className={index < score ? styles.metricNodeActive : styles.metricNode}
        key={index}
      />
    ))}
  </span>
)

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16">
    <path
      d="M2.5 8h10.25M8.75 3.75 13 8l-4.25 4.25"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function Home() {
  const moleculeDark = useBaseUrl('/img/brand/zedux-molecule-dark.svg')
  const moleculeLight = useBaseUrl('/img/brand/zedux-molecule-light.svg')
  const wordmarkBlack = useBaseUrl('/img/brand/zedux-wordmark-black.svg')
  const wordmarkWhite = useBaseUrl('/img/brand/zedux-wordmark-white.svg')

  return (
    <Layout
      title="A Molecular State Engine for React"
      description="Zedux is a molecular state engine for scalable React applications."
    >
      <main className={styles.home}>
        <section className={styles.hero}>
          <div aria-hidden="true" className={styles.heroBackground}>
            <img
              alt=""
              className={styles.moleculeOnLight}
              src={moleculeDark}
            />
            <img
              alt=""
              className={styles.moleculeOnDark}
              src={moleculeLight}
            />
            <div className={styles.heroOverlay} />
          </div>

          <div className={`container ${styles.heroContainer}`}>
            <div className={styles.brandRow}>
              <span
                aria-label="Zedux"
                className={styles.wordmark}
                role="img"
              >
                <img
                  alt=""
                  className={styles.wordmarkLight}
                  src={wordmarkBlack}
                />
                <img
                  alt=""
                  className={styles.wordmarkDark}
                  src={wordmarkWhite}
                />
              </span>
              <span className={styles.version}>2.0.0</span>
            </div>

            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <h1>A molecular state engine for React.</h1>
                <p>
                  Powerful primitives for state, async data, and dependency
                  injection.
                </p>

                <div className={styles.heroActions}>
                  <pre className={styles.installCommand} tabIndex={0}>
                    <code>npm install @zedux/react</code>
                  </pre>
                  <Link
                    className={styles.primaryButton}
                    to="/docs/walkthrough/quick-start"
                  >
                    Get started
                  </Link>
                </div>
              </div>

              <div className={styles.exampleCode}>
                <CodeBlock language="tsx">{exampleCode}</CodeBlock>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.features}>
          <div className={`container ${styles.sectionGrid}`}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Why Zedux</p>
              <h2>Build complex state from simple pieces.</h2>
            </div>
            <div className={styles.featureCards}>
              {features.map(feature => (
                <article className={styles.featureCard} key={feature.title}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.learn}>
          <div className="container">
            <div className={styles.learnHeader}>
              <p className={styles.eyebrow}>Learn Zedux</p>
              <h2>Start with the path that fits.</h2>
            </div>
            <div className={styles.learningCards}>
              {learningPaths.map(path => (
                <Link className={styles.learningCard} key={path.title} to={path.to}>
                  <span className={styles.learningCardHeader}>
                    <strong>{path.title}</strong>
                    <small>{path.description}</small>
                  </span>
                  <span className={styles.learningMetrics}>
                    {path.metrics.map(metric => (
                      <span
                        aria-label={`${metric.label}: ${metric.score} out of 10`}
                        className={styles.learningMetric}
                        key={metric.label}
                      >
                        <span>{metric.label}</span>
                        <MetricNodes score={metric.score} />
                        <span className={styles.metricScore}>
                          {metric.score}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className={styles.learningCardArrow}>
                    <Arrow />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
