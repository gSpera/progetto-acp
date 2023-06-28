const express = require('express')
const mongoose = require('mongoose')
mongoose.connect("mongodb://127.0.0.1:27017/")

const viaggioSchema = new mongoose.Schema({
    id: Number,
    partenza: String,
    arrivo: String,
    data: Number, // usiamo il timestamp unix per comodità, in millisecondi
    durata: Number,
    npostiPasseggeri: Number,
    npostiVeicoli: Number,
})
const Viaggio = mongoose.model('Viaggio', viaggioSchema)

const app = express()

app.use(express.static('static'))

app.get("/api/viaggi", (req, res) => {
    const unGiorno = 24 * 60 * 60 * 1000 // Durata di un giorno, in millisecondi
    const partenza = req.query.partenza
    const arrivo = req.query.arrivo
    const data = Math.round(new Date(req.query.data).getTime() / unGiorno) * unGiorno // Timestamp
    const npostiPasseggeri = Number(req.query.npostiPasseggeri) || 0
    const npostiVeicoli = Number(req.query.npostiVeicoli) || 0

    let search = {}
    if (partenza) search["partenza"] = { $regex: String(partenza), $options: "i" }
    if (arrivo) search["arrivo"] = { $regex: String(arrivo), $options: "i" }
    if (data) search["data"] = { $gte: data, $lt: data + unGiorno }
    search["npostiPasseggeri"] = { $gte: npostiPasseggeri }
    search["npostiVeicoli"] = { $gte: npostiVeicoli }

    // console.log(search)

    Viaggio.find(search).exec()
        .then(found => res.send(found))
        .catch(err => console.error("Errore: " + err))
})

app.get("/api/autocomplete-partenza", (req, res) => {
    Viaggio.find({}, "partenza")
        .then(found => res.send(found.map(v => v.partenza)))
        .catch(err => console.error("Errore: " + err))
})
app.get("/api/autocomplete-arrivo", (req, res) => {
    Viaggio.find({}, "arrivo")
        .then(found => res.send(found.map(v => v.arrivo)))
        .catch(err => console.error("Errore: " + err))
})

app.listen(8080, () => {
    console.log("Listening")
})
