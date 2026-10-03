/** Complete user-visible and assistive text rendered by Nuxt Photo. */
export interface PhotoLabels {
  photoViewer: string
  previous: string
  next: string
  zoom: string
  fit: string
  close: string
  loadFailed: string
  previousSlide: string
  nextSlide: string
  pauseAutoplay: string
  playAutoplay: string
  goToSlide: (index: number) => string
  viewPhoto: (index: number) => string
  slideStatus: (index: number, count: number) => string
}

export const PHOTO_LOCALES = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pt', 'ar', 'he'] as const
export type PhotoLocale = (typeof PHOTO_LOCALES)[number]

function labels(
  values: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ],
): Readonly<PhotoLabels> {
  const [
    photoViewer,
    previous,
    next,
    zoom,
    fit,
    close,
    loadFailed,
    previousSlide,
    nextSlide,
    pauseAutoplay,
    playAutoplay,
    goToSlide,
    viewPhoto,
    slideStatus,
  ] = values
  return Object.freeze({
    photoViewer: photoViewer,
    previous: previous,
    next: next,
    zoom: zoom,
    fit: fit,
    close: close,
    loadFailed: loadFailed,
    previousSlide: previousSlide,
    nextSlide: nextSlide,
    pauseAutoplay: pauseAutoplay,
    playAutoplay: playAutoplay,
    goToSlide: (index: number) => goToSlide.replaceAll('{index}', String(index)),
    viewPhoto: (index: number) => viewPhoto.replaceAll('{index}', String(index)),
    slideStatus: (index: number, count: number) =>
      slideStatus.replaceAll('{index}', String(index)).replaceAll('{count}', String(count)),
  })
}

export const PHOTO_LABELS: Readonly<Record<PhotoLocale, Readonly<PhotoLabels>>> = {
  en: labels([
    'Photo viewer',
    'Previous',
    'Next',
    'Zoom',
    'Fit',
    'Close',
    'Image could not be loaded.',
    'Previous slide',
    'Next slide',
    'Pause slideshow',
    'Play slideshow',
    'Go to slide {index}',
    'View photo {index}',
    'Slide {index} of {count}',
  ]),
  de: labels([
    'Bildbetrachter',
    'Zurück',
    'Weiter',
    'Vergrößern',
    'Einpassen',
    'Schließen',
    'Das Bild konnte nicht geladen werden.',
    'Vorheriges Bild',
    'Nächstes Bild',
    'Diashow pausieren',
    'Diashow starten',
    'Zu Bild {index}',
    'Foto {index} ansehen',
    'Bild {index} von {count}',
  ]),
  fr: labels([
    'Visionneuse de photos',
    'Précédent',
    'Suivant',
    'Agrandir',
    'Ajuster',
    'Fermer',
    'Impossible de charger l’image.',
    'Diapositive précédente',
    'Diapositive suivante',
    'Mettre le diaporama en pause',
    'Lancer le diaporama',
    'Aller à la diapositive {index}',
    'Voir la photo {index}',
    'Diapositive {index} sur {count}',
  ]),
  es: labels([
    'Visor de fotos',
    'Anterior',
    'Siguiente',
    'Ampliar',
    'Ajustar',
    'Cerrar',
    'No se pudo cargar la imagen.',
    'Diapositiva anterior',
    'Diapositiva siguiente',
    'Pausar presentación',
    'Iniciar presentación',
    'Ir a la diapositiva {index}',
    'Ver foto {index}',
    'Diapositiva {index} de {count}',
  ]),
  it: labels([
    'Visualizzatore di foto',
    'Precedente',
    'Successivo',
    'Ingrandisci',
    'Adatta',
    'Chiudi',
    'Impossibile caricare l’immagine.',
    'Diapositiva precedente',
    'Diapositiva successiva',
    'Metti in pausa la presentazione',
    'Avvia la presentazione',
    'Vai alla diapositiva {index}',
    'Visualizza foto {index}',
    'Diapositiva {index} di {count}',
  ]),
  nl: labels([
    'Fotoviewer',
    'Vorige',
    'Volgende',
    'Inzoomen',
    'Passend maken',
    'Sluiten',
    'De afbeelding kon niet worden geladen.',
    'Vorige dia',
    'Volgende dia',
    'Diavoorstelling pauzeren',
    'Diavoorstelling starten',
    'Ga naar dia {index}',
    'Foto {index} bekijken',
    'Dia {index} van {count}',
  ]),
  pt: labels([
    'Visualizador de fotos',
    'Anterior',
    'Seguinte',
    'Ampliar',
    'Ajustar',
    'Fechar',
    'Não foi possível carregar a imagem.',
    'Diapositivo anterior',
    'Diapositivo seguinte',
    'Pausar apresentação',
    'Iniciar apresentação',
    'Ir para o diapositivo {index}',
    'Ver foto {index}',
    'Diapositivo {index} de {count}',
  ]),
  ar: labels([
    'عارض الصور',
    'السابق',
    'التالي',
    'تكبير',
    'ملاءمة',
    'إغلاق',
    'تعذر تحميل الصورة.',
    'الشريحة السابقة',
    'الشريحة التالية',
    'إيقاف عرض الشرائح مؤقتًا',
    'تشغيل عرض الشرائح',
    'الانتقال إلى الشريحة {index}',
    'عرض الصورة {index}',
    'الشريحة {index} من {count}',
  ]),
  he: labels([
    'מציג תמונות',
    'הקודם',
    'הבא',
    'הגדלה',
    'התאמה',
    'סגירה',
    'לא ניתן לטעון את התמונה.',
    'השקופית הקודמת',
    'השקופית הבאה',
    'השהיית מצגת',
    'הפעלת מצגת',
    'מעבר לשקופית {index}',
    'הצגת תמונה {index}',
    'שקופית {index} מתוך {count}',
  ]),
}
export const DEFAULT_PHOTO_LABELS = PHOTO_LABELS.en

export function detectPhotoLocale(language?: string): PhotoLocale {
  const code = (
    language ?? (typeof document === 'undefined' ? 'en' : document.documentElement.lang)
  )
    .toLowerCase()
    .split('-')[0]
  return PHOTO_LOCALES.find((locale) => locale === code) ?? 'en'
}

export function resolvePhotoLabels(
  partial?: PhotoLocale | Partial<PhotoLabels>,
  locale = detectPhotoLocale(),
): PhotoLabels {
  const result = { ...PHOTO_LABELS[typeof partial === 'string' ? partial : locale] }
  if (partial && typeof partial !== 'string') {
    for (const key of Object.keys(result) as Array<keyof PhotoLabels>) {
      if (partial[key] !== undefined) Object.assign(result, { [key]: partial[key] })
    }
  }
  return result
}
