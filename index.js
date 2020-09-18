const Redis = require('ioredis')
const Bluebird = require('bluebird')

async function main() {
  const URL = process.env.REDIS_URI || 'redis://127.0.0.1:6379'
  const client = new Redis(URL)

  const keys = await client.keys('*')

  console.log('Found keys:', keys.length)

  const total = keys.length

  let processed = 0

  const keysWithoutTtl = []

  await Bluebird.map(
    keys,
    async key => {
      const ttl = await client.ttl(key)
      if (ttl === -1) {
        keysWithoutTtl.push(key)
      }
      processed++
      if (processed % 100 === 0) {
        console.log('Processed %s/%s', processed, total)
      }
    },
    { concurrency: 10 }
  )

  await client.quit()

  console.log('Keys without TTL:')
  console.log(keysWithoutTtl.join('\n'))
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
