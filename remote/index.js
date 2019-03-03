'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const realm = require('realm')
const app = express()

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

app.get('/login', (req, res) => {
    let username = req.body.username
    let password = req.body.password

    let user = blogRealm.objects('User').filtered(
        'username = "' + username + '"' + ' AND ' + 'password = "' + password + '"'
    )
    
    if (user.length != 0){
        res.status(200)
        res.send("Data found")
    }
    else{
        res.status(404)
        res.send("Not found")
    }
})

app.get('/', (req, res) => {
    let users = blogRealm.objects('User')
    
    res.status(200)
    res.send(users)
})

app.post('/sync', (req, res) => {
    blogRealm.write( () => {
        let users = blogRealm.objects('User')
        blogRealm.deleteAll()
    })

    let users = req.body

    blogRealm.write( () => {
        for(let i in users){
            blogRealm.create('User', {
                username: users[i].username,
                password: users[i].password,
            })
        }
    })

    res.status(201)
    res.send("Succes Updated")
})

app.get('/delete', (req, res) => {
    blogRealm.write( () => {
        let users = blogRealm.objects('User')
        blogRealm.deleteAll()
    })

    res.send("Deleted")
})

app.listen(3003, () => {
    console.log("Start")
})