import type { ISheetObject } from "@theatre/core";

export type GizmoTheme = {
  normalColor: string;
  selectedColor: string;
  width: number;
  fillOpacity: number;
};

export type GizmoOptions = Partial<{
  zIndex: number;
  ignoreComputedZIndex?: boolean;
}>;

export type GizmoTarget = {
  sheetObject: ISheetObject<any>;
  target: HTMLElement;
  options: GizmoOptions;
};
