const express = require('express')
const app = express()

app.use(express.static('static'))

app.get("/api/viaggi", (req, res) => {
    res.json([
        {
            "data": "ieri",
            "orario": "undici",
            "partenza": "castellammare di stabia",
            "arrivo": "sorrento",
            "durata": "troppo",
            "npostiPasseggeri": 10,
            "npostiVeicoli": 11,
        }, {
            "data": "domani",
            "orario": "presto",
            "partenza": "sorrento",
            "arrivo": "napoli",
            "durata": "poco",
            "npostiPasseggeri": 69,
            "npostiVeicoli": 420,
        }, {
        }, {
        }])
})

app.listen(8080, () => {
    console.log("Listening")
})
