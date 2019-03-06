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

let blogRealm = new Realm({
    path: 'blog.realm',
    schema: [PostSchema]
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

    res.status(200)
    res.send(users)
})

app.post('/sync', (req, res) => {
    blogRealm.write(() => {
        let users = blogRealm.objects('User')
        blogRealm.deleteAll()
    })

    let users = req.body

    blogRealm.write(() => {
        for (let i in users) {
            blogRealm.create('User', {
                username: users[i].username,
                password: users[i].password,
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

    let user = blogRealm.objects('User')

    console.log(user)

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

    res.sendFile(__dirname + "/register-complete.html")
})

app.listen(3003, () => {
    console.log("Start")
})