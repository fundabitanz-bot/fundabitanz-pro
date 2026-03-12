
export interface FAQItem {
    keywords: string[];
    question: string;
    answer: string;
    actionLabel?: string;
    actionView?: string;
}

export const SGI_KNOWLEDGE_BASE: Record<string, FAQItem[]> = {
    'GLOBAL': [
        {
            keywords: ['clave', 'contraseña', 'password', 'acceso', 'entrar'],
            question: "¿Problemas con tu clave de acceso?",
            answer: "Si olvidaste tu clave o necesitas cambiarla, contacta al Coordinador Municipal o al Administrador del Sistema. Ellos pueden generar una nueva credencial desde el módulo de Usuarios.",
        },
        {
            keywords: ['internet', 'wifi', 'conexión', 'offline'],
            question: "¿El sistema funciona sin internet?",
            answer: "Sí. SGI V10 está diseñado con tecnología 'Offline-First'. Puedes trabajar normalmente sin internet. Cuando recuperes la conexión, el sistema sincronizará los datos automáticamente con el servidor central.",
        },
        {
            keywords: ['soporte', 'ayuda', 'error', 'falla'],
            question: "¿Cómo reportar una falla técnica?",
            answer: "Utiliza el módulo de MENSAJERÍA. Redacta un mensaje nuevo, selecciona 'SOPORTE TÉCNICO' como destino y describe tu problema. Un ingeniero atenderá tu solicitud.",
            actionLabel: "Ir a Mensajería",
            actionView: "mensajeria"
        }
    ],
    'planteles': [
        {
            keywords: ['crear', 'nuevo', 'registrar', 'plantel', 'institución'],
            question: "¿Cómo registro un nuevo plantel?",
            answer: "En la pantalla 'PLANTELES', busca el botón azul 'REGISTRAR PLANTEL' en la parte superior derecha. Llena la ficha técnica completa: Identificación, Director, Niveles y Ubicación.",
        },
        {
            keywords: ['editar', 'modificar', 'corregir', 'datos'],
            question: "¿Cómo edito los datos de una escuela?",
            answer: "Busca la escuela en la lista. Haz clic en el botón del 'Lápiz' (Editar) en la tarjeta del plantel. Recuerda guardar los cambios al finalizar.",
        },
        {
            keywords: ['mapa', 'coordenadas', 'ubicación', 'gps'],
            question: "¿Cómo cargo las coordenadas GPS?",
            answer: "Al editar un plantel, ve a la sección de 'Ubicación'. Haz clic en el botón 'MAPA SATELITAL'. Se abrirá una ventana donde podrás pinchar el punto exacto de la escuela para capturar latitud y longitud automáticamente.",
        }
    ],
    'rac': [
        {
            keywords: ['cargar', 'personal', 'docente', 'obrero', 'administrativo'],
            question: "¿Cómo cargo la nómina RAC?",
            answer: "Selecciona primero el plantel en el filtro superior. Luego llena el formulario con la Cédula del funcionario. El sistema validará si ya existe. Completa los datos de cargo, función y carga horaria.",
        },
        {
            keywords: ['foto', 'imagen', 'perfil'],
            question: "¿Es obligatorio subir la foto?",
            answer: "Es altamente recomendable para el expediente digital, pero no bloquea el registro. Puedes subirla después editando la ficha del trabajador.",
        },
        {
            keywords: ['borrar', 'eliminar', 'egreso'],
            question: "¿Cómo retiro a alguien de la nómina?",
            answer: "En la tabla de personal inferior, busca al funcionario y haz clic en el ícono de 'Papelera'. Confirma la acción. Esto lo eliminará de la nómina activa de ese plantel.",
        }
    ],
    'matricula': [
        {
            keywords: ['inicial', 'primaria', 'media', 'cargar'],
            question: "¿Cómo cargo la matrícula?",
            answer: "Selecciona el plantel y luego el Nivel Educativo (ej. Primaria). Ingresa la cantidad de SECCIONES y luego desglosa los alumnos por sexo (Femenino/Masculino).",
        },
        {
            keywords: ['error', 'nivel', 'no aparece'],
            question: "¿No aparece el nivel que necesito?",
            answer: "Si no ves un nivel (ej. Media General) en la lista, es porque no está activado en la Ficha del Plantel. Ve al módulo 'PLANTELES', edita la institución y marca el nivel correspondiente.",
            actionLabel: "Ir a Planteles",
            actionView: "planteles"
        }
    ],
    'fede': [
        {
            keywords: ['bricomiles', 'reparación', 'pintura', 'techo'],
            question: "¿Cómo reportar trabajos de Bricomiles?",
            answer: "En el módulo FEDE, ve a la sección 4 'Bricomiles y Proyectos'. Activa la casilla '¿Abordaje por Bricomiles?' e ingresa la fecha y descripción de los trabajos realizados.",
        },
        {
            keywords: ['agua', 'luz', 'electricidad', 'servicios'],
            question: "¿Dónde cargo los servicios públicos?",
            answer: "En la sección 2 de la ficha FEDE: 'Servicios Básicos'. Allí puedes detallar el estado del agua, electricidad, gas y aseo urbano.",
        }
    ],
    'cuadratura': [
        {
            keywords: ['automatica', 'sincronizar', 'rac'],
            question: "¿Cómo funciona la sincronización automática?",
            answer: "El sistema puede llenar la cuadratura automáticamente usando los datos del RAC. Haz clic en el botón 'SINCRONIZAR AUTOMÁTICAMENTE'. Esto traerá a todos los docentes cargados en el RAC que correspondan al nivel seleccionado.",
        },
        {
            keywords: ['formato', 'hoja', 'tipo'],
            question: "¿Qué formato debo usar?",
            answer: "Depende del nivel: Hoja 1 para Inicial/Primaria. Hoja 2 para Especial. Hoja 3/4 para Media General/Técnica. Hoja 5 para Adultos. Selecciona la pestaña correcta arriba.",
        }
    ]
};
