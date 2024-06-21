import { createContext } from "react";
import { IProject, ISheetObject } from "@theatre/core";
import { IStudio } from "@theatre/studio";
import { GizmoTheme } from "./types";

export const theatreContext = createContext<{
  project: IProject;
  studio?: IStudio;
  gizmoTheme: GizmoTheme;
  registerGizmoTarget: (
    sheetObject: ISheetObject<any>,
    target: HTMLElement
  ) => () => void;
  selectedObject: ISheetObject | null;
}>(null!);
