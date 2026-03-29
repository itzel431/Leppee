export const CATEGORIAS = {
  abecedario: {
    nombre: 'Abecedario',
    emoji: '🔤',
    color: ['#f43f8e', '#db2777'],
    senas: {
      'A': {
        nombre: 'Letra A',
        descripcion: 'Puño cerrado, pulgar al lado',
        // Puntos clave MediaPipe: dedos cerrados, pulgar extendido lateral
        patron: {
          dedos_extendidos: [],
          pulgar_arriba: false,
          pulgar_lateral: true,
        }
      },
      'B': {
        nombre: 'Letra B',
        descripcion: 'Cuatro dedos juntos arriba, pulgar doblado',
        patron: {
          dedos_extendidos: ['indice', 'medio', 'anular', 'menique'],
          pulgar_arriba: false,
          pulgar_lateral: false,
        }
      },
      'C': {
        nombre: 'Letra C',
        descripcion: 'Mano en forma de C',
        patron: {
          dedos_extendidos: ['indice', 'medio', 'anular', 'menique'],
          forma: 'curva',
        }
      },
      'D': {
        nombre: 'Letra D',
        descripcion: 'Índice arriba, otros dedos tocan pulgar',
        patron: { dedos_extendidos: ['indice'] }
      },
      'E': {
        nombre: 'Letra E',
        descripcion: 'Dedos doblados, uñas hacia abajo',
        patron: { dedos_extendidos: [], forma: 'garra' }
      },
      'F': {
        nombre: 'Letra F',
        descripcion: 'Índice y pulgar forman círculo',
        patron: { dedos_extendidos: ['medio', 'anular', 'menique'] }
      },
      'G': {
        nombre: 'Letra G',
        descripcion: 'Índice y pulgar apuntan horizontal',
        patron: { dedos_extendidos: ['indice'], orientacion: 'horizontal' }
      },
      'H': {
        nombre: 'Letra H',
        descripcion: 'Índice y medio juntos apuntan horizontal',
        patron: { dedos_extendidos: ['indice', 'medio'], orientacion: 'horizontal' }
      },
      'I': {
        nombre: 'Letra I',
        descripcion: 'Meñique extendido hacia arriba',
        patron: { dedos_extendidos: ['menique'] }
      },
      'J': {
        nombre: 'Letra J',
        descripcion: 'Meñique dibuja J en el aire',
        patron: { dedos_extendidos: ['menique'], movimiento: true }
      },
      'K': {
        nombre: 'Letra K',
        descripcion: 'Índice y medio en V, pulgar entre ellos',
        patron: { dedos_extendidos: ['indice', 'medio'], pulgar_lateral: true }
      },
      'L': {
        nombre: 'Letra L',
        descripcion: 'Índice arriba, pulgar hacia el lado — forma L',
        patron: { dedos_extendidos: ['indice'], pulgar_arriba: false, pulgar_lateral: true }
      },
      'M': {
        nombre: 'Letra M',
        descripcion: 'Tres dedos sobre el pulgar',
        patron: { dedos_extendidos: [], forma: 'M' }
      },
      'N': {
        nombre: 'Letra N',
        descripcion: 'Dos dedos sobre el pulgar',
        patron: { dedos_extendidos: [], forma: 'N' }
      },
      'O': {
        nombre: 'Letra O',
        descripcion: 'Todos los dedos forman O con el pulgar',
        patron: { dedos_extendidos: [], forma: 'O' }
      },
      'P': {
        nombre: 'Letra P',
        descripcion: 'Como G pero apuntando hacia abajo',
        patron: { dedos_extendidos: ['indice'], orientacion: 'abajo' }
      },
      'Q': {
        nombre: 'Letra Q',
        descripcion: 'Como G pero pulgar e índice hacia abajo',
        patron: { dedos_extendidos: ['indice'], orientacion: 'abajo', pulgar_lateral: true }
      },
      'R': {
        nombre: 'Letra R',
        descripcion: 'Índice y medio cruzados',
        patron: { dedos_extendidos: ['indice', 'medio'], cruzados: true }
      },
      'S': {
        nombre: 'Letra S',
        descripcion: 'Puño cerrado con pulgar sobre dedos',
        patron: { dedos_extendidos: [], pulgar_sobre: true }
      },
      'T': {
        nombre: 'Letra T',
        descripcion: 'Pulgar entre índice y medio',
        patron: { dedos_extendidos: [], pulgar_entre: true }
      },
      'U': {
        nombre: 'Letra U',
        descripcion: 'Índice y medio juntos hacia arriba',
        patron: { dedos_extendidos: ['indice', 'medio'] }
      },
      'V': {
        nombre: 'Letra V',
        descripcion: 'Índice y medio en V',
        patron: { dedos_extendidos: ['indice', 'medio'], separados: true }
      },
      'W': {
        nombre: 'Letra W',
        descripcion: 'Índice, medio y anular en W',
        patron: { dedos_extendidos: ['indice', 'medio', 'anular'] }
      },
      'X': {
        nombre: 'Letra X',
        descripcion: 'Índice doblado en gancho',
        patron: { dedos_extendidos: [], forma: 'gancho' }
      },
      'Y': {
        nombre: 'Letra Y',
        descripcion: 'Pulgar y meñique extendidos',
        patron: { dedos_extendidos: ['menique'], pulgar_lateral: true }
      },
      'Z': {
        nombre: 'Letra Z',
        descripcion: 'Índice dibuja Z en el aire',
        patron: { dedos_extendidos: ['indice'], movimiento: true }
      },
    }
  },

  numeros: {
    nombre: 'Números',
    emoji: '🔢',
    color: ['#a855f7', '#9333ea'],
    senas: {
      '0': { nombre: 'Cero', descripcion: 'Forma de O con todos los dedos', patron: { forma: 'O' } },
      '1': { nombre: 'Uno', descripcion: 'Solo índice extendido', patron: { dedos_extendidos: ['indice'] } },
      '2': { nombre: 'Dos', descripcion: 'Índice y medio en V', patron: { dedos_extendidos: ['indice', 'medio'], separados: true } },
      '3': { nombre: 'Tres', descripcion: 'Pulgar, índice y medio', patron: { dedos_extendidos: ['indice', 'medio'], pulgar_lateral: true } },
      '4': { nombre: 'Cuatro', descripcion: 'Cuatro dedos extendidos', patron: { dedos_extendidos: ['indice', 'medio', 'anular', 'menique'] } },
      '5': { nombre: 'Cinco', descripcion: 'Mano abierta completa', patron: { dedos_extendidos: ['indice', 'medio', 'anular', 'menique'], pulgar_lateral: true } },
      '6': { nombre: 'Seis', descripcion: 'Meñique y pulgar extendidos', patron: { dedos_extendidos: ['menique'], pulgar_lateral: true } },
      '7': { nombre: 'Siete', descripcion: 'Anular y pulgar se tocan', patron: { dedos_extendidos: ['indice', 'medio', 'menique'] } },
      '8': { nombre: 'Ocho', descripcion: 'Medio y pulgar se tocan', patron: { dedos_extendidos: ['indice', 'anular', 'menique'] } },
      '9': { nombre: 'Nueve', descripcion: 'Índice y pulgar forman aro', patron: { dedos_extendidos: ['medio', 'anular', 'menique'] } },
    }
  },

  saludos: {
    nombre: 'Saludos',
    emoji: '👋',
    color: ['#fb923c', '#ea580c'],
    senas: {
      'Hola': { nombre: 'Hola', descripcion: 'Mano abierta moviéndose de lado a lado', patron: { movimiento: true, dedos_extendidos: ['indice','medio','anular','menique'] } },
      'Adiós': { nombre: 'Adiós', descripcion: 'Mano abierta moviéndose hacia abajo', patron: { movimiento: true } },
      'Buenos días': { nombre: 'Buenos días', descripcion: 'Mano sube desde la barbilla', patron: { movimiento: true } },
      'Buenas noches': { nombre: 'Buenas noches', descripcion: 'Mano baja hacia el pecho', patron: { movimiento: true } },
      'Por favor': { nombre: 'Por favor', descripcion: 'Mano abierta en círculo sobre el pecho', patron: { movimiento: true } },
      'Gracias': { nombre: 'Gracias', descripcion: 'Mano toca la barbilla y se extiende', patron: { movimiento: true } },
      'De nada': { nombre: 'De nada', descripcion: 'Manos abiertas hacia arriba', patron: { movimiento: true } },
      'Sí': { nombre: 'Sí', descripcion: 'Puño asintiendo hacia abajo', patron: { movimiento: true, forma: 'puno' } },
      'No': { nombre: 'No', descripcion: 'Índice y medio moviéndose horizontalmente', patron: { movimiento: true, dedos_extendidos: ['indice','medio'] } },
      'Lo siento': { nombre: 'Lo siento', descripcion: 'Puño en círculo sobre el pecho', patron: { movimiento: true } },
      'Ayuda': { nombre: 'Ayuda', descripcion: 'Pulgar arriba sobre palma abierta sube', patron: { movimiento: true, pulgar_arriba: true } },
      'Nombre': { nombre: '¿Cómo te llamas?', descripcion: 'Dedos en H golpean hacia afuera', patron: { movimiento: true } },
    }
  },

  familia: {
    nombre: 'Familia',
    emoji: '👨‍👩‍👧',
    color: ['#34d399', '#059669'],
    senas: {
      'Mamá': { nombre: 'Mamá', descripcion: 'Pulgar toca la barbilla', patron: { pulgar_arriba: true, contacto: 'barbilla' } },
      'Papá': { nombre: 'Papá', descripcion: 'Pulgar toca la frente', patron: { pulgar_arriba: true, contacto: 'frente' } },
      'Hermano': { nombre: 'Hermano', descripcion: 'L en la frente luego junto', patron: { movimiento: true } },
      'Hermana': { nombre: 'Hermana', descripcion: 'L en la mejilla luego junto', patron: { movimiento: true } },
      'Abuelo': { nombre: 'Abuelo', descripcion: 'Mano abierta en la frente abre', patron: { movimiento: true } },
      'Abuela': { nombre: 'Abuela', descripcion: 'Mano abierta en la mejilla abre', patron: { movimiento: true } },
      'Hijo': { nombre: 'Hijo', descripcion: 'Mano mece bebé luego baja', patron: { movimiento: true } },
      'Hija': { nombre: 'Hija', descripcion: 'Mano mece bebé luego baja (femenino)', patron: { movimiento: true } },
      'Bebé': { nombre: 'Bebé', descripcion: 'Brazos mecen imaginando bebé', patron: { movimiento: true } },
      'Familia': { nombre: 'Familia', descripcion: 'F con ambas manos formando círculo', patron: { movimiento: true } },
      'Esposo': { nombre: 'Esposo', descripcion: 'Mano toca la sien luego entrelaza', patron: { movimiento: true } },
      'Esposa': { nombre: 'Esposa', descripcion: 'Mano toca la mejilla luego entrelaza', patron: { movimiento: true } },
    }
  },

  colores: {
    nombre: 'Colores',
    emoji: '🎨',
    color: ['#f59e0b', '#d97706'],
    senas: {
      'Rojo': { nombre: 'Rojo', descripcion: 'Índice raspa el labio hacia abajo', patron: { movimiento: true, dedos_extendidos: ['indice'] } },
      'Azul': { nombre: 'Azul', descripcion: 'B sacudiendo la mano', patron: { movimiento: true } },
      'Verde': { nombre: 'Verde', descripcion: 'G sacudiendo la mano', patron: { movimiento: true } },
      'Amarillo': { nombre: 'Amarillo', descripcion: 'Y sacudiendo la mano', patron: { movimiento: true } },
      'Negro': { nombre: 'Negro', descripcion: 'Índice cruza la frente', patron: { movimiento: true, dedos_extendidos: ['indice'] } },
      'Blanco': { nombre: 'Blanco', descripcion: 'Mano abierta en el pecho se cierra', patron: { movimiento: true } },
      'Rosa': { nombre: 'Rosa', descripcion: 'Medio raspa el labio', patron: { movimiento: true, dedos_extendidos: ['medio'] } },
      'Morado': { nombre: 'Morado', descripcion: 'P sacudiendo hacia abajo', patron: { movimiento: true } },
      'Naranja': { nombre: 'Naranja', descripcion: 'Mano abre y cierra en la mejilla', patron: { movimiento: true } },
      'Café': { nombre: 'Café', descripcion: 'C baja por la mejilla', patron: { movimiento: true } },
      'Gris': { nombre: 'Gris', descripcion: 'Ambas manos abiertas se entrelazan', patron: { movimiento: true } },
      'Dorado': { nombre: 'Dorado', descripcion: 'G brilla hacia afuera', patron: { movimiento: true } },
    }
  },
};

// Lista plana de todas las señas para búsqueda rápida
export const TODAS_LAS_SENAS = Object.entries(CATEGORIAS).flatMap(
  ([catKey, cat]) => Object.entries(cat.senas).map(([key, sena]) => ({
    ...sena,
    key,
    categoria: catKey,
    categoriaNombre: cat.nombre,
    categoriaEmoji: cat.emoji,
    categoriaColor: cat.color,
  }))
);