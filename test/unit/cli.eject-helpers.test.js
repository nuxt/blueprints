import consola from 'consola'
import fsExtra from 'fs-extra'
import { ejectTheme, ejectTemplates, ejectTemplate } from 'src/cli/commands/eject'

import * as utils from 'src/utils'
import { resetUtilMocks as _resetUtilMocks } from 'test-utils'
jest.mock('src/utils')
const resetUtilMocks = utilNames => _resetUtilMocks(utils, utilNames)

jest.mock('fs-extra')

describe('eject helpers', () => {
  beforeAll(() => resetUtilMocks())

  afterEach(() => jest.resetAllMocks())

  test('ejectTheme logs warning when source is empty', async () => {
    fsExtra.readFile.mockReturnValue(false)

    const nuxt = {}
    const options = {}
    const discoveryPath = '/var/nuxt'

    await ejectTheme(nuxt, options, discoveryPath)

    expect(fsExtra.readFile).toHaveBeenCalledTimes(1)
    expect(fsExtra.readFile).toHaveBeenCalledWith('/var/nuxt/theme.css')

    expect(consola.warn).toHaveBeenCalledTimes(1)
    expect(consola.warn).toHaveBeenCalledWith('Reading from theme.css returned empty content, eject aborted')
  })

  test('ejectTheme logs info when theme ejected', async () => {
    fsExtra.readFile.mockReturnValue(true)

    const nuxt = { options: { rootDir: '/var/nuxt' } }
    const options = {}
    const discoveryPath = '/var/nuxt'

    await ejectTheme(nuxt, options, discoveryPath)

    expect(fsExtra.appendFile).toHaveBeenCalledTimes(1)
    expect(fsExtra.appendFile).toHaveBeenCalledWith('/var/nuxt/nuxt.press.css', true)

    expect(consola.info).toHaveBeenCalledTimes(1)
    expect(consola.info).toHaveBeenCalledWith('Ejected to ./nuxt.press.css')
  })

  test('ejectTemplates creates main template dir', async () => {
    fsExtra.readFile.mockReturnValue(true)

    const nuxt = {
      options: {
        rootDir: '/var/nuxt',
        srcDir: '/var/nuxt',
        dir: {
          app: 'app'
        }
      }
    }
    const options = { appDir: 'test-dir' }
    const templates = []

    await ejectTemplates(nuxt, options, templates)

    expect(fsExtra.ensureDir).toHaveBeenCalledTimes(1)
    expect(fsExtra.ensureDir).toHaveBeenCalledWith('/var/nuxt/app/test-dir')
  })

  test('ejectTemplate logs warning when source is empty', async () => {
    fsExtra.readFile.mockReturnValue(false)

    const nuxt = {
      options: {
        rootDir: '/var/nuxt',
        srcDir: '/var/nuxt',
        dir: {
          app: 'app'
        }
      }
    }
    const options = { appDir: 'test-dir' }
    const template = { src: '/var/the/source', dst: 'the/destination' }
    const resolvedAppDir = undefined

    await ejectTemplate(nuxt, options, template, resolvedAppDir)

    expect(fsExtra.readFile).toHaveBeenCalledTimes(1)
    expect(fsExtra.readFile).toHaveBeenCalledWith('/var/the/source')

    expect(consola.warn).toHaveBeenCalledTimes(1)
    expect(consola.warn).toHaveBeenCalledWith('Reading source template file returned empty content, eject aborted for: ../the/source')
  })

  test('ejectTemplate logs info when template ejected', async () => {
    fsExtra.readFile.mockReturnValue(true)

    const nuxt = {
      options: {
        rootDir: '/var/nuxt',
        srcDir: '/var/nuxt',
        dir: {
          app: 'app'
        }
      }
    }
    const options = { appDir: 'test-dir' }
    const template = { src: 'the/source', dst: 'the/destination' }
    const resolvedAppDir = undefined

    await ejectTemplate(nuxt, options, template, resolvedAppDir)

    expect(consola.debug).toHaveBeenCalledTimes(1)
    expect(consola.debug).toHaveBeenCalledWith(`Ejecting template 'the/source' to '/var/nuxt/app/test-dir/the/destination'`)

    expect(fsExtra.readFile).toHaveBeenCalledTimes(1)
    expect(fsExtra.readFile).toHaveBeenCalledWith('the/source')

    expect(fsExtra.ensureDir).toHaveBeenCalledTimes(1)
    expect(fsExtra.ensureDir).toHaveBeenCalledWith('/var/nuxt/app/test-dir/the')

    expect(consola.info).toHaveBeenCalledTimes(1)
    expect(consola.info).toHaveBeenCalledWith('Ejected app/test-dir/the/destination')
  })
})
