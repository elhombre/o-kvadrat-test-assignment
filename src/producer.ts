import type { Redis as RedisType } from 'ioredis'
import type { Config } from './config'
import { getRandomIntInclusive } from './utils'

const STREAM_KEY = 'number-stream'

/**
 * Starts multiple producer loops that push random integers into the Redis stream.
 */
export async function startProducers(abortSignal: AbortSignal, redis: RedisType, config: Config): Promise<undefined[]> {
  const tasks: Promise<undefined>[] = []

  for (let i = 0; i < config.producers; i += 1) {
    tasks.push(
      (async function runProducer(): Promise<undefined> {
        while (true) {
          if (abortSignal.aborted) {
            break
          }

          const randomValue: number = getRandomIntInclusive(config.min, config.max)
          await redis.xadd(STREAM_KEY, '*', 'value', randomValue.toString())
        }
      })(),
    )
  }

  return Promise.all(tasks)
}
