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
    el.attr("id", "") // Rimuoviamo il tag id
    el.find(".template-viaggio-data").text(viaggio.data)
    el.find(".template-viaggio-orario").text(viaggio.orario)
    el.find(".template-viaggio-partenza").text(viaggio.partenza)
    el.find(".template-viaggio-arrivo").text(viaggio.arrivo)
    el.find(".template-viaggio-durata").text(viaggio.durata)
    el.find(".template-viaggio-nposti-passeggeri").text(viaggio.npostiPasseggeri)
    el.find(".template-viaggio-nposti-veicoli").text(viaggio.npostiVeicoli)
    return el
}

$(".ricerca-viaggio-filtro").on("input", aggiornaViaggi)

aggiornaViaggi()