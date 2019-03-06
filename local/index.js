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

let blogRealm = new Realm({
    path: 'blog.local-realm',
    schema: [PostSchema]
})

app.use(bodyParser.urlencoded({
    extended: true
}))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    let user = blogRealm.objects('User')
    res.render('index.ejs', { user: user, length: user.length })
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

    let user = blogRealm.objects('User').filtered(
        'username = "' + username + '"' + ' AND ' + 'password = "' + password + '"'
    )

    if (user.length == 0) {
        res.send("Data not found")
    }
    else {
        res.render('login-success.ejs', { username: username })
    }
})

app.listen(3000, () => {
    console.log("Start")
})