'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const realm = require('realm')
const app = express()
const agent = require('superagent')
const { sync } = require('./sync')

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

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/delete', (req, res) => {
    blogRealm.write(() => {
        let users = blogRealm.objects('User')
        blogRealm.deleteAll()
    })

    res.send("Deleted")
})

app.get('/', (req, res) => {
    let users = blogRealm.objects('User')
    let log = recordRealm.objects('Log')

    res.status(200)
    res.send({users: users, log: log})

})

app.post('/sync', (req, res) => {
    recordRealm.write(() => {
        let log = recordRealm.objects('Log')
        recordRealm.deleteAll()
    })

    let log = req.body

    recordRealm.write(() => {
        for (let i in log) {
            recordRealm.create('Log', {
                username: log[i].username,
                login: log[i].login,
                time: log[i].time,
            })
        }
    })

    res.status(201)
    res.send("Succes Updated")
})

app.get('/register', (req, res) => {
    res.sendFile(__dirname + "/register.html")
})

app.post('/register', (req, res) => {
    let username = req.body['username']
    let password = req.body['password']

    blogRealm.write(() => {
        blogRealm.create('User', {
            username: username,
            password: password,
        })
    })

    res.sendFile(__dirname + "/register-complete.html")
})

setInterval(() => {
    let user = blogRealm.objects('User')

    console.log("Syncing to local DB")

    agent.post('localhost:3000/sync')
        .send(user)
        .then(
            (response) => {
                if (response.status == 201) {
                    console.log("Local DB synced")
                }
            }
        )
        .catch(
            err => {
                console.log(err)
            }
        )
}, 5000)

app.listen(3003, () => {
    console.log("Start")
})