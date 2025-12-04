README - Conway Game
Aleix Bonet

Aquest projecte és una reinterpretació del Joc de la Vida de Conway, però convertit en una batalla entre 4 equips. Partia de la idea de mantenir intactes les regles originals, però trobar una forma més interactiva i divertida d’explorar com apareixen patrons emergents. Per això vaig decidir dividir el mapa en quadrants i donar a cada equip el seu territori, de manera que l’usuari ha de col·locar les peces amb una mica d’estratègia i no només de manera aleatòria. 

Les peces predefinides són patrons clàssics del Joc de la Vida (gliders, blocks, loafs, etc.) i m’ha agradat utilitzar-les perquè ja tenen un comportament propi. Un glider, per exemple, sempre es converteix en una mena de “projectil”, mentre que un block és una defensa estable. Tot això passa sense modificar les regles de Conway, cosa que fa que el joc funcioni a partir del mateix llenguatge del sistema original. També he fet el món "infinit" perquè els patrons no desapareguin en tocar el final de la pantalla, i així la simulació es manté viva més estona. 

Una altra part que m’ha semblat interessant és detectar quan el sistema entra en un estat estable o en un bucle. Quan això passa, el programa para la simulació i diu quin equip ha guanyat segons el nombre de cèl·lules vives. És una manera de donar-li un tancament natural i que la simulació tingui més sentit com a “partida”.

Visualment he intentat fer-ho simple: cada equip amb un color, una interfície lateral per controlar la simulació i unes línies suaus que marquen els quadrants. El que volia era que tot fos fàcil d’entendre i que la gràcia estigués en el moviment emergent de les peces. 

He utilitzat IA principalment per crear l'estructura inicial de com funcionen les bases del Joc de la Vida de Conway. També per consultar dubtes puntuals i per estructurar millor el codi, però totes les decisions del projecte les he anat entenent i adaptant perquè s’alineïn amb el sketch final que tenia pensat. 

Link Vercel: 