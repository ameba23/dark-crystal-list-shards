var ssbClient = require('ssb-client')
var config = require('ssb-config/inject')()
var path = require('path')
var DarkCrystal = require('scuttle-dark-crystal')
var pull = require('pull-stream')
const getContent = require('ssb-msg-content')

var keys = require('ssb-keys')
  .loadOrCreateSync(path.join(config.path, 'secret'))

var name, created, roots = []

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
          roots.push(root)
        // console.log(JSON.stringify(root,null,4));
        }, () => {
          roots.map(root => {
            pull(
              darkCrystal.shard.pull.byRoot(root.key),
              pull.collect((err, shards) => {
                var recps = shards.map(s => getContent(s).recps.filter(r => r !== me))
                const names = recps.map(r => resolveId(r, about))
                name = getContent(root).name
                created = new Date(root.value.timestamp).toLocaleDateString()
                
                console.log(name, created, names )
              })
            )
          })
          sbot.close()
        })
      )
    })
  })
})

function resolveId (id, about) {
  return Object.values(about[id].name).find(i => typeof i[0] === 'string')[0]
}
