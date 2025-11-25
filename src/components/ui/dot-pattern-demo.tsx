import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern";

export function DotPatternDemo() {
  return (
    <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background">
      <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-black dark:text-white">
        Dot Pattern
      </p>
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
        )}
      />
    </div>
  );
}

// Variantes de uso:

// 1. Patrón centrado con gradiente radial
export function DotPatternCentered() {
  return (
    <div className="relative h-full w-full">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
        )}
      />
    </div>
  );
}

// 2. Patrón en esquina superior derecha
export function DotPatternTopRight() {
  return (
    <div className="relative h-full w-full">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_top_right,white,transparent)]"
        )}
      />
    </div>
  );
}

// 3. Patrón en esquina inferior izquierda
export function DotPatternBottomLeft() {
  return (
    <div className="relative h-full w-full">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_bottom_left,white,transparent)]"
        )}
      />
    </div>
  );
}

// 4. Patrón con opacidad personalizada
export function DotPatternCustomOpacity() {
  return (
    <div className="relative h-full w-full">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "opacity-50",
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        )}
      />
    </div>
  );
}

// 5. Patrón de fondo completo sin máscara
export function DotPatternFullBackground() {
  return (
    <div className="relative h-full w-full">
      <DotPattern
        className="opacity-20"
      />
    </div>
  );
}
