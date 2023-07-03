const listaBiglietti = $("#lista-viaggi")
const templateViaggio = $("#template-viaggio")

const fieldPartenza = $("#filtra-partenza")
const fieldArrivo = $("#filtra-arrivo")
const fieldData = $("#filtra-data")
const fieldPasseggeri = $("#filtra-nposti-passeggeri")
const fieldVeicoli = $("#filtra-nposti-veicoli")

function aggiornaViaggi() {
    fetch('/api/viaggi?' + new URLSearchParams({
        partenza: fieldPartenza.val(),
        destinazione: fieldArrivo.val(),
        data: fieldData.val(),
        npostiPasseggeri: fieldPasseggeri.val(),
        npostiVeicoli: fieldVeicoli.val(),
    }))
        .then(r => r.json())
        .then(r => {
            listaBiglietti.empty()
            r.forEach(viaggio => listaBiglietti.append(creaViaggio(viaggio)))
        })
}

function creaViaggio(viaggio) {
    // Creiamo i vari componenti
    const durata = viaggio.durata // In minuti
    const durataOre = Math.round(durata / 60)
    const durataMinuti = Math.round(durata % 60)
    let durataComponents = []
    switch (durataOre) {
        case 0:
            break;
        case 1:
            durataComponents.push("un ora")
            break
        default:
            durataComponents.push(`${durataOre} ore`)
    }
    switch (durataMinuti) {
        case 0:
            break;
        case 1:
            durataComponents.push("un minuto")
            break
        default:
            durataComponents.push(`${durataMinuti} minuti`)
    }

    const durataString = durataComponents.join(" e ")


    // Creiamo l'elemento
    const el = templateViaggio.clone()
    el.attr("id", "") // Rimuoviamo l'attributo id
    el.find(".template-viaggio-data").text(new Date(viaggio.data).toLocaleDateString('it-IT', { "dateStyle": "full" }))
    el.find(".template-viaggio-orario").text(new Date(viaggio.data).toLocaleTimeString('it-IT').split(':').splice(0, 2).join(':'))
    el.find(".template-viaggio-partenza").text(viaggio.partenza)
    el.find(".template-viaggio-arrivo").text(viaggio.arrivo)
    el.find(".template-viaggio-durata").text(durataString)
    el.find(".template-viaggio-nposti-passeggeri").text(viaggio.npostiPasseggeri)
    el.find(".template-viaggio-nposti-veicoli").text(viaggio.npostiVeicoli)
    el.find(".template-viaggio-costo-passeggero").text(viaggio.prezzoPasseggero)
    el.find(".template-viaggio-costo-veicolo").text(viaggio.prezzoVeicolo)
    el.find(".template-viaggio-acquista").on("click", e => popupAcquisto(viaggio))


    if (viaggio.npostiVeicoli == 0) {
        el.find(":has(.template-viaggio-nposti-veicoli)").addClass("hidden")
        el.find(":has(.template-viaggio-costo-veicolo)").addClass("hidden")
    }
    return el
}

function popupAcquisto(viaggio) {
    $("#compra-biglietto-meta-prezzo-passeggero").text(viaggio.prezzoPasseggero)
    $("#compra-biglietto-meta-prezzo-veicolo").text(viaggio.prezzoVeicolo)

    $("#compra-biglietto").removeClass("hidden")
    $("body").addClass("no-scrollbar")
    $("#compra-biglietto-codice-viaggio").text(viaggio.id)
    $("#compra-biglietto-data").text(new Date(viaggio.data).toLocaleString('it-IT'))
    $("#compra-biglietto-partenza").text(viaggio.partenza)
    $("#compra-biglietto-arrivo").text(viaggio.arrivo)
    $("#compra-biglietto-npasseggeri").val(fieldPasseggeri.val())
    $("#compra-biglietto-nveicoli").val(fieldVeicoli.val())
    aggiornaPrezzo()
}
function popupAcquistoChiudi() {
    $("#compra-biglietto").addClass("hidden")
    $("body").removeClass("no-scrollbar")
}

function popupBigliettoAcquisto(vals) {
    const viaggio = vals.viaggio
    $("#biglietto-acquistato-hmac").text(vals.hmac)
    $("#biglietto-acquistato-nominativo").text(vals.nominativo)

    $("#biglietto-acquistato-codice").text(viaggio.id)
    $("#biglietto-acquistato-partenza").text(viaggio.partenza)
    $("#biglietto-acquistato-arrivo").text(viaggio.arrivo)
    $("#biglietto-acquistato-data").text(new Date(viaggio.data).toLocaleString('it-IT'))
    $("#biglietto-acquistato-npasseggeri").text(vals.prenotazione.numeroPasseggeri)
    $("#biglietto-acquistato-nveicoli").text(vals.prenotazione.numeroVeicoli)

    // Generiamo il codice QR della prenotazione
    const qrcode = new QRCodeStyling({
        width: 300,
        height: 300,
        data: JSON.stringify({ prenotazione: vals.prenotazione, codiceViaggio: vals.viaggio.id, data: vals.viaggio.data, hmac: vals.hmac }),
        image: "/favicon.png",
        margin: 10,
        dotsOptions: {
            type: "classy",
            color: "#35b8b8",
        },
        cornersSquareOptions: {
            type: "extra-rounded",
        },
        imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.4,
            crossOrigin: "anonymous",
        },
    })

    qrcode.append(document.getElementById("biglietto-acquistato-qrcode"))

    $("#biglietto-acquistato").removeClass("hidden")
    $("body").addClass("no-scrollbar")
}

function popupBigliettoAcquistatoChiudi() {
    $("#biglietto-acquistato").addClass("hidden")
    $("body").removeClass("no-scrollbar")
}

function popupLogin() {
    $("#login").removeClass("hidden")
    $("body").addClass("no-scrollbar")
}
function popupLoginChiudi() {
    $("#login").addClass("hidden")
    $("body").removeClass("no-scrollbar")
}

function popupAdmin() {
    $("#admin").removeClass("hidden")
    $("body").addClass("no-scrollbar")
}
function popupAdminChiudi() {
    $("#admin").addClass("hidden")
    $("body").removeClass("no-scrollbar")
}

function aggiornaPrezzo() {
    const prezzoPasseggero = Number($("#compra-biglietto-meta-prezzo-passeggero").text())
    const prezzoVeicolo = Number($("#compra-biglietto-meta-prezzo-veicolo").text())
    const numeroPasseggeri = $("#compra-biglietto-npasseggeri").val()
    const numeroVeicoli = $("#compra-biglietto-nveicoli").val()

    const totale = numeroPasseggeri * prezzoPasseggero + numeroVeicoli * prezzoVeicolo
    $("#compra-biglietto-totale").text(totale)
}

function acquista() {
    const viaggioID = $("#compra-biglietto-codice-viaggio").text()
    const preventivo = $("#compra-biglietto-totale").text()
    const numeroPasseggeri = $("#compra-biglietto-npasseggeri").val()
    const numeroVeicoli = $("#compra-biglietto-nveicoli").val()
    const numeroCarta = $("#compra-biglietto-numero-carta").val()
    const nominativo = $("#compra-biglietto-nominativo").val()

    fetch("/api/acquista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viaggioID, preventivo, numeroPasseggeri, numeroVeicoli, numeroCarta, nominativo }),
    })
        .then(r => r.json())
        .then(res => {
            if (res.error) {
                $("#compra-biglietto-errore")
                    .text(res.msg)
                    .fadeIn()
                return
            }

            popupAcquistoChiudi()
            popupBigliettoAcquisto({ ...res, nominativo })
        })
}

function login() {
    // Il sistema di login è molto spartano, ora controlliamo che le credenziali siano valide
    // Rimandiamo le credenziali ad ogni operazioni, così evitiamo problemi CSRF ed altre cose
    const username = $("#login-username").val()
    const password = $("#login-password").val()

    fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    })
        .then(r => r.json())
        .then(r => {
            if (r.ok) {
                popupLoginChiudi()
                popupAdmin()
                aggiornaViaggi()
                return
            }
            const err = $("<div>").addClass("errore").text("Credenziali invalide")
            setTimeout(() => err.remove(), 1000)
            $("#login-errori").append(err)
        })
}

function uploadCorse() {
    const username = $("#login-username").val()
    const password = $("#login-password").val()
    const file = $("#admin-file")[0].files[0]
    const form = new FormData()
    form.append("username", username)
    form.append("password", password)
    form.append("file", file)

    fetch("/api/viaggi", {
        method: "POST",
        body: form,
    })
        .then(r => r.json())
        .then(r => {
            if (!r.error) {
                popupAdminChiudi()
                setTimeout(aggiornaViaggi, 500)
            } else {
                const err = $("<div>").addClass("errore").text(r.msg)
                setTimeout(() => err.remove(), 1000)
                $("#admin-errori").append(err)
            }
        })
}

$(".ricerca-viaggio-filtro").on("input", aggiornaViaggi)

aggiornaViaggi()

// Carichiamo i valori di autocomplete
fetch("/api/autocomplete-partenza")
    .then(r => r.json())
    .then(autocompletes => autocompletes.forEach(partenza => {
        $("#filtra-partenza-autocomplete").append($("<option />").attr("value", partenza))
    }))
fetch("/api/autocomplete-arrivo")
    .then(r => r.json())
    .then(autocompletes => autocompletes.forEach(arrivo => {
        $("#filtra-arrivo-autocomplete").append($("<option />").attr("value", arrivo))
    }))
