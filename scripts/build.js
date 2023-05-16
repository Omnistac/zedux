#!/usr/bin/env node

import { platform } from 'os'
import { cmd } from './utils.js'

const tsconfig = 'tsconfig.build.json'

const tscBuild = async isCjs => {
  // run tsc
  const tscOutput = await cmd(
    `yarn tsc --project ${tsconfig}${
      isCjs ? ' --module commonjs --outDir dist/cjs' : ''
    }`
  )

  if (tscOutput.code) {
    console.error(`tsc failed. Output: ${tscOutput}`)
    process.exit(1)
  }

  // replace TS aliases in the built files with relative paths using tsc-alias
  const tscAliasOutput = await cmd(
    `yarn tsc-alias -p ${tsconfig}${isCjs ? ' --outDir dist/cjs' : ''}`
  )

  if (tscAliasOutput.code) {
    console.error(`tsc-alias failed. Output: ${tscAliasOutput}`)
    process.exit(1)
  }

  // replace usages of the DEV global with `true` in the built files
  const devReplaceOutput = await cmd(
    `find dist/${isCjs ? 'cjs' : 'esm'} -type f -exec sed -i${
      platform() === 'darwin' ? " ''" : ''
    } 's/DEV/true \\/* DEV *\\//g' {} +`
  )

  if (devReplaceOutput.code) {
    console.error(`DEV replacement failed. Output: ${devReplaceOutput}`)
    process.exit(1)
  }

  if (isCjs) {
    // in cjs builds, create a `package.json` with `type: 'commonjs'` in the
    // dist/cjs folder
    const makePackageJsonOutput = await cmd(
      `echo '${JSON.stringify(
        { type: 'commonjs' },
        null,
        2
      )}' > dist/cjs/package.json`
    )

    if (makePackageJsonOutput.code) {
      console.error(
        `failed to create cjs package.json. Output: ${makePackageJsonOutput}`
      )
      process.exit(1)
    }

    return
  }

  // in esm builds, add the `.js` file extension to all imports (required by
  // node and now webpack)
  const addExtensionsOutput = await cmd(
    `find dist/esm -type f -exec sed -i${
      platform() === 'darwin' ? " ''" : ''
    } "s|\\(from '\\..*\\)'|\\1.js'|" {} +`
  )

  if (addExtensionsOutput.code) {
    console.error(
      `adding .js extensions failed. Output: ${addExtensionsOutput}`
    )
    process.exit(1)
  }

  const fixJsxPragma = await cmd(
    `find dist/esm -type f -exec sed -i${
      platform() === 'darwin' ? " ''" : ''
    } "s|\\(from \\"react/jsx-runtime\\)\\"|\\1.js\\"|" {} +`
  )

  if (fixJsxPragma.code) {
    console.error(`fixing jsx pragma failed. Output: ${fixJsxPragma}`)
    process.exit(1)
  }
}

const run = async () => {
  // run this first; everything else can then run concurrently
  await cmd('yarn rimraf dist')

  // prod builds (umd & es)
  cmd('yarn vite build').then(viteOutput => {
    if (viteOutput.code) {
      console.error(`vite failed. Output: ${viteOutput}`)
      process.exit(1)
    }
  })

  // esm dev build
  tscBuild()

  // cjs dev build
  tscBuild(true)
}

run()
