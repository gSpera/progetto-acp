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
    const el = templateViaggio.clone()
    el.attr("id", "") // Rimuoviamo l'attributo id
    el.find(".template-viaggio-data").text(new Date(viaggio.data).toLocaleDateString('it-IT', { "dateStyle": "full" }))
    el.find(".template-viaggio-orario").text(new Date(viaggio.data).toLocaleTimeString('it-IT'))
    el.find(".template-viaggio-partenza").text(viaggio.partenza)
    el.find(".template-viaggio-arrivo").text(viaggio.arrivo)
    el.find(".template-viaggio-durata").text(viaggio.durata)
    el.find(".template-viaggio-nposti-passeggeri").text(viaggio.npostiPasseggeri)
    el.find(".template-viaggio-nposti-veicoli").text(viaggio.npostiVeicoli)
    el.find(".template-viaggio-costo-passeggero").text(viaggio.prezzoPasseggero)
    el.find(".template-viaggio-costo-veicolo").text(viaggio.prezzoVeicolo)
    el.find(".template-viaggio-acquista").on("click", e => popupAcquisto(viaggio))
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

    $("#biglietto-acquistato").removeClass("hidden")
    $("body").addClass("no-scrollbar")
}

function popupBigliettoAcquistatoChiudi() {
    $("#biglietto-acquistato").addClass("hidden")
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