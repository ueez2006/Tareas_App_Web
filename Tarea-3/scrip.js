function validarFormulario(){
    let cedula = document.getElementById('cedula').value.trim();
    let nombre = document.getElementById('nombre').value.trim();
    let direccion = document.getElementById('direccion').value.trim();
    let celular = document.getElementById('celular').value.trim();
    let correo = document.getElementById('correo').value.trim();

    if (cedula.length !== 10 || isNaN(cedula)){
        alert("Error: el campo cedula debe tener 10 caracteres numericos");
        return false; //evita que se envie el formulario
    }

    if (nombre === "" || nombre.length > 30) {
        alert("Error: Debe llenar el campo de nombre y tener un maximo de 30 caracteres.");
        return false;
    }

    if (direccion === "" || direccion.length > 50) {
        alert("Error: La dirección es obligatoria y máximo de 50 caracteres.");
        return false;
    }

    if (celular.length !== 10 || isNaN(celular)) {
        alert("Error: El celular debe tener exactamente 10 números.");
        return false;
    }

    if (correo.indexOf("@") === -1) {
        alert("Error: El correo electrónico debe incluir el símbolo '@'.");
        return false;
    }

    alert("¡Registro exitoso y validado correctamente!");
    return true;
}