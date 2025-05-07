import { writeFile } from 'node:fs/promises'
import Redis from 'ioredis'
import type { Redis as RedisType } from 'ioredis'
import { loadConfig } from './config'
import { startConsumer } from './consumer'
import { startProducers } from './producer'
import type { Result } from './types'

async function main(): Promise<void> {
  const config = loadConfig()

  const redis: RedisType = new Redis(config.redisUrl)
  const abortController: AbortController = new AbortController()
  const { signal } = abortController

  // Launch producers and consumer in parallel
  const producersPromise = startProducers(signal, redis, config)
  const consumerResult: Result = await startConsumer(signal, redis, config)

  // Stop all producers
  abortController.abort()
  await producersPromise

  // Write output JSON
  const outputData: string = JSON.stringify(consumerResult, null, 2)
  await writeFile(config.output, outputData)

  await redis.quit()
}

main().catch((error: unknown) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
