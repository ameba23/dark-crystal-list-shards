var ssbClient = require('ssb-client')
var config = require('ssb-config/inject')()
var path = require('path')
var DarkCrystal = require('scuttle-dark-crystal')
var pull = require('pull-stream')
const getContent = require('ssb-msg-content')

var keys = require('ssb-keys')
  .loadOrCreateSync(path.join(config.path, 'secret'))

var rootName, rootTime

ssbClient(keys, config, (err, sbot) => {
  if (err) throw err
  sbot.whoami((err, msg) => {
    if (err) throw err

    sbot.about.get((err, about) => {
      var darkCrystal = DarkCrystal(sbot)
      pull(
        darkCrystal.root.pull.mine({live: false}),
        pull.drain(root => {
          rootName = getContent(root).name
          rootTime = new Date(root.value.timestamp).toLocaleDateString()
          console.log(rootName, rootTime)
          pull(
            darkCrystal.shard.pull.byRoot(root.key),
            pull.collect((err,shards) => {
              console.log(shards.map(s => getContent(s).recps));
            })
          )
        // console.log(JSON.stringify(root,null,4));
        }, done(sbot))
      )
    })
  })
})
function done (sbot) {
  return () => { sbot.close() }
}

function resolveId (id, about) {
  return about[id].name[id][0]
}
