'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const realm = require('realm')
const agent = require('superagent')
const app = express()

app.use(bodyParser.json())

let PostSchema = {
    name: 'User',
    properties: {
        username: 'string',
        password: 'string'
    }
}

let LogSchema = {
    name: 'Log',
    properties: {
        username: 'string',
        login: 'string',
        time: 'date'
    }
}

let blogRealm = new Realm({
    path: 'blog.local-realm',
    schema: [PostSchema]
})

let recordRealm = new Realm({
    path: 'record.local-realm',
    schema: [LogSchema]
})

app.use(bodyParser.urlencoded({
    extended: true
}))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    let user = blogRealm.objects('User')
    let log = recordRealm.objects('Log')
    res.render('index.ejs', { user: user, usrlen: user.length, log: log, loglen: log.length})
})

app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/login.html")
})

app.get('/delete', (req, res) => {
    blogRealm.write(() => {
        let users = blogRealm.objects('User')
        blogRealm.deleteAll()
    })

    res.send("Deleted")
})

app.post('/sync', (req, res) => {
    blogRealm.write(() => {
        let users = blogRealm.objects('User')
        blogRealm.deleteAll()
    })

    let users = req.body

    console.log(users)

    blogRealm.write(() => {
        for (let i in users) {
            console.log(users[i].username)
            blogRealm.create('User', {
                username: users[i].username,
                password: users[i].password,
            })
        }
    })

    res.status(201)
    res.send("Succes Updated")
})

app.post('/login', (req, res) => {
    let username = req.body['username']
    let password = req.body['password']
    let time = new Date();

    let user = blogRealm.objects('User').filtered(
        'username = "' + username + '"' + ' AND ' + 'password = "' + password + '"'
    )

    if (user.length == 0) {
        recordRealm.write(() => {
            let log = recordRealm.create('Log', {
                username: username,
                login: "failed",
                time: time
            });
            
        })
        res.send("Login Failed")
    }
    else {
        recordRealm.write(() => {
            let log = recordRealm.create('Log', {
                username: username,
                login: "success",
                time: time
            });
            
        })
        res.render('login-success.ejs', { username: username })
    }
})

setInterval(() => {
    let log = recordRealm.objects('Log')

    console.log("Syncing to Remote DB")

    agent.post('localhost:3003/sync')
        .send(log)
        .then(
            (response) => {
                if (response.status == 201) {
                    console.log("Remote DB synced")
                }
            }
        )
        .catch(
            err => {
                console.log(err)
            }
        )
}, 5000)

app.listen(3000, () => {
    console.log("Start")
})