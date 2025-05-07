import type { Redis as RedisType } from 'ioredis'
import type { Config } from './config'
import type { NumberRecord, Result } from './types'

const STREAM_KEY = 'number-stream'

type StreamEntry = [string, string[]]
type Stream = [string, StreamEntry[]]

/**
 * Starts the consumer loop that reads from the Redis stream,
 * filters duplicates, and records unique values with timestamps.
 */
export async function startConsumer(abortSignal: AbortSignal, redis: RedisType, config: Config): Promise<Result> {
  const groupName: string = config.groupName
  const consumerName: string = `consumer-${process.pid}`

  try {
    await redis.xgroup('CREATE', STREAM_KEY, groupName, '0', 'MKSTREAM')
  } catch (error: unknown) {
    if (error instanceof Error && !error.message.includes('BUSYGROUP')) {
      throw error
    }
  }

  const seenValues: Set<number> = new Set()
  const numbersGenerated: NumberRecord[] = []
  const totalToCollect: number = config.max - config.min + 1
  const startTime: number = Date.now()

  while (true) {
    if (abortSignal.aborted) {
      break
    }

    const streams: Stream[] | null = (await redis.xreadgroup(
      'GROUP',
      groupName,
      consumerName,
      'COUNT',
      config.batchSize,
      'BLOCK',
      0,
      'STREAMS',
      STREAM_KEY,
      '>',
    )) as Stream[] | null

    if (streams === null) {
      continue
    }

    for (const [, entries] of streams) {
      for (const [id, fields] of entries) {
        const index: number = fields.findIndex((field: string, idx: number) => idx % 2 === 0 && field === 'value')

        let valueStr = ''
        if (index >= 0 && fields.length > index + 1) {
          valueStr = fields[index + 1]
        }

        const parsedValue: number = Number(valueStr)

        if (!seenValues.has(parsedValue)) {
          seenValues.add(parsedValue)
          numbersGenerated.push({
            value: parsedValue,
            date: new Date().toISOString(),
          })

          if (seenValues.size >= totalToCollect) {
            const timeSpent: number = Date.now() - startTime
            return {
              timeSpent,
              numbersGenerated,
            }
          }
        }

        await redis.xack(STREAM_KEY, groupName, id)
      }
    }
  }

  const timeSpent: number = Date.now() - startTime
  return {
    timeSpent,
    numbersGenerated,
  }
}
