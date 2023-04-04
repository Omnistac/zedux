import { exec } from 'child_process'
import { promises } from 'fs'
import https from 'https'
import { promisify } from 'util'

export const { readdir, readFile } = promises

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

const execAsync = promisify(exec)

export const cmd = command => execAsync(command).catch(err => ({ stderr: err }))

export const get = (url, options) =>
  new Promise((resolve, reject) => {
    let buffer = ''

    https
      .get(url, options, res => {
        res.on('data', data => {
          buffer += data.toString()
        })

        res.on('end', () => resolve(buffer))
      })
      .on('error', err => reject(err))
  })
