"use client";

// itc-frontend-base no incluye la directiva "use client" en su build, pero sus
// componentes usan hooks internamente (estado, efectos). Este archivo es el límite
// cliente recomendado por Next.js para librerías de terceros sin esa directiva:
// https://nextjs.org/docs/app/getting-started/server-and-client-components#third-party-components
// Importa siempre desde aquí (@/components/itc), nunca directo desde "itc-frontend-base",
// para poder usarlos tanto en Server Components como en Client Components.
export {
  ItcButton,
  ItcButtonCard,
  ItcModal,
  ItcTable,
  ItcTabs,
  ItcInput,
  ItcForm,
  ItcBanner,
  ItcCarousel,

  ItcDateRangePicker,
} from "itc-frontend-base";

export type {
  ButtonProps,
  ButtonCardProps,
  ModalProps,
  TableProps,
  TableColumn,
  TabsProps,
  InputProps,
  FormProps,
  BannerProps,
  CarouselProps,
  CarouselImage,
  CarouselEffect,
  CarouselContentPosition,
  AccessibilityToolbarProps,
  AccessibilityToolbarPosition,
  AccessibilityButtonConfig,
  SocialLink,
} from "itc-frontend-base";

// Nota: "Menu" existe compilado dentro del paquete pero el punto de entrada raíz
// de itc-frontend-base@1.1.3 no lo re-exporta (su package.json "exports" solo
// define "." y "./style.css"), así que ItcMenu no es importable todavía.
// "Header" y "Footer" tampoco existen en esta versión pese a estar listados como
// disponibles. Hay que pedirle al equipo de la librería que los publique/expongan.
//
// "DateRangePickerProps" tampoco se re-exporta desde la raíz (el index.d.ts del
// paquete solo re-exporta el componente, no su archivo de tipos), así que no hay
// forma de importar ese tipo hoy; usa los props de ItcDateRangePicker por inferencia.
