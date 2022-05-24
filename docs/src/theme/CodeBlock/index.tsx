/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import CodeBlock, { Props } from '@theme-init/CodeBlock'
import { Sandbox } from './Sandbox'

const withLiveEditor = (Component: typeof CodeBlock) => {
  function WrappedComponent(props: any) {
    if (props.live) {
      return <Sandbox {...props} />
    }

    return <Component {...props} />
  }

  return WrappedComponent
}

export default withLiveEditor(CodeBlock)
