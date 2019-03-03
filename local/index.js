'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const realm = require('realm')
const agent = require('superagent')
const app = express()
const { sync } = require('./sync')

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
    agent.get("localhost:3003")
        .then(
            response => {
                console.log("Querying from remote DB")
                let user = JSON.parse(response.text) 
                let length = Object.keys(user).length
                res.render('index.ejs', {user: user, length: length})
            }
        )
        .catch(
            () => {
                console.log("Remote not available, querying from local DB")
                let user = blogRealm.objects('User')
                res.render('index.ejs', {user: user, length: user.length})
            }
        )
})

app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/login.html")
})

app.get('/register', (req, res) => {
    res.sendFile(__dirname + "/register.html")
})

app.get('/delete', (req, res) => {
    blogRealm.write( () => {
        let users = blogRealm.objects('User')
        blogRealm.deleteAll()
    })

    agent.get("localhost:3003/delete")
        .then(
            response => {
                console.log("Remote synced : delete")
            }
        )

    res.send("Deleted")
})

app.post('/register', (req, res) => {
    let username = req.body['username']
    let password = req.body['password']

    blogRealm.write( () => {
        blogRealm.create('User', {
            username: username, 
            password: password, 
        })
    })

    let user = blogRealm.objects('User')

    sync(user)

    res.sendFile(__dirname + "/register-complete.html")
})

app.post('/login', (req, res) => {
    let user = blogRealm.objects('User')

    sync(user)

    let username = req.body['username']
    let password = req.body['password']

    agent.get("localhost:3003/login")
    .ok(res => res.status < 500)
    .send({
        username: username,
        password: password
    })
    .then(
        response => {
            console.log("Querying from remote DB")
            
            if(response.status == 200)
            {
                res.render('login-success.ejs', {username: username})
            }
            else if( response.status == 404 )
            {
                res.end("Data not found")
            }
        }
    )
    .catch(
        err => {
            console.log(err)
            
            let user = blogRealm.objects('User').filtered(
                'username = "' + username + '"' + ' AND ' + 'password = "' + password + '"'
            )
            
            if (user.length == 0){
                res.send("Data not found")
            }
            else{
                res.render('login-success.ejs', {username: username})
            }
        }
    )
})

app.listen(3000, () => {
    console.log("Start")
})