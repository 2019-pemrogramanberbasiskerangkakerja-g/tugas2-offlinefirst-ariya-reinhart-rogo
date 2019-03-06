const agent = require('superagent')

function sync(user){
    agent.post("localhost:3003/sync")
    .send(user)
    .then(
        response => {
            if(response.status == 201)
            {
                console.log(response.body)
            }
        }
    )
    .catch(
        () => {
            console.log("Error occured or remote DB currently not available")
        }
    )
}

module.exports = {
    sync
}