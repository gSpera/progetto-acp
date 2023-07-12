const express = require('express')
const mongoose = require('mongoose')
const crypto = require("crypto")
const multer = require("multer")
const bodyParser = require("body-parser")
const upload = multer({ storage: multer.memoryStorage() }) // Potrebbe avere senso agiungere dei limiti
const winston = require("winston")

const port = process.env.PORT || 8080
const chiaveSegretaHMAC = process.env.HMAC || "Magari cambiami"
const isTest = process.argv.filter(v => v == "--test").length >= 1
const databaseName = isTest ? "test-db" : "surfando-con-le-stelle"

const log = winston.createLogger({
    level: "info",
    format: isTest ? winston.format.simple() : winston.format.json(),

    transports: [
        new winston.transports.Console(),
    ],
})

if (databaseName == "test-db") {
    log.info("Ambiente di test")
}

mongoose.connect(`mongodb://127.0.0.1:27017/${databaseName}`)
    .then(_ => log.info("Connessione al database avvenuta con successo"))
    .catch(err => {
        log.error("Impossibile collegarsi al database")
        log.error(err)
        process.exit(1)
    })
mongoose.connection.on('error', err => {
    log.error("Errore sul database:" + err)
})

const viaggioSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    partenza: String,
    arrivo: String,
    data: Number, // usiamo il timestamp unix per comodità, in millisecondi
    durata: Number,
    npostiPasseggeri: Number,
    npostiVeicoli: Number,
    prezzoPasseggero: Number,
    prezzoVeicolo: Number,
})
const Viaggio = mongoose.model('Viaggio', viaggioSchema)

const adminSchema = new mongoose.Schema({
    username: String,
    password: String, // Hash
})
const Admin = mongoose.model('Admin', adminSchema)

Admin.findOne({ username: 'admin' }).exec()
    .then(r => {
        if (r == null) {
            log.info("L'utente admin non è stato trovato, per comodità verrà aggiunto, con le credenziali admin:admin")
            const hash = crypto.createHash('sha256').update('admin').digest('hex')
            Admin.insertMany({ username: "admin", password: hash })
        }
    })
//aggiunta collezione utente al database andrea
const utenteSchema = new mongoose.Schema({
        username: String,
        password: String, // Hash
    })
const Utente = mongoose.model('Utente', utenteSchema)
    
const app = express()

app.use(express.static('static'))
app.use(express.json())
app.use(bodyParser.json({ type: 'application/json' }))

app.get("/api/viaggi", (req, res) => {
    const unGiorno = 24 * 60 * 60 * 1000 // Durata di un giorno, in millisecondi
    const partenza = req.query.partenza
    const arrivo = req.query.arrivo
    const data = Math.round(new Date(req.query.data).getTime() / unGiorno) * unGiorno // Timestamp
    const npostiPasseggeri = Number(req.query.npostiPasseggeri) || 1
    const npostiVeicoli = Number(req.query.npostiVeicoli) || 0

    let search = {}
    if (partenza) search["partenza"] = { $regex: String(partenza), $options: "i" }
    if (arrivo) search["arrivo"] = { $regex: String(arrivo), $options: "i" }
    if (data) search["data"] = { $gte: data, $lt: data + unGiorno }
    search["npostiPasseggeri"] = { $gte: npostiPasseggeri }
    search["npostiVeicoli"] = { $gte: npostiVeicoli }

    Viaggio.find(search).exec()
        .then(found => {
            res.send(found)
            log.info("Richista viaggi", { ip: req.ip, count: found.length, query: { partenza, arrivo, data, npostiPasseggeri, npostiVeicoli } })
        })
        .catch(err => log.error("Errore: " + err))
})

app.post("/api/viaggi", upload.single('file'), async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    if (!await isLoginValid(username, password)) {
        res.json({ error: true, msg: "Credenziali invalide" })
        log.error("Login invalido", { username, password })
        return
    }
    const fileBuffer = req.file
    let file
    try {
        file = JSON.parse(fileBuffer.buffer)
    } catch (error) {
        res.json({ error: true, msg: "Invalid file" })
        log.error("Impossibile aggiungere viaggi nel database, file invalido", { error })
        return
    }

    Viaggio.insertMany(file)
        .catch(error => {
            log.error("Impossibile aggiungere viaggi nel database", { error })
            res.json({ error: true, msg: "Impossibile caricare i dati nel database" })
        })
        .then(_ => {
            res.json({ error: false })
            log.info("Aggiunti viaggi", { username: username, count: file.length, fileSize: fileBuffer.buffer.length, ip: req.ip })
        })
})

app.get("/api/autocomplete-partenza", (req, res) => {
    Viaggio.distinct("partenza")
        .then(found => res.send(found))
        .catch(err => console.error("Errore: " + err))
})
app.get("/api/autocomplete-arrivo", (req, res) => {
    Viaggio.distinct("arrivo")
        .then(found => res.send(found))
        .catch(err => console.error("Errore: " + err))
})

app.post("/api/acquista", async (req, res) => {
    // Estraiamo i parametrei
    const { viaggioID, preventivo,
        numeroPasseggeri, numeroVeicoli,
        numeroCarta, nominativo } = req.body

    const viaggio = await Viaggio.findOne({ id: viaggioID }, "prezzoPasseggero prezzoVeicolo id data partenza arrivo").exec()
    if (viaggio == null) {
        res.json({ error: true, msg: "Errore interno, non esiste questo viaggio" })
        log.error("Acquisto su un viaggio non esistente", { viaggioID, ip: req.ip })
        return
    }

    // Calcoliamo il prezzo, non possiamo fidarci del client (ovviamente)
    const prezzoTotale = Number(numeroPasseggeri) * viaggio.prezzoPasseggero + Number(numeroVeicoli) * viaggio.prezzoVeicolo
    if (prezzoTotale != preventivo) {
        log.error("Prezzo calcolato diverso dal preventivo", { viaggioID, numeroPasseggeri, prezzoPasseggero: viaggio.prezzoPasseggero, numeroVeicoli, prezzoVeicoli: viaggio.prezzoVeicolo, preventivo: preventivo, calcolato: prezzoTotale })
        res.json({ error: true, msg: "Il prezzo calcolato è diverso dal preventivo, ricaricare la pagina" })
        return
    }

    // Riserviamo i posti
    let ok = await Viaggio.updateOne(
        { id: viaggioID, npostiPasseggeri: { $gte: numeroPasseggeri }, npostiVeicoli: { $gte: numeroVeicoli } },
        { $inc: { npostiPasseggeri: -numeroPasseggeri, npostiVeicoli: -numeroVeicoli } }
    ).exec()
    if (!ok) {
        res.json({ error: true, msg: "Impossibile riservare i posti, sono ancora disponibili??" })
        log.error("Impossibile riservare i posti", { viaggioID, numeroPasseggeri, numeroVeicoli })
        return
    }

    // Effettuiamo l'accredito
    const accreditoEffettuato = effettuaAccredito(numeroCarta, prezzoTotale)
    if (!accreditoEffettuato) {
        // Rendiamo di nuovo disponibili i posti, in modo atomico
        Viaggio.updateOne({ id: viaggioID }, { $inc: { npostiPasseggeri: numeroPasseggeri, npostiVeicoli: numeroVeicoli } })
        res.json({ error: true, msg: "Impossibile eseguire l'accredito" })
        log.error("Impossibile effettuare accredito", { viaggioID, numeroPasseggeri, numeroVeicoli, prezzo: prezzoTotale, numeroCarta })
        return
    }

    // Generiamo la prenotazione
    const prenotazione = {
        nominativo,
        prezzoPagato: prezzoTotale,
        numeroPasseggeri,
        numeroVeicoli,
        rand: Math.round(Math.random() * 1000), // Evitiamo di generare prenotazioni uguali per nominativi uguali
    }
    const ticket = {
        prenotazione,
        viaggio,
    }
    const hmac = crypto.createHmac("sha1", chiaveSegretaHMAC)
    hmac.update(JSON.stringify(ticket))
    const hmacDigest = hmac.digest("base64")

    res.json({ ...ticket, hmac: hmacDigest })
    log.info("Generata una prenotazione", { ip: req.ip, viaggioID, hmac: hmacDigest, nominativo, prezzoTotale, numeroPasseggeri, numeroVeicoli, rand: prenotazione.rand })
})

app.post("/api/login", upload.none(), async (req, res) => {
    const { username, password } = req.body
    const ok = await isLoginValid(username, password)
    log.info("Login", { username: username, ok })
    res.json({ ok })
})

app.get("/api/loginUtente", function(req, res){
    var username= req.query.username
    var password=req.query.password
    Utente.findOne({username:username , password:password}).then(function(utente){  //controllo nel database 
        if(utente==null){
            res.json({ok:false})
        }else {
            res.json({ok:true})
        }
    });
    }); // login utente andrea controlliam ocredenaziali valide

app.post("/api/registrazioneUtente",express.urlencoded(),  function(req, res){  // registrazione utente andrea 
    var username=req.body.username
    var password=req.body.password
    Utente.insertMany([{username:username, password:password}]) //inseriamo nel database
    console.log(username);
    res.json({a:req.body.username, b:req.query.username});

})

app.listen(port, () => {
    log.info("Listening on " + port)
})

function effettuaAccredito(numeroCarta, totale) {
    log.info("Accredito effettuato", { numeroCarta, totale })
    return true
}

async function isLoginValid(username, password) {
    // Aspettiamo artificialmente 300ms,
    // questo rallenta eventuali attacchi di bruteforce,
    // sopratuttto visto che usiamo sha256 come algoritmo di hash
    // che non è proprio adatto, qualcosa come blowfish sarebbe stato un idea migliore
    await new Promise(resolve => { setTimeout(resolve, 300) })

    const hash = crypto.createHash('sha256').update(password).digest('hex')
    const res = await Admin.findOne({ username, password: hash }).exec()
    if (res == null) { // Nessun risultato trovato
        return false
    }

    return true
    // Avrei potuto usare return res != null, ma così è più chiaro
}