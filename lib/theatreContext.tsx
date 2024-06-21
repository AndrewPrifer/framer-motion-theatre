import { createContext } from "react";
import { IProject, ISheetObject } from "@theatre/core";
import { IStudio } from "@theatre/studio";
import { GizmoTarget, GizmoTheme } from "./types";

export const theatreContext = createContext<{
  project: IProject;
  studio?: IStudio;
  gizmoTheme: GizmoTheme;
  registerGizmoTarget: (gizmoTarget: GizmoTarget) => () => void;
  selectedObject: ISheetObject | null;
}>(null!);
