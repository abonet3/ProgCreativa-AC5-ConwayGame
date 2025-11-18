AC3 - Waac Woooc

Este sketch simula una groan tube utilizando el acelerómetro del móvil y síntesis de sonido con p5.sound. El usuario activa el movimiento y el audio desde la interfaz, y a partir de ahí puede “tocar” el instrumento moviendo el teléfono.

La bola representa el estado del movimiento dentro del cuadrado:
 - La posición X modifica el pitch.
 - La posición Y controla el brillo mediante un filtro.
 - La velocidad de la bola determina la amplitud.

El objetivo ha sido crear un comportamiento sonoro continuo y expresivo sin saltos bruscos. He aplicado suavizados y mapeos progresivos para que la relación entre movimiento y sonido resulte natural y fácil de controlar.