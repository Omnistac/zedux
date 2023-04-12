import { exec } from 'child_process'
import { promises } from 'fs'
import { request } from 'https'
import inquirer from 'inquirer'
import path from 'path'

export const { readdir, readFile, writeFile } = promises

/**
 * Make sure this script is invoked from the repo root
 */
export const assertCwdIsRoot = async () => {
  console.info('Making sure this script was invoked from the repo root')

  const grepPackageJson = await cmd(`grep '"name": "zedux"' ./package.json`)

  if (!grepPackageJson.stdout) {
    console.error('This script can only be run from the repo root')
    process.exit(1)
  }
}

/**
 * Run any command in the CWD.
 */
export const cmd = command =>
  new Promise(resolve => {
    let code

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
    }).on('exit', c => (code = c))
  })

/**
 * Ask the user a question and wait for a yes/no response. Pass the 2nd param to
 * set the default if they hit enter without typing anything.
 */
export const confirm = async (message, theDefault = true) => {
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

/**
 * Kill the process, undoing changes. Can only be invoked before we `git push`
 */
const die = async () => {
  console.info('Canceling')
  await cmd('git checkout -- .')
  process.exit(0)
}

/**
 * Accepts a url string, a typical `fetch`/`request` options object, and
 * optional `postData` object/array.
 *
 * Sends the request over https and parses the response body (if any).
 *
 * Returns a `{ body, headers, statusCode }` object
 */
export const fetch = (url, options = {}, postData) =>
  new Promise((resolve, reject) => {
    let body = []

    const req = request(url, options, res => {
      res.on('data', data => {
        body.push(data)
      })

      res.on('end', () => {
        const bodyString = Buffer.concat(body).toString()

        resolve({
          body: bodyString ? JSON.parse(bodyString) : undefined,
          headers: res.headers,
          statusCode: res.statusCode,
        })
      })
    })

    req.on('error', err => reject(err))

    if (postData) req.write(JSON.stringify(postData))

    req.end()
  })

/**
 * Get the list of package names in the monorepo. These are the folder names
 * inside the `packages/` directory.
 */
export const getPackages = async () => {
  console.info('Reading available packages')

  return (await readdir(path.resolve('packages'), { withFileTypes: true }))
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name)
}

export const readJson = async (...args) =>
  JSON.parse((await readFile(...args)).toString())

export const writeJson = (fileName, data) =>
  writeFile(fileName, JSON.stringify(data, null, 2) + '\n')
