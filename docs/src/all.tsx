import React, { ReactNode } from 'react'
import CodeBlock from '@theme/CodeBlock'
import RawTabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

export { TabItem }

export * from './components/Legend/Legend'
export * from './theme/CodeBlock/Sandbox'
export { default as Link } from '@docusaurus/Link'

export const Tsx = (props: any) => <CodeBlock language="tsx" {...props} />
export const Ts = (props: any) => <CodeBlock language="ts" {...props} />
export const Tabs = ({ children }: { children: React.ReactElement[] }) => (
  <RawTabs groupId="definition-view">{children}</RawTabs>
)

export const tab1 = (children: ReactNode, useTsx = false) => (
  <TabItem label="Simplified" value="simplified">
    {useTsx ? <Tsx>{children}</Tsx> : <Ts>{children}</Ts>}
  </TabItem>
)

export const tab2 = (children: ReactNode) => (
  <TabItem label="TypeScript" value="typescript">
    <Ts>{children}</Ts>
  </TabItem>
)
