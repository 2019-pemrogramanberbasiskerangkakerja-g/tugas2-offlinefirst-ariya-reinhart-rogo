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
     else if ("/login" == req.url) {
            switch (req.method) {
                case 'GET':
                    tampilan_login(req, res)
                    break;
                case 'POST':
                    login(req, res)
                    break;
            }
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

function badRequest(res) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('400 - Bad Request');
}
function notFound(res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('404 - Not Found');
}

function login(req, res) {
    let user = blogRealm.objects('User')
    var body = '';
    var username;
    var password;
    var word;
    sync(user)
    req.on('data', function (chunk) {
        body += chunk;
        console.log(body)
        // console.log(body);
    });

    req.on('end', function () {
        word = body
        var words = word.split('&');
        console.log(words[0].substring(9))
        console.log(words[1].substring(10))
        let username = words[0].substring(9)
        let password = words[1].substring(10)

        agent.get("localhost:3003/login")
            .ok(res => res.status < 500)
            .send({
                username: username,
                password: password
            })
            .then(
                response => {
                    console.log("Querying from remote DB")

                    if (response.status == 200) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(username);
                        res.end();
                    }
                    else if (response.status == 404) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write('<h1> Selamat Datang </h1>' + username);
                        res.end();
                    }
                }
            )
            .catch(
                err => {
                    console.log(err)

                    let user = blogRealm.objects('User').filtered(
                        'username = "' + username + '"' + ' AND ' + 'password = "' + password + '"'
                    )

                    if (user.length == 0) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write('Not Found');
                        res.end();
                    }
                    else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write('<h1> Selamat Datang </h1>' + username);
                        res.end();
                    }
                }
            )
    });
}