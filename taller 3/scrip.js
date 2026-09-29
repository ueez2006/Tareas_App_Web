function validarCalculo(){
    let n1 = parseFloat(document.getElementById('n1').value.trim());
    let n2 = parseFloat(document.getElementById('n2').value.trim());

    for (let i = 0; i < 5; i++) {
        if (i == 0){
            alert(n1 +n2)
        }
        if (i == 1){
            alert(n1 - n2)
        }
        if (i == 2){
            if(n2 === 0){
                alert("este valor 2 no puede ser menor al primero")
            }
            else{
                alert(`el resultado de la operacion es: ${n1 / n2}`)
            }
        }
        if (i == 3){
            alert(n1 * n2)
        }
        if (i == 4){
            if(n2 === 0){
                alert("este valor 2 no puede ser menor al primero")
            }
            else{
                alert(`el resultado de la operacion es: ${n1 % n2}`)
            }
        }
    }
}
