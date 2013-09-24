var destinos = new Array();
var origenes = new Array();

function addTableHeader(destinations){
    var html = "<tr><th>Origenes / Destinos</th>";
    for(var i=0;i<destinations.length;i++){
        html += "<th data-destination='" + i + "'>" + destinations[i] + "</th>";
    }

    $("#table-head").append(html);
}

function addRow(title, data, index){
    var html = "<tr><th data-origin='" + index + "'>" + title +"</th>";
    for(var i=0; i<data.elements.length; i++){
        html += "<td>" + data.elements[i].distance.text + " (" + data.elements[i].duration.text + ") " + 
                "<button class='btn calcular-ruta pull-right' data-origin='" + index + "' data-destination='" + i + "'>" +
                "   <span class='glyphicon glyphicon-road'></span>" +
                "</button></td>";
    }
    html += "</tr>";

    $("#table-body").append(html);
}

function onMatrixSuccess(json){
    console.log("Origenes: " + json.origin_addresses.length);
    console.log("Destinos: " + json.destination_addresses.length);
    limpiarTabla();
    if(json.status == "OK"){
        addTableHeader(json.destination_addresses);
        for(var i=0;i<json.origin_addresses.length;i++){
            if(json.rows[i].elements[0].status != "ZERO_RESULTS" && json.rows[i].elements[0].status != "NOT_FOUND"){
                addRow(json.origin_addresses[i], json.rows[i], i);
            }else{
                $("#alert-error").fadeIn();        
            }
        }
    }else{
        $("#alert-error").fadeIn();
    }
}

function limpiarTabla(){
    $("#table-head").empty();
    $("#table-body").empty();
}

function calcularRuta(){
    var origin = $("th[data-origin='" + $(this).attr('data-origin') + "']").html();
    var destination = $("th[data-destination='" + $(this).attr('data-destination') + "']").html();

    var url = "http://maps.googleapis.com/maps/api/directions/json";
    var data = {
        origin: origin,
        destination: destination,
        sensor: false,
    }
    $.ajax({
        url: url,
        type: 'get',
        data: data,
        crossDomain: true,
        dataType: 'json',
        success: onRouteSuccess,
        error: function(jqxhr, status, text){
            alert(text);
        }
    });

}

function onRouteSuccess(json){
    $("#ruta").empty();
    $("#ruta").append("<li class='list-group-item active'><strong>Hoja de Ruta</strong></li>")
    if(json.status == "OK"){
        $.each(json.routes[0].legs[0].steps, function(index, step){
            $("#ruta").append("<li class='list-group-item'>" + step.html_instructions + "<br /><strong>Distancia:</strong> "+ step.distance.text + "<br /><strong>Tiempo:</strong> " + step.duration.text +"</li>");
        })
    }
}

function addOrigen(){
    var origen = $("#origen").val();
    $("#origen").val("");

    origenes.push(origen);
    actualizarListaOrigenes();

    if(destinos.length > 0){
        calcularMatrix();
    }
}

function actualizarListaOrigenes(callback){
    var lista = $("#lista-origenes");
    lista.empty();

    if(origenes.length > 0){
        lista.append("<li class='list-group-item active'>Origenes <span class='badge'>" + origenes.length + "</span></li>");
        $.each(origenes, function(index, origen){
            lista.append("<li class='list-group-item'>" + 
                            origen + 
                            " <span data-index='" + index + "' class='glyphicon glyphicon-trash eliminar-origen pull-right'>" +
                        "</li>");
        });
    }

    if(typeof callback != 'undefined'){
        callback();
    }
}

function addDestino(){
    var destino = $("#destino").val();
    $("#destino").val("");

    destinos.push(destino);
    actualizarListaDestinos();
    
    if(origenes.length > 0){
        calcularMatrix();
    }
}

function actualizarListaDestinos(callback){
    var lista = $("#lista-destinos");
    lista.empty();
    
    if(destinos.length > 0){
        lista.append("<li class='list-group-item active'>Destinos <span class='badge'>" + destinos.length + "</span></li>");
        $.each(destinos, function(index, destino){
            lista.append("<li class='list-group-item'>" + 
                            destino + 
                            " <span data-index='" + index + "' class='glyphicon glyphicon-trash eliminar-destino pull-right'></span>" +
                         "</li>");
        });
    }

    if(typeof callback != 'undefined'){
        callback();
    }
}

function calcularMatrix(){
    var url = "http://maps.googleapis.com/maps/api/distancematrix/json";
    var origenesURL = "";
    var destinosURL = "";

    $.each(origenes, function(index, origen){
        origenesURL += origen + "|";
    });

    $.each(destinos, function(index, destino){
        destinosURL += destino + "|";
    });

    var data = {
        origins: origenesURL,
        destinations: destinosURL,
        sensor: false
    };

    $.ajax({
        url: url,
        type: 'get',
        data: data,
        crossDomain: true,
        dataType: 'json',
        success: onMatrixSuccess,                     
        error: function(jqxhr, status, text){
            alert(text);
        }
    });
}

function eliminarOrigen(){
    var index = $(this).attr('data-index');
    origenes.splice(index,1);
    
    if(origenes.length > 0){
        actualizarListaOrigenes(calcularMatrix);
    }else{
        actualizarListaOrigenes();
    }
}

function eliminarDestino(){
    var index = $(this).attr('data-index');
    destinos.splice(index,1);

    if(destinos.length > 0){
        actualizarListaDestinos(calcularMatrix);
    }else{
        actualizarListaDestinos();
    }
}

function cerrarAlert(){
    $("#alert-error").fadeOut();
}

$(document).ready(function(){
    $("#table-body").on("click", ".calcular-ruta", calcularRuta);
    $("#add-origen").on("click", addOrigen);
    $("#add-destino").on("click", addDestino);
    $("#origen").on("keypress", function(event){
        if(event.keyCode == 13){
            addOrigen();
        }
    });

    $("#destino").on("keypress", function(event){
        if(event.keyCode == 13){
            addDestino();
        }
    });

    $("#lista-origenes").on("click", ".eliminar-origen", eliminarOrigen);
    $("#lista-destinos").on("click", ".eliminar-destino", eliminarDestino);
    $("#cerrar-alert").on("click", cerrarAlert);
});