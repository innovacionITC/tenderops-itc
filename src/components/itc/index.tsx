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
  ItcMenu,
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
  MenuProps,
  MenuItem,
} from "itc-frontend-base";

// Nota: "Header" y "Footer" figuran como disponibles en la librería pero no
// existen todavía en esta versión. Hay que pedirle al equipo de la librería
// que los publique/exponga.
//
// "DateRangePickerProps" tampoco se re-exporta desde la raíz (el index.d.ts del
// paquete solo re-exporta el componente, no su archivo de tipos), así que no hay
// forma de importar ese tipo hoy; usa los props de ItcDateRangePicker por inferencia.
//
// ItcMenu no tiene forma de marcar el ítem activo (sin prop selected/activeId,
// sin comparar contra la ruta actual, y `label` es `string` plano — no se puede
// estilizar por ítem). El resaltado de la ruta activa en app-shell.tsx se logra
// marcando el ícono del ítem activo con `data-nav-active` y apuntándole con
// `:has()` desde CSS global (ver .app-sidebar-menu en globals.css). Si una
// futura versión cambia el marcado interno (clases itc-menu-*, aria-expanded),
// ese CSS puede dejar de aplicar silenciosamente.
//
// Tampoco hay que pasarle `path` a los items: el componente renderiza un <a
// href> real sin preventDefault, lo que dispara una navegación de página
// completa además de llamar a onItemClick. La navegación se maneja solo por
// onItemClick + router.push.
//
// En ItcModal, `disabled` bloquea TODO el modal, no solo el botón de
// confirmar: deshabilita la X y Cancelar, e impide cerrar por ESC o backdrop
// (su handler interno de cierre hace `disabled || persistent || loading ||
// onClose()`). No usar `disabled` para validación de formularios — validar
// dentro del onConfirm — y pasarlo solo mientras hay una operación en curso.
