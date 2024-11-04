import { Context, Schema, $, h } from 'koishi'
import format from 'pretty-format'

export const name = 'w-debug'

export const inject = {
    optional: [ 'database', 'http' ]
}

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

const select = <T, const Ks extends Array<keyof T>>(value: T, keys: Ks): {
    [K in Ks[number]]: T[K]
} => Object.fromEntries(keys.map(key => [ key, value[key] ])) as any

export function apply(ctx: Context) {
    ctx.command('debug', '调试')

    ctx.command('debug.session')
        .action(({ session }) => JSON.stringify(session, null, 2))

    ctx.command('debug.session.id')
        .action(({ session }) => JSON.stringify(select(session, [
            'id', 'uid', 'gid', 'cid', 'fid', 'sid',
            'userId', 'selfId', 'guildId', 'channelId',
            'messageId', 'roleId', 'operatorId'
        ])))

    ctx.command('debug.prefix')
        .action(() => JSON.stringify(ctx.root.config.prefix))

    ctx.command('debug.arg0 <arg0>')
        .action((_, arg0) => arg0)

    ctx.command('debug.quote')
        .action(({ session }) => session.quote?.content || '[No quote]')

    const AsyncFunction = (async function () {}).constructor as typeof Function

    ctx.command('debug.eval <code:text>', { authority: 4 })
        .alias('~')
        .option('return', '-r')
        .option('inject', '-i <inject:string>')
        .action(async (argv, code) => {
            if (! code.includes('return')) code = `return (${code})` 
            if (argv.options.inject) {
                const deps = argv.options.inject.split(',')
                code = `ctx.inject(${ JSON.stringify(deps) }, ctx => {${code}})`
            }
            try {
                const env = new Proxy({ require, ctx: ctx.root, db: ctx.database, argv, h, $, __dirname, __filename }, {
                    has: () => true,
                    get: (target, key) => {
                        if (key === Symbol.unscopables) return {}
                        if (key in target) return target[key]
                        if (key in global) return global[key]
                        throw new ReferenceError(`${String(key)} is not defined`)
                    }
                })
                code = `with (env) {${code}}`
                const result = await new AsyncFunction('env', code)(env)
                return argv.options.return
                    ? result
                    : format(result)
            }
            catch (err) {
                ctx.logger.error(err)
                return err instanceof Error ? err.stack : String(err)
            }
        })
}
