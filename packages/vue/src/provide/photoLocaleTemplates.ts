import type { PHOTO_LOCALES } from './labelTypes'

/** One value per `EAGER_LABEL_KEYS` entry, in that order. */
export type PhotoLabelTemplates = readonly [string, string, string, string, string, string, string]

// Labels a closed album or carousel shows. The viewer's labels live in viewerLocaleTemplates.
// Nuxt replaces this catalog with the app's build-time selection. Vue retains all locales.
export default {
  en: [
    'Previous slide',
    'Next slide',
    'Pause slideshow',
    'Play slideshow',
    'Go to slide {index}',
    'View photo {index}',
    'Slide {index} of {count}',
  ],
  de: [
    'Vorheriges Bild',
    'Nächstes Bild',
    'Diashow pausieren',
    'Diashow starten',
    'Zu Bild {index}',
    'Foto {index} ansehen',
    'Bild {index} von {count}',
  ],
  fr: [
    'Diapositive précédente',
    'Diapositive suivante',
    'Mettre le diaporama en pause',
    'Lancer le diaporama',
    'Aller à la diapositive {index}',
    'Voir la photo {index}',
    'Diapositive {index} sur {count}',
  ],
  es: [
    'Diapositiva anterior',
    'Diapositiva siguiente',
    'Pausar la presentación',
    'Iniciar la presentación',
    'Ir a la diapositiva {index}',
    'Ver la foto {index}',
    'Diapositiva {index} de {count}',
  ],
  it: [
    'Diapositiva precedente',
    'Diapositiva successiva',
    'Metti in pausa la presentazione',
    'Avvia la presentazione',
    'Vai alla diapositiva {index}',
    'Visualizza la foto {index}',
    'Diapositiva {index} di {count}',
  ],
  nl: [
    'Vorige dia',
    'Volgende dia',
    'Diavoorstelling pauzeren',
    'Diavoorstelling starten',
    'Ga naar dia {index}',
    'Foto {index} bekijken',
    'Dia {index} van {count}',
  ],
  pt: [
    'Slide anterior',
    'Próximo slide',
    'Pausar a apresentação',
    'Iniciar a apresentação',
    'Ir para o slide {index}',
    'Ver a foto {index}',
    'Slide {index} de {count}',
  ],
  'pt-PT': [
    'Diapositivo anterior',
    'Diapositivo seguinte',
    'Pausar a apresentação',
    'Iniciar a apresentação',
    'Ir para o diapositivo {index}',
    'Ver a foto {index}',
    'Diapositivo {index} de {count}',
  ],
  ar: [
    'الشريحة السابقة',
    'الشريحة التالية',
    'إيقاف عرض الشرائح مؤقتًا',
    'تشغيل عرض الشرائح',
    'الانتقال إلى الشريحة {index}',
    'عرض الصورة {index}',
    'الشريحة {index} من {count}',
  ],
  he: [
    'השקופית הקודמת',
    'השקופית הבאה',
    'השהיית מצגת',
    'הפעלת מצגת',
    'מעבר לשקופית {index}',
    'הצגת תמונה {index}',
    'שקופית {index} מתוך {count}',
  ],
} satisfies Record<(typeof PHOTO_LOCALES)[number], PhotoLabelTemplates>
