import consola from 'consola'
import { NuxtCommand, options } from '@nuxt/cli-edge'
import Commands from './commands'

const { common } = options

export default async function runCommand (options = {}) {
  const {
    name = 'blueprint',
    description
  } = options

  await NuxtCommand.run({
    name,
    description: description || `CLI for ${name}`,
    usage: `${name} <blueprint-name> <cmd>`,
    options: {
      ...common
    },
    async run (cmd) {
      // remove argv's so nuxt doesnt pick them up as rootDir
      const [command = '', ...args] = cmd.argv._.splice(0, cmd.argv._.length)

      if (!command || !Commands[command]) {
        consola.fatal(`Unrecognized command '${command}'`)
        return
      }

      const config = await cmd.getNuxtConfig()
      const nuxt = await cmd.getNuxt(config)

      return Commands[command](args, nuxt, options)
    }
  })
}
