import { Context, Schema, SessionError } from 'koishi'
import format from 'pretty-format'

export const name = 'w-debug'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

const select = <T, const Ks extends Array<keyof T>>(value: T, keys: Ks): {
    [K in Ks[number]]: T[K]
} => Object.fromEntries(keys.map(key => [ key, value[key] ])) as any

export function apply(ctx: Context) {
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

    ctx.command('debug.eval <code:text>', { authority: 4 })
        .action(async (_, code) => {
            try {
                return format(await eval(code))
            }
            catch (error) {
                return format(error)
            }
        })
}

