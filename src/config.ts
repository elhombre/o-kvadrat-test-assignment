import { cpus } from 'node:os'
import { Command } from 'commander'

export interface Config {
  batchSize: number
  groupName: string
  max: number
  min: number
  output: string
  producers: number
  redisUrl: string
}

export function loadConfig(): Config {
  const defaultProducers: number = Math.max(1, cpus().length * 2)
  const program: Command = new Command()
  program
    .option(
      '-p, --producers <number>',
      'number of producers',
      (value: string) => Number.parseInt(value, 10),
      defaultProducers,
    )
    .requiredOption('--min <number>', 'minimum random integer', (value: string) => Number.parseInt(value, 10))
    .requiredOption('--max <number>', 'maximum random integer', (value: string) => Number.parseInt(value, 10))
    .option('-r, --redis <url>', 'Redis connection URL', 'redis://localhost:6379')
    .option('-o, --output <path>', 'output JSON file path', 'result.json')
    .option('-b, --batchSize <number>', 'consumer batch size', (value: string) => Number.parseInt(value, 10), 1000)
    .option('-g, --groupName <name>', 'Redis consumer group name', 'number-collector-group')
    .parse(process.argv)

  const options = program.opts()

  if (options.min > options.max) {
    throw new Error('Option --min must be less than or equal to --max')
  }

  return {
    batchSize: options.batchSize,
    groupName: options.groupName,
    max: options.max,
    min: options.min,
    output: options.output,
    producers: options.producers,
    redisUrl: options.redis,
  }
}
