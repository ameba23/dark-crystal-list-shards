#!/bin/env node
const ssbClient = require('ssb-client')
const config = require('ssb-config/inject')()
const path = require('path')
const DarkCrystal = require('scuttle-dark-crystal')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')
const Table = require('@lvchengbin/cli-table')
const chalk = require('chalk')

const keys = require('ssb-keys')
  .loadOrCreateSync(path.join(config.path, 'secret'))

var names = {}
var roots = []
var count = 0

ssbClient(keys, config, (err, sbot) => {
  if (err) throw err
  sbot.whoami((err, msg) => {
    if (err) throw err
    const me = msg.id
    sbot.about.get((err, about) => {
      if (err) throw err
      var darkCrystal = DarkCrystal(sbot)

      pull(
        darkCrystal.root.pull.mine({live: false}),
        pull.drain(root => {
          count++
          names[root.key] = []
          pull(
            darkCrystal.shard.pull.byRoot(root.key),
            pull.drain(shard => {
              var recps = getContent(shard).recps.filter(r => r !== me)
              names[getContent(shard).root].push(recps.map(r => resolveId(r, about))[0])
            }, () => {
              roots.push([
                getContent(root).name,
                new Date(root.value.timestamp).toLocaleDateString(),
                names[root.key]
              ])
              if (roots.length === count) {
                var table = new Table(roots)
                table.setHeader(['Name', 'Created', 'Recipients'])
                console.log(chalk.blue('My Crystals'))
                console.log(table)
                var shardsFromOthers = []
                pull(

                  darkCrystal.shard.pull.fromOthers({live: false}),
                  pull.drain((msg) => {
                    shardsFromOthers.push([
                      resolveId(msg.value.author, about),
                      new Date(msg.value.timestamp).toLocaleDateString()
                    ])
                  }, () => {
                    var shardsTable = new Table(shardsFromOthers)
                    shardsTable.setHeader(['Author', 'Date'])
                    console.log(chalk.blue('Others shards'))
                    console.log(shardsTable)
                    sbot.close()
                  })
                )
              }
            })
          )
        })
      )
    })
  })
})

function resolveId (id, about) {
  return Object.values(about[id].name).find(i => typeof i[0] === 'string')[0]
}
