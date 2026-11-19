// Original LextroSpeak content from the approved prototype (vocabulary, chants, topics).
// Seeded into the library as published resources so existing activities stay available.

export const SEED_TOPICS: Array<{ id: string; title: string; es: string; color: string; noun: string; nounEs: string; write: string[]; bonus: string[]; hide: string[] }> = [
  { id: 'greetings', title: 'Greetings', es: 'Los saludos',  color: '#FFC93C', noun: 'greeting', nounEs: 'saludo',
    write: ['Write the greeting in Spanish.', 'Escribe el saludo en español.'],
    bonus: ['Me llamo', 'My name is …'], hide: [] },
  { id: 'numbers',   title: 'Numbers',   es: 'Los números',  color: '#4CB8F5', noun: 'number', nounEs: 'número',
    write: ['Count the dots. Write the number in Spanish.', 'Cuenta los puntos. Escribe el número en español.'],
    bonus: ['Tengo ___ años', 'I am … years old'], hide: [] },
  { id: 'colors',    title: 'Colors',    es: 'Los colores',  color: '#F7A6CB', noun: 'color', nounEs: 'color',
    write: ['Write the color in Spanish.', 'Escribe el color en español.'],
    bonus: ['Mi color favorito es', 'My favorite color is …'], hide: [] },
  { id: 'shapes',    title: 'Shapes',    es: 'Las figuras',  color: '#3DD6A3', noun: 'shape', nounEs: 'figura',
    write: ['Write the shape with el or la.', 'Escribe la figura con el o la.'],
    bonus: ['Mi figura favorita es', 'My favorite shape is …'], hide: [] },
  { id: 'animals',   title: 'Animals',   es: 'Los animales', color: '#FF9F5A', noun: 'animal', nounEs: 'animal',
    write: ['Write the Spanish word with el or la.', 'Escribe la palabra con el o la.'],
    bonus: ['Mi animal favorito es', 'My favorite animal is …'], hide: [] },
];

export const SEED_VOCAB: Record<string, Array<{ id: string; es: string; en: string }>> = {
  greetings: [
    { id: 'hola',         es: 'hola',          en: 'hello' },
    { id: 'adios',        es: 'adiós',         en: 'goodbye' },
    { id: 'buenosdias',   es: 'buenos días',   en: 'good morning' },
    { id: 'buenastardes', es: 'buenas tardes', en: 'good afternoon' },
    { id: 'buenasnoches', es: 'buenas noches', en: 'good night' },
    { id: 'comoestas',    es: '¿cómo estás?',  en: 'how are you?' },
    { id: 'muybien',      es: 'muy bien',      en: 'very well' },
    { id: 'gracias',      es: 'gracias',       en: 'thank you' },
  ],
  numbers: [
    { id: '1', es: 'uno', en: 'one' }, { id: '2', es: 'dos', en: 'two' }, { id: '3', es: 'tres', en: 'three' },
    { id: '4', es: 'cuatro', en: 'four' }, { id: '5', es: 'cinco', en: 'five' }, { id: '6', es: 'seis', en: 'six' },
    { id: '7', es: 'siete', en: 'seven' }, { id: '8', es: 'ocho', en: 'eight' }, { id: '9', es: 'nueve', en: 'nine' },
    { id: '10', es: 'diez', en: 'ten' },
  ],
  colors: [
    { id: 'rojo', es: 'rojo', en: 'red' }, { id: 'azul', es: 'azul', en: 'blue' },
    { id: 'amarillo', es: 'amarillo', en: 'yellow' }, { id: 'verde', es: 'verde', en: 'green' },
    { id: 'anaranjado', es: 'anaranjado', en: 'orange' }, { id: 'morado', es: 'morado', en: 'purple' },
    { id: 'rosado', es: 'rosado', en: 'pink' }, { id: 'cafe', es: 'café', en: 'brown' },
  ],
  shapes: [
    { id: 'circulo', es: 'el círculo', en: 'the circle' }, { id: 'cuadrado', es: 'el cuadrado', en: 'the square' },
    { id: 'triangulo', es: 'el triángulo', en: 'the triangle' }, { id: 'rectangulo', es: 'el rectángulo', en: 'the rectangle' },
    { id: 'estrella', es: 'la estrella', en: 'the star' }, { id: 'corazon', es: 'el corazón', en: 'the heart' },
    { id: 'ovalo', es: 'el óvalo', en: 'the oval' }, { id: 'rombo', es: 'el rombo', en: 'the diamond' },
  ],
  animals: [
    { id: 'perro',    es: 'el perro',    en: 'the dog' },
    { id: 'oveja',    es: 'la oveja',    en: 'the sheep' },
    { id: 'tigre',    es: 'el tigre',    en: 'the tiger' },
    { id: 'capibara', es: 'la capibara', en: 'the capybara' },
    { id: 'conejo',   es: 'el conejo',   en: 'the rabbit' },
    { id: 'tortuga',  es: 'la tortuga',  en: 'the turtle' },
    { id: 'delfin',   es: 'el delfín',   en: 'the dolphin' },
    { id: 'panda',    es: 'el panda',    en: 'the panda' },
  ],
};

export const SEED_CHANT: Record<string, Array<{ q: string; a: string; art: string; en: string }>> = {
  greetings: [
    { q: 'Llego a la escuela,', a: '¡Hola, hola, amigos!', art: 'hola', en: 'I get to school: hello, hello, friends!' },
    { q: 'Por la mañana,', a: '¡Buenos días, buenos días!', art: 'buenosdias', en: 'In the morning: good morning!' },
    { q: 'Por la tarde,', a: '¡Buenas tardes, buenas tardes!', art: 'buenastardes', en: 'In the afternoon: good afternoon!' },
    { q: 'Por la noche,', a: '¡Buenas noches, a dormir!', art: 'buenasnoches', en: 'At night: good night, time to sleep!' },
    { q: '¿Cómo estás?', a: '¡Muy bien, muy bien!', art: 'comoestas', en: 'How are you? Very well!' },
    { q: 'Me das un abrazo,', a: '¡Gracias, gracias!', art: 'gracias', en: 'You give me a hug: thank you!' },
    { q: 'Me voy a casa,', a: '¡Adiós, hasta mañana!', art: 'adios', en: 'I go home: goodbye, see you tomorrow!' },
  ],
  numbers: [
    { q: 'Uno, dos, tres,', a: '¡aplaude otra vez!', art: '3', en: 'One, two, three, clap again!' },
    { q: 'Cuatro, cinco, seis,', a: '¡toca tus pies!', art: '6', en: 'Four, five, six, touch your feet!' },
    { q: 'Siete, ocho, nueve,', a: '¡la mano se mueve!', art: '9', en: 'Seven, eight, nine, wave your hand!' },
    { q: 'Y el número diez…', a: '¡a contar otra vez!', art: '10', en: 'And number ten… let’s count again!' },
  ],
  colors: [
    { q: 'Rojo, rojo,', a: 'como una fresa.', art: 'rojo', en: 'Red, red, like a strawberry.' },
    { q: 'Amarillo, amarillo,', a: 'como el sol.', art: 'amarillo', en: 'Yellow, yellow, like the sun.' },
    { q: 'Verde, verde,', a: 'como una hoja.', art: 'verde', en: 'Green, green, like a leaf.' },
    { q: 'Azul, azul,', a: 'como el mar.', art: 'azul', en: 'Blue, blue, like the sea.' },
    { q: 'Anaranjado,', a: 'como una naranja.', art: 'anaranjado', en: 'Orange, like an orange.' },
    { q: 'Morado, morado,', a: 'como las uvas.', art: 'morado', en: 'Purple, purple, like grapes.' },
    { q: 'Rosado, rosado,', a: 'como un flamenco.', art: 'rosado', en: 'Pink, pink, like a flamingo.' },
    { q: 'Café, café,', a: 'como el chocolate.', art: 'cafe', en: 'Brown, brown, like chocolate.' },
  ],
  shapes: [
    { q: 'El círculo es redondo,', a: 'como una pelota.', art: 'circulo', en: 'The circle is round, like a ball.' },
    { q: 'El cuadrado tiene cuatro lados:', a: '¡uno, dos, tres, cuatro!', art: 'cuadrado', en: 'The square has four sides.' },
    { q: 'El triángulo tiene tres lados:', a: '¡uno, dos, tres!', art: 'triangulo', en: 'The triangle has three sides.' },
    { q: 'El rectángulo es largo,', a: 'como una puerta.', art: 'rectangulo', en: 'The rectangle is long, like a door.' },
    { q: 'La estrella brilla', a: 'en el cielo.', art: 'estrella', en: 'The star shines in the sky.' },
    { q: 'El corazón dice:', a: '¡te quiero!', art: 'corazon', en: 'The heart says: I love you!' },
    { q: 'El óvalo es', a: 'como un huevo.', art: 'ovalo', en: 'The oval is like an egg.' },
    { q: 'El rombo es', a: 'como una cometa.', art: 'rombo', en: 'The diamond is like a kite.' },
  ],
  animals: [
    { q: '¿Qué animal es?', a: '¡Es el perro! Guau, guau.', art: 'perro', en: 'It’s the dog! Woof, woof.' },
    { q: '¿Qué animal es?', a: '¡Es la oveja! Bee, bee.', art: 'oveja', en: 'It’s the sheep! Baa, baa.' },
    { q: '¿Qué animal es?', a: '¡Es el tigre! Grrr, grrr.', art: 'tigre', en: 'It’s the tiger! Grrr.' },
    { q: '¿Qué animal es?', a: '¡Es la capibara! Ñam, ñam.', art: 'capibara', en: 'It’s the capybara! Munch, munch.' },
    { q: '¿Qué animal es?', a: '¡Es el conejo! Salta, salta.', art: 'conejo', en: 'It’s the rabbit! Hop, hop.' },
    { q: '¿Qué animal es?', a: '¡Es la tortuga! Despacio, despacio.', art: 'tortuga', en: 'It’s the turtle! Slowly, slowly.' },
    { q: '¿Qué animal es?', a: '¡Es el delfín! Nada, nada.', art: 'delfin', en: 'It’s the dolphin! Swim, swim.' },
    { q: '¿Qué animal es?', a: '¡Es el panda! Come bambú.', art: 'panda', en: 'It’s the panda! It eats bamboo.' },
  ],
};
