var http = require('http');
const agent = require('superagent')
const { sync } = require('./sync')
const realm = require('realm')
var qs = require('querystring')

let PostSchema = {
    name: 'User',
    properties: {
        username: 'string',
        password: 'string'
    }
}
let blogRealm = new Realm({
    path: 'blog.local-realm',
    schema: [PostSchema]
})

http.createServer(function (req, res) {
    if ('/' == req.url) {
        switch (req.method) {
            case 'GET':
                getData(req, res)
                break;
        }
    }
}).listen(8000);

function getData(req, res) {
    var user
    var length
    var tanda
    agent.get("localhost:3003")
        .then(
            response => {
                console.log("Querying from remote DB")
                tanda = "Querying from remote DB"
                user = JSON.parse(response.text)
                length = Object.keys(user).length
                tampilkanForm(res, user, tanda, length)
            }
        )
        .catch(
            () => {
                tanda = "Remote not available, querying from local DB"
                console.log("Remote not available, querying from local DB")
                user = blogRealm.objects('User')
                tampilkanForm(res, user, tanda, user.length)
            }
        )
}