import fs from 'fs'
import klaw from 'klaw'
import {
  ucfirst,
  abstractGuard,
  runOnceGuard,
  runOnceGuardBlocking,
  exists,
  createFileFilter,
  walk
} from 'src/utils'

jest.mock('fs')
jest.mock('klaw')

describe('utils', () => {
  afterEach(() => jest.resetAllMocks())

  test('ucfirst', () => {
    expect(ucfirst()).toEqual('')
    expect(ucfirst('hello')).toEqual('Hello')
    expect(ucfirst('Hello')).toEqual('Hello')
    expect(ucfirst('HELLO')).toEqual('Hello')
    expect(ucfirst('hello test')).toEqual('Hello test')
  })

  test('abstractGuard', () => {
    expect(() => abstractGuard('AbstractClass', 'AbstractClass')).toThrowError(/abstract class/)
    expect(() => abstractGuard('DerivedClass', 'AbstractClass')).not.toThrow()
  })

  test('runOnceGuard', () => {
    const instance = {}
    const name = 'test-guard'

    expect(runOnceGuard(instance, name)).toBe(true)
    expect(runOnceGuard(instance, name)).toBe(false)
    expect(runOnceGuard(instance, name)).toBe(false)
  })

  test('runOnceGuardBlocking', async () => {
    const instance = {}
    const name = 'test-guard'

    const guard1 = runOnceGuardBlocking(instance, name)
    const guard2 = runOnceGuardBlocking(instance, name)
    const guard3 = runOnceGuardBlocking(instance, name)

    const releaseBlock = await guard1
    expect(releaseBlock).toBeInstanceOf(Function)
    releaseBlock()

    await expect(Promise.all([guard2, guard3])).resolves.toEqual([false, false])
    await expect(runOnceGuardBlocking(instance, name)).resolves.toEqual(false)
  })

  test('exists', () => {
    let accessCb
    fs.access.mockImplementation((_, __, cb) => (accessCb = cb))

    const pe = exists('/some/existing/path')
    accessCb()
    expect(pe).resolves.toBe(true)

    const pn = exists('/some/non-existing/path')
    accessCb(true)
    expect(pn).resolves.toBe(false)
  })

  test('createFileFilter', () => {
    expect(createFileFilter()).toBeUndefined()

    const filterRE = createFileFilter(/.js$/)
    expect(filterRE).toBeInstanceOf(Function)
    expect(filterRE('/folder/test.js')).toBe(true)
    expect(filterRE('/folder/test.js.bak')).toBe(false)

    const filterSTR = createFileFilter('.js')
    expect(filterSTR).toBeInstanceOf(Function)
    expect(filterSTR('/folder/test.js')).toBe(true)
    expect(filterSTR('/folder/test.js.bak')).toBe(true)
    expect(filterSTR('/folder/test.bak')).toBe(false)

    const filterFN = createFileFilter(() => true)
    expect(filterFN).toBeInstanceOf(Function)
    expect(filterFN('/folder/test.js')).toBe(true)
    expect(filterFN('/folder/test.js.bak')).toBe(true)
    expect(filterFN('/folder/test.bak')).toBe(true)
  })

  test('walk (basic)', async () => {
    const eventFns = {}
    const klawMock = {
      on: jest.fn((event, fn) => {
        eventFns[event] = fn
        return klawMock
      })
    }
    klaw.mockReturnValue(klawMock)

    const p = walk('/test/dir')

    expect(eventFns.data).toBeInstanceOf(Function)
    expect(eventFns.end).toBeInstanceOf(Function)

    eventFns.data({ path: '/test/dir/a-file.js' })
    eventFns.end()

    const matches = await p
    expect(matches).toEqual(['a-file.js'])
  })

  test('walk (validate)', async () => {
    const eventFns = {}
    const klawMock = {
      on: jest.fn((event, fn) => {
        eventFns[event] = fn
        return klawMock
      })
    }
    klaw.mockReturnValue(klawMock)

    const validate = 'some-string-that-doesnt-exists-in-the-test-path'
    const p = walk('/test/dir', { validate })

    expect(eventFns.data).toBeInstanceOf(Function)
    expect(eventFns.end).toBeInstanceOf(Function)

    eventFns.data({ path: '/test/dir/a-file.js' })
    eventFns.end()

    const matches = await p
    expect(matches).toEqual([])
  })

  test('walk (sliceRoot: false)', async () => {
    const eventFns = {}
    const klawMock = {
      on: jest.fn((event, fn) => {
        eventFns[event] = fn
        return klawMock
      })
    }
    klaw.mockReturnValue(klawMock)

    const p = walk('/test/dir', { sliceRoot: false })

    expect(eventFns.data).toBeInstanceOf(Function)
    expect(eventFns.end).toBeInstanceOf(Function)

    eventFns.data({ path: '/test/dir/a-file.js' })
    eventFns.end()

    const matches = await p
    expect(matches).toEqual(['/test/dir/a-file.js'])
  })

  test('walk (sliceRoot: string)', async () => {
    const eventFns = {}
    const klawMock = {
      on: jest.fn((event, fn) => {
        eventFns[event] = fn
        return klawMock
      })
    }
    klaw.mockReturnValue(klawMock)

    const p = walk('/test/dir', { sliceRoot: '/test/' })

    expect(eventFns.data).toBeInstanceOf(Function)
    expect(eventFns.end).toBeInstanceOf(Function)

    eventFns.data({ path: '/test/dir/a-file.js' })
    eventFns.end()

    const matches = await p
    expect(matches).toEqual(['dir/a-file.js'])
  })
})
