import type { ISheetObject } from "@theatre/core";
import { MotionValue } from "framer-motion";

export type GizmoTheme = {
  normalColor: string;
  selectedColor: string;
  width: number;
  fillOpacity: number;
};

export type GizmoOptions = Partial<{
  zIndex: number;
  ignoreComputedZIndex: boolean;
  translate: {
    x?: MotionValue<number>;
    y?: MotionValue<number>;
    strength?: number;
  };
}>;

export type GizmoTarget = {
  sheetObject: ISheetObject<any>;
  target: HTMLElement;
  options: GizmoOptions;
  axesMap: {
    translate: {
      x: string | null;
      y: string | null;
    };
  };
};
