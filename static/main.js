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
    el.find(".template-viaggio-acquista").on("click", e => popupAcquisto(viaggio))
    return el
}

function popupAcquisto(viaggio) {
    $("#compra-biglietto").removeClass("hidden")
    $("body").addClass("no-scrollbar")
    $("#compra-biglietto-codice-viaggio").text(viaggio.id)
    $("#compra-biglietto-data").text(new Date(viaggio.data).toLocaleString('it-IT'))
    $("#compra-biglietto-partenza").text(viaggio.partenza)
    $("#compra-biglietto-arrivo").text(viaggio.arrivo)
    $("#compra-biglietto-npasseggeri").val(fieldPasseggeri.val())
    $("#compra-biglietto-nveicoli").val(fieldVeicoli.val())
}
function popupAcquistoChiudi() {
    $("#compra-biglietto").addClass("hidden")
    $("body").removeClass("no-scrollbar")
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