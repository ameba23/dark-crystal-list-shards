var ssbClient = require('ssb-client')
var config = require('ssb-config/inject')()
var path = require('path')
var DarkCrystal = require('scuttle-dark-crystal')
var pull = require('pull-stream')
const getContent = require('ssb-msg-content')
const Table = require('@lvchengbin/cli-table')

var keys = require('ssb-keys')
  .loadOrCreateSync(path.join(config.path, 'secret'))

var names = {}, roots = [], count = 0   

ssbClient(keys, config, (err, sbot) => {
  if (err) throw err
  sbot.whoami((err, msg) => {
    if (err) throw err
    const me = msg.id
    sbot.about.get((err, about) => {
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
                table.setHeader(['name', 'created', 'recipients'])
                console.log(table)

                pull(
                  darkCrystal.shard.pull.myCustodianship(),
                  pull.collect((err,msgs)=>{
                    console.log(msgs)
                  })
                )
              }
            })
          )
        }, () => {
          sbot.close()
        })

      )
    })
  })
})

function resolveId (id, about) {
  return Object.values(about[id].name).find(i => typeof i[0] === 'string')[0]
}
