
var utenteUsername=null
var utentePassword=null // andrea
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
    if(utenteUsername ==null ){
        alert("Acquisto non autorizzato. Effettua il Login!")
        return 
    }
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
    if (viaggio.npostiVeicoli == 0) {
        $("#compra-biglietto-nveicoli").parent().addClass("hidden")
    } else {
        $("#compra-biglietto-nveicoli").parent().removeClass("hidden")
    }
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

    $("#biglietto-acquistato-qrcode *").remove() // Eliminiamo i vecchi codici qr
    qrcode.append(document.getElementById("biglietto-acquistato-qrcode"))

    $("#biglietto-acquistato").removeClass("hidden")
    $("body").addClass("no-scrollbar")

    caricaPrenotazioni() //andrea
    aggiornaViaggi()
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
   

   
    if (numeroCarta.length == 0) {
        const err = $("<div>").addClass("errore").text("Inserire il numero della carta")
        setTimeout(() => err.remove(), 1000)
        $("#compra-biglietto-errori").append(err)
        return
    }

    fetch("/api/acquista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viaggioID, preventivo, numeroPasseggeri, numeroVeicoli, numeroCarta, utenteUsername, utentePassword }),
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
            popupBigliettoAcquisto({ ...res, nominativo: utenteUsername })
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

//Aggiunta delle rotte da parte dell'admin (Sery)
function uploadCorse() {
    const username = $("#login-username").val()
    const password = $("#login-password").val()
    const file = $("#admin-file")[0].files[0]
    if (file == undefined) {
        // Carica dai campi
        var codice = $("#admin-codice").val()
        var partenza = $("#admin-partenza").val()
        var arrivo = $("#admin-arrivo").val()
        var data = $("#admin-data").val()
        var durata = $("#admin-durata").val()
        var numeroPasseggeri = $("#admin-numero-passeggeri").val()
        var numeroVeicoli = $("#admin-numero-veicoli").val()
        var prezzoPasseggero = $("#admin-prezzo-passeggeri").val()
        var prezzoVeicolo = $("#admin-prezzo-veicoli").val()
        data = new Date(data).getTime()

        $.ajax({
            url: "/api/viaggio",
            method: "POST", //Metodo POST per comunicare con il server 
            data: {
                codice: codice,
                partenza: partenza,
                arrivo: arrivo,
                data: data,
                durata: durata,
                numeroPasseggeri: numeroPasseggeri,
                numeroVeicoli: numeroVeicoli,
                prezzoPasseggero: prezzoPasseggero,
                prezzoVeicolo: prezzoVeicolo,
            },
            success: function(resp) {
                if (!resp.ok) {
                    const err = $("<div>").addClass("errore").text(resp.msg)
                    setTimeout(() => err.remove(), 1000)
                    $("#admin-errori").append(err)
                } else {
                    setTimeout(aggiornaViaggi, 500)
                    alert("Hai aggiunto una nuova corsa!")
                }
            }
        })
    } else {
        // Carica dal file
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
}

//login utente andrea
function loginUtente() {
    $("#loginUtente").removeClass("hidden")
    $("body").addClass("no-scrollbar")
}
function popupLoginChiudiUtente() {
    $("#loginUtente").addClass("hidden")
    $("body").removeClass("no-scrollbar")
}
function login_Utente(){
    var username= $("#loginUtente-username").val();
    var password= $("#loginUtente-password").val();
    $.getJSON("/api/loginUtente", {username:username, password:password}, function(data){
        if (data.ok ) 
        {   popupLoginChiudiUtente()
            nascondiPulsanti(username)
            utenteUsername= username
            utentePassword=password
            caricaPrenotazioni()
        }
        else { const err = $("<div>").addClass("errore").text("credenziali invalide")   //errore di login andrea 
        setTimeout(() => err.remove(), 1000)
        $("#loginUtente-errori").append(err)}
    }); // comunicazione col server;
}

 // registrazione utente andrea
function popupRegistrazione() {
    $("#registrazioneUtente").removeClass("hidden")
    $("body").addClass("no-scrollbar")
}
function popupRegistrazioneChiudiUtente() {
    $("#registrazioneUtente").addClass("hidden")
    $("body").removeClass("no-scrollbar")
}
function registrazione_Utente(){
    var username= $("#registrazioneUtente-username").val();
    var password= $("#registrazioneUtente-password").val();
    $.post("/api/registrazioneUtente", {username:username, password:password}, function(data)
    {   
        popupRegistrazioneChiudiUtente()
        nascondiPulsanti(username)
        utenteUsername=username
        utentePassword=password
        caricaPrenotazioni()

    }, "json"); // comunicazione col server; usiamo post
}

function nascondiPulsanti(username){  // nascondere i pulsanti dopo la registrazione o login andrea
    $("#pulsanteLoginUtente").hide();
    $("#pulsanteRegistrazioneUtente").hide();
    $("#messaggioLogin").text("ciao "+ username).removeClass("hidden")

}

function caricaPrenotazioni(){ //andrea 
     $("#listaPrenotazioni").empty()
     $("#prenotazioniEffettuate").removeClass("hidden")
     $.getJSON("/api/prenotazioni", {username: utenteUsername}, function(prenotazioni){
        if(prenotazioni.length==0){
            $("#listaPrenotazioni").append($("<h4>").text("Spiacenti, non hai più prenotazioni, effettuane altre e non rimanere senza biglietto"))

        }
        for(var i=0; i<prenotazioni.length;i++){
            var idViaggio=prenotazioni[i].idViaggio
            var numeroPasseggeri=prenotazioni[i].numero_passeggeri
            var numeroVeicoli=prenotazioni[i].numero_veicoli
            var prenotazione= $("#template-prenotazione").clone()
            prenotazione.attr("id", "")
            prenotazione.find(".template-prenotazione-partenza").text(prenotazioni[i].viaggio[0].partenza)
            prenotazione.find(".template-prenotazione-arrivo").text(prenotazioni[i].viaggio[0].arrivo)
            prenotazione.find(".template-prenotazione-data").text(new Date(prenotazioni[i].viaggio[0].data).toLocaleString())
            prenotazione.find(".template-prenotazione-numeroPasseggeri").text(prenotazioni[i].numero_passeggeri)
            prenotazione.find(".template-prenotazione-numeroVeicoli").text(prenotazioni[i].numero_veicoli)
            prenotazione.find(".annullaPrenotazione").on("click", ()=>{ // annullare prenotazione andrea
                $.ajax({url:"/api/prenotazione",
                method:"DELETE",
                data:{username:utenteUsername, idViaggio:idViaggio, numeroPasseggeri:numeroPasseggeri, numeroVeicoli:numeroVeicoli}, success:function(){
                caricaPrenotazioni()
                aggiornaViaggi()
            }})
            })
            $("#listaPrenotazioni").append(prenotazione)
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
        $("#admin-partenza-autocomplete").append($("<option />").attr("value", partenza))
    }))
fetch("/api/autocomplete-arrivo")
    .then(r => r.json())
    .then(autocompletes => autocompletes.forEach(arrivo => {
        $("#filtra-arrivo-autocomplete").append($("<option />").attr("value", arrivo))
        $("#admin-arrivo-autocomplete").append($("<option />").attr("value", arrivo))
    }))
