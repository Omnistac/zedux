import { exec } from 'node:child_process'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import inquirer from 'inquirer'

// ─── Types ───────────────────────────────────────────────────────────

interface CmdResult {
  code: number | undefined
  stdout: string
  stderr: string
  toString(): string
}

interface CommitItem {
  affectedPackages: string[]
  isBreaking: boolean
  message: string
}

// ─── Constants ───────────────────────────────────────────────────────

const validTypes = [
  'major',
  'minor',
  'patch',
  'premajor',
  'preminor',
  'prepatch',
  'prerelease',
]

const distTagOverrideFlag = '--dist-tag='
const includeChoresFlag = '--chores'

const validDistTags = ['canary', 'latest', 'lts', 'next']
const validFlags = [distTagOverrideFlag, includeChoresFlag]
const validPreIds = ['alpha', 'beta', 'rc']

const isNextBranch = (branch: string): boolean =>
  /^next\/v\d+\.(\d+\.)?x$/.test(branch)

const isSupportBranch = (branch: string): boolean => /^v\d+\.x$/.test(branch)

// ─── Utilities ───────────────────────────────────────────────────────

const cmd = (command: string): Promise<CmdResult> =>
  new Promise(resolve => {
    let code: number | undefined

    exec(command, (err, stdout, stderr) => {
      resolve({
        code,
        stdout,
        stderr,
        toString: () =>
          `\n\ncode: ${code}\n\nstdout:\n\n${
            stdout || '<nothing>'
          }\n\nstderr:\n\n${stderr || '<nothing>'}`,
      })
    }).on('exit', c => {
      code = c ?? undefined
    })
  })

const confirm = async (message: string, theDefault = true): Promise<void> => {
  const { proceed } = await inquirer.prompt([
    {
      default: theDefault,
      message,
      name: 'proceed',
      type: 'confirm',
    },
  ])

  if (!proceed) await die()
}

const die = async (): Promise<never> => {
  console.info('Canceling')
  await cmd('git checkout -- .')
  process.exit(0)
}

const readJson = async (filePath: string): Promise<any> =>
  JSON.parse(await readFile(filePath, 'utf-8'))

const writeJson = (filePath: string, data: unknown): Promise<void> =>
  writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')

const githubHeaders = (email: string, token: string, post?: boolean) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  ...(post && { 'Content-Type': 'application/json' }),
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': encodeURIComponent(email),
})

// ─── Pre-flight checks ──────────────────────────────────────────────

const assertCwdIsRoot = async (): Promise<void> => {
  console.info('Making sure this script was invoked from the repo root')

  const grepPackageJson = await cmd(`grep '"name": "zedux"' ./package.json`)

  if (!grepPackageJson.stdout) {
    console.error('This script can only be run from the repo root')
    process.exit(1)
  }
}

/**
 * Make sure the docs site builds - no missing links etc that'll stop the deploy
 */
const assertDocsSiteBuilds = async (): Promise<void> => {
  console.info('Making sure the docs site builds')

  const output = await cmd('cd docs && pnpm build')

  if (output.code) {
    console.error(
      `Docs site failed to build. You may need to run \`pnpm i\` in the docs directory. Output: ${output}`
    )
    process.exit(1)
  }
}

const assertNoChanges = async (): Promise<void> => {
  console.info('Making sure the working tree is clean')

  const gitStatus = await cmd('git status')

  if (!gitStatus.stdout.includes('nothing to commit, working tree clean')) {
    console.error('Working tree must be clean before releasing a new version')
    process.exit(1)
  }
}

const assertNpmIsAuthed = async (): Promise<void> => {
  console.info("Making sure you're authed with npm")

  const output = await cmd(
    'npm_config_registry=https://registry.npmjs.org/ npm whoami'
  )

  if (output.code) {
    console.error(`Npm auth check failed. Output: ${output}`)
    process.exit(1)
  }
}

const assertTokenIsValid = async (
  email: string,
  token: string
): Promise<void> => {
  console.info('Making sure GitHub token is valid')

  try {
    const response = await fetch(
      'https://api.github.com/repos/omnistac/zedux/commits?per_page=1',
      { headers: githubHeaders(email, token) }
    )

    const data: unknown[] = await response.json()

    if (data.length !== 1) throw 'unexpected response'
  } catch (err) {
    console.error('GitHub request failed. Token is likely invalid. Error:', err)
    process.exit(1)
  }
}

const assertValidArgs = (
  type: string,
  preId: string | undefined,
  flags: string[]
): void => {
  console.info('Validating arguments')

  if (!validTypes.includes(type)) {
    console.error(
      `Expected first argument to be one of "${validTypes.join('", "')}"`
    )
    process.exit(1)
  }

  if (
    type.startsWith('pre') &&
    type !== 'prerelease' &&
    (!preId || !validPreIds.includes(preId))
  ) {
    console.error(
      `Expected second argument to be one of "${validPreIds.join('", "')}"`
    )
    process.exit(1)
  }

  const invalidFlag = flags.find(
    flag => !validFlags.some(validFlag => flag.startsWith(validFlag))
  )

  if (invalidFlag) {
    console.error(`Invalid flag "${invalidFlag}" found`)
    process.exit(1)
  }

  const distTagOverride = flags
    .find(flag => flag.startsWith(distTagOverrideFlag))
    ?.slice(distTagOverrideFlag.length)

  if (distTagOverride && !validDistTags.includes(distTagOverride)) {
    console.error(
      `Expected dist-tag override to be one of "${validDistTags.join(
        '", "'
      )}". Received: "${distTagOverride}"`
    )
    process.exit(1)
  }
}

// ─── Workflow steps ──────────────────────────────────────────────────

const getBranch = async (type: string): Promise<string> => {
  console.info(
    'Making sure the current branch is `master`, `v*.x`, or `next/v*.x`'
  )

  const { stdout } = await cmd('git branch --show-current')
  const branch = stdout.trim()
  const isNext = isNextBranch(branch)
  const isSupport = isSupportBranch(branch)
  const isValid = branch === 'master' || isSupport || isNext

  if (!isValid) {
    console.error(
      'Releases can only be cut from `master`, `v*.x`, or `next/v*.x` branches'
    )
    process.exit(1)
  }

  if (isSupport && !['minor', 'patch', 'preminor', 'prepatch'].includes(type)) {
    console.error(
      'Support branches can only publish minor, patch, preminor, and prepatch versions.'
    )
    process.exit(1)
  }

  if (isNext && !['premajor', 'preminor', 'prerelease'].includes(type)) {
    console.error(
      'Next branches can only publish premajor or preminor versions.'
    )
    process.exit(1)
  }

  return branch
}

const getEmail = async (): Promise<string> => {
  console.info('Reading configured git email')

  const { stdout } = await cmd('git config user.email')

  if (!stdout) {
    console.error(
      'You must have your git email configured for this repo. Set it via `git config user.email "<email>"`'
    )
    process.exit(1)
  }

  return stdout
}

const getPackages = async (): Promise<string[]> => {
  console.info('Reading available packages')

  return (await readdir(resolve('packages'), { withFileTypes: true }))
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name)
}

const getToken = async (): Promise<string> => {
  console.info('Reading configured GITHUB_TOKEN env variable')

  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN
  }

  try {
    const contents = await readFile('.env', 'utf-8')

    const envVars = contents
      .split('\n')
      .filter(Boolean)
      .reduce<Record<string, string>>((obj, field) => {
        const [key, ...val] = field.split('=')
        obj[key] = val.join('=')
        return obj
      }, {})

    if (envVars.GITHUB_TOKEN) {
      return envVars.GITHUB_TOKEN
    }
  } catch {
    // .env file doesn't exist, that's fine
  }

  console.error(
    "Couldn't find a GITHUB_TOKEN in the current environment. Either set the env variable before invoking this script or set it in a local (gitignored) .env file in the repo root"
  )
  process.exit(1)
}

const pullTags = async (): Promise<void> => {
  const output = await cmd('git pull && git fetch --all --tags')

  if (output.code) {
    console.error(`Failed to fetch tags: ${output}`)
    process.exit(1)
  }
}

const incrementVersion = async (
  packages: string[],
  type: string,
  preId: string | undefined
): Promise<string> => {
  console.info('Incrementing package versions')

  const npmVersionOutput = await cmd(
    `npm version --no-git-tag-version ${type}${
      preId ? ` --preid=${preId}` : ''
    }`
  )

  if (npmVersionOutput.code) {
    console.error(
      `Failed to increment npm version. Output: ${npmVersionOutput}`
    )
    process.exit(1)
  }

  const tagName = npmVersionOutput.stdout.trim()
  const version = tagName.slice(1) // slice the "v" off the tagName

  await confirm(`Publishing version ${version}. Proceed?`)

  const promises = packages.map(async dir => {
    const file = `packages/${dir}/package.json`
    const packageJson = await readJson(file)

    packageJson.version = version

    for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
      Object.keys(packageJson[key] || {}).forEach((dep: string) => {
        if (!dep.startsWith('@zedux/')) return

        packageJson[key][dep] = version
      })
    }

    await writeJson(file, packageJson)
  })

  await Promise.all(promises)

  return tagName
}

const updateLockfile = async (): Promise<void> => {
  console.info('Updating pnpm-lock.yaml')

  const output = await cmd('pnpm i --lockfile-only')

  if (output.code) {
    console.error(`Failed to update lockfile. Output: ${output}`)
    process.exit(1)
  }
}

/**
 * Receives a list of CommitItems and turns it into a markdown unordered list.
 */
const formatList = (header: string, list: CommitItem[]): string => {
  if (!list.length) return ''

  const formattedList = list
    .sort((a, b) => {
      if (a.isBreaking !== b.isBreaking) return a.isBreaking ? -1 : 1

      const aLength = a.affectedPackages.length
      const bLength = b.affectedPackages.length

      if (aLength !== bLength) return aLength - bLength

      const [firstPackageA] = a.affectedPackages
      const [firstPackageB] = b.affectedPackages

      if (firstPackageA !== firstPackageB) {
        return firstPackageA.localeCompare(firstPackageB)
      }

      return a.message.localeCompare(b.message)
    })
    .map(
      ({ affectedPackages, isBreaking, message }) =>
        `- ${isBreaking ? '**Breaking Change** ' : ''}${
          affectedPackages.length
            ? `\`${affectedPackages.join('`, `')}\`: `
            : ''
        }${message}`
    )

  return `### ${header}:\n\n${formattedList.join('\n')}`
}

/**
 * Read all commits since the last tag and group the `feat`, `fix`, and `chore`
 * commits. Prompt for any additional notes. Accentuate any breaking changes.
 *
 * Output markdown at the beginning of the CHANGELOG.md file
 */
const generateChangelog = async (
  type: string,
  tagName: string,
  includeChores: boolean
): Promise<string> => {
  const [day, month, year] = new Date().toUTCString().split(' ').slice(1, 4)
  const date = `${month} ${day.replace(/^0/, '')}, ${year}`
  const file = 'CHANGELOG.md'

  const changelog = await readFile(file, 'utf-8').catch(() => '')
  const commits = await cmd(
    'git log $(git describe --tags --abbrev=0)..HEAD --pretty="%H"'
  )

  let hasBreakingChanges = false
  const chores: CommitItem[] = []
  const features: CommitItem[] = []
  const fixes: CommitItem[] = []

  const promises = commits.stdout
    .split('\n')
    .filter(Boolean)
    .map(async id => {
      const { stdout } = await cmd(`git show ${id} --pretty="%B" -s`)
      const message = stdout.trim()
      const colonIndex = message.indexOf(':')
      const isBreaking = message[colonIndex - 1] === '!'
      const shortMessage = message.slice(colonIndex + 2, stdout.indexOf('\n'))

      if (isBreaking) hasBreakingChanges = true

      const affectedPackages =
        message.match(/^\w+\((.*?)\)!?:/)?.slice(1, 2) ||
        message.match(/^@affects (.*)?/m)?.[1].split(', ') ||
        []

      const item: CommitItem = {
        affectedPackages,
        isBreaking,
        message: shortMessage,
      }

      if (/^feat[(!:]/.test(message)) {
        features.push(item)
      } else if (/^fix[(!:]/.test(message)) {
        fixes.push(item)
      } else if (
        (includeChores ? /^chore[(!:]/ : /^chore(\(.+?\))?!:/).test(message)
      ) {
        // only include breaking chores if !includeChores
        chores.push(item)
      }
    })

  await Promise.all(promises)

  if (
    hasBreakingChanges &&
    !['major', 'premajor', 'prerelease'].includes(type)
  ) {
    await confirm(
      'Breaking changes detected. A major version or a premajor is recommended. Proceed anyway?',
      false
    )
  }

  if (
    features.length &&
    !['major', 'minor', 'premajor', 'preminor', 'prerelease'].includes(type)
  ) {
    await confirm(
      'New features detected. A major, minor, premajor, or preminor is recommended. Proceed anyway?',
      false
    )
  }

  const header = `## ${tagName} (${date})`
  const featuresStr = formatList('New Features', features)
  const fixesStr = formatList('Fixes', fixes)
  const choresStr = formatList('Auxiliary Changes', chores)

  const { notes } = await inquirer.prompt([
    {
      message: 'Any additional notes for the changelog?\n',
      name: 'notes',
    },
  ])

  if (!notes.trim() && !chores.length && !features.length && !fixes.length) {
    console.error(
      `\nNo fixes, features, or chores since last release and no notes given. Maybe you meant to include the "${includeChoresFlag}" flag. Exiting.\n`
    )
    process.exit(1)
  }

  const body = [notes.trim(), featuresStr, fixesStr, choresStr]
    .filter(Boolean)
    .join('\n\n')

  const changelogEntry = `${header}\n\n${body}`

  const newChangelog = `${changelogEntry}\n${changelog ? '\n' : ''}${changelog}`

  await writeFile(file, newChangelog)

  return body
}

const commitChanges = async (tagName: string): Promise<void> => {
  await confirm(
    'Versions updated and changelog generated. Review changes. Proceed?'
  )

  console.info(
    `Switching to branch "release/${tagName}" and committing changes`
  )

  const commitOutput = await cmd(
    `git checkout -b release/${tagName} && git add . && git commit -m "${tagName}" && git push -u origin release/${tagName}`
  )

  if (commitOutput.code) {
    console.error(`Failed to commit and push changes. Output: ${commitOutput}`)
    process.exit(1)
  }
}

const makePullRequest = async (
  email: string,
  token: string,
  branch: string,
  tagName: string
): Promise<void> => {
  try {
    const response = await fetch(
      'https://api.github.com/repos/omnistac/zedux/pulls',
      {
        headers: githubHeaders(email, token, true),
        method: 'POST',
        body: JSON.stringify({
          base: branch,
          body: `## Description\n\nIncrement monorepo package versions and update the CHANGELOG for version ${tagName.slice(
            1
          )}.\n\nThis PR was generated by the release script at https://github.com/Omnistac/zedux/tree/${branch}/scripts/release.ts\n\nThe packages will be published to npm and a GitHub release will be created after this PR merges.`,
          head: `release/${tagName}`,
          title: `release: ${tagName}`,
        }),
      }
    )

    const data: { html_url?: string } = await response.json()

    if (!data.html_url) {
      console.info(
        'GitHub pull request creation response has no url. Response:',
        data
      )
      throw 'no url in body'
    }

    console.info(`\n  Successfully created GitHub PR at ${data.html_url}\n`)

    await confirm('Squash and merge the above PR. Is it done?')
  } catch (err) {
    console.error('Failed to create GitHub Pull Request. Error:', err)
    await confirm(
      `\nCreate and merge the PR manually from branch "release/${tagName}". Is it done?`
    )
  }
}

const returnToBranch = async (
  branch: string,
  tagName: string
): Promise<void> => {
  console.info(`Returning to branch "${branch}" and pulling`)

  const checkoutOutput = await cmd(`git checkout ${branch} && git pull`)

  if (checkoutOutput.code) {
    console.info(
      `Failed to checkout original branch and/or pull changes. Output: ${checkoutOutput}`
    )
    await confirm(
      `\nInvestigate the problem. Ensure the current branch is "${branch}" and up-to-date. Is that done?`
    )
  }

  const lastCommitCmd = 'git show --pretty="%s" -s'
  let lastCommitOutput = await cmd(lastCommitCmd)

  // the merge commit should have the PR # appended to it, so only check if
  // startsWith:
  while (!lastCommitOutput.stdout.trim().startsWith(tagName)) {
    console.error('Last commit on target branch does not match the pushed tag')

    await confirm(
      "\nInvestigate the problem. Perhaps the PR didn't merge successfully. Is it resolved?"
    )

    await cmd('git pull')
    lastCommitOutput = await cmd(lastCommitCmd)
  }

  console.info('Tagging release commit')

  const tagOutput = await cmd(
    `git tag -a ${tagName} -m "${tagName}" && git push origin ${tagName}`
  )

  if (tagOutput.code) {
    console.error(`Failed to add and push git tag. Output: ${tagOutput}`)
    await confirm('\nInvestigate the problem. Is it resolved?')
  }
}

const confirmDistTag = async (
  branch: string,
  isPrerelease: boolean,
  distTagOverride: string | undefined
): Promise<string> => {
  const computedTag =
    distTagOverride ||
    (isNextBranch(branch)
      ? 'canary'
      : isSupportBranch(branch)
      ? 'lts'
      : isPrerelease
      ? 'next'
      : '')

  const choices = ['', ...validDistTags].map(tag => ({
    name: tag || '(none - defaults to latest)',
    value: tag,
  }))

  const { distTag } = await inquirer.prompt([
    {
      type: 'list',
      name: 'distTag',
      message: 'Confirm dist-tag for publishing:',
      default: computedTag,
      choices,
    },
  ])

  return distTag
}

const promptOtp = async (message = 'Enter npm OTP:'): Promise<string> => {
  const { otp } = await inquirer.prompt([
    {
      message,
      name: 'otp',
      type: 'input',
    },
  ])

  return otp.trim()
}

const npmPublish = async (
  packages: string[],
  distTag: string
): Promise<void> => {
  const failedPackages: string[] = []
  const tagStr = distTag ? ` --tag ${distTag}` : ''

  console.info('Publishing packages with npm dist-tag:', distTag || '(none)')

  let otp = await promptOtp()

  // publish packages one-by-one (there seemed to be some Nx race condition)
  for (const dir of packages) {
    const publishCmd = `cd packages/${dir} && npm_config_registry=https://registry.npmjs.org/ npm publish --access=public${tagStr} --otp=${otp}`

    let output = await cmd(publishCmd)

    if (output.code) {
      console.error(`Failed to publish package "${dir}". Output: ${output}`)
      otp = await promptOtp('Publish failed. Enter a new OTP to retry:')
      output = await cmd(
        `cd packages/${dir} && npm_config_registry=https://registry.npmjs.org/ npm publish --access=public${tagStr} --otp=${otp}`
      )
    }

    if (output.code) {
      failedPackages.push(dir)
      console.error(
        `Failed to publish package "${dir}" after retry. Output: ${output}`
      )
    } else {
      console.info(`Published "${dir}" package successfully`)
    }
  }

  if (failedPackages.length) {
    console.error(`\nFailed packages: ${failedPackages.join(', ')}`)
    await confirm(
      '\nInvestigate the problem(s) and publish packages manually. Are they all published?'
    )
  }
}

const createRelease = async (
  email: string,
  token: string,
  tagName: string,
  changelogBody: string,
  isPrerelease: boolean
): Promise<void> => {
  console.info('Creating GitHub Release')

  try {
    const response = await fetch(
      'https://api.github.com/repos/omnistac/zedux/releases',
      {
        headers: githubHeaders(email, token, true),
        method: 'POST',
        body: JSON.stringify({
          body: changelogBody,
          name: tagName,
          prerelease: isPrerelease,
          tag_name: tagName,
        }),
      }
    )

    const data: { html_url?: string } = await response.json()

    if (!data.html_url) {
      console.info(
        'GitHub release creation response has no url. Response:',
        data
      )
      throw 'no url in body'
    }

    console.info(`Successfully created GitHub release at ${data.html_url}`)
  } catch (err) {
    console.error('Failed to create GitHub release. Error:', err)
    await confirm(`\nCreate the release for ${tagName} manually. Is it done?`)
  }
}

const logPackageLinks = (packages: string[]): void => {
  console.info('Success! Published the following npm packages:\n')

  for (const packageName of packages) {
    console.info(`  https://www.npmjs.com/package/@zedux/${packageName}`)
  }

  console.info('\n')
}

// ─── Main ────────────────────────────────────────────────────────────

const run = async (args: string[], flags: string[]): Promise<void> => {
  const [type, preId] = args
  assertValidArgs(type, preId, flags)

  const isPrerelease = type.startsWith('pre')

  // we don't need to assert that tests pass or that packages build - the
  // release PR CI will do that. TODO: Move docs site build check to a CI job
  // for `release/*` branch PRs
  await Promise.all([
    assertCwdIsRoot(),
    assertNoChanges(),
    assertDocsSiteBuilds(),
  ])

  await pullTags()

  const [branch, email, packages, token] = await Promise.all([
    getBranch(type),
    getEmail(),
    getPackages(),
    getToken(),
  ])

  await Promise.all([assertNpmIsAuthed(), assertTokenIsValid(email, token)])

  // start modifying things
  const tagName = await incrementVersion(packages, type, preId)
  await updateLockfile()

  const changelogBody = await generateChangelog(
    type,
    tagName,
    flags.includes(includeChoresFlag)
  )

  await commitChanges(tagName)

  // Now we're at the point of no return. Stop exiting on errors and instead
  // prompt the user to manually fix any encountered problem.
  await makePullRequest(email, token, branch, tagName)
  await returnToBranch(branch, tagName)

  const distTagOverride = flags
    .find(flag => flag.startsWith(distTagOverrideFlag))
    ?.slice(distTagOverrideFlag.length)

  const distTag = await confirmDistTag(branch, isPrerelease, distTagOverride)

  await npmPublish(packages, distTag)
  await createRelease(email, token, tagName, changelogBody, isPrerelease)

  logPackageLinks(packages)
}

const { args, flags } = process.argv.slice(2).reduce(
  (buckets, argOrFlag) => {
    const bucket = argOrFlag.startsWith('-') ? buckets.flags : buckets.args
    bucket.push(argOrFlag)

    return buckets
  },
  { args: [] as string[], flags: [] as string[] }
)

run(args, flags)
