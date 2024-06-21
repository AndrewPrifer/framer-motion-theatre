import { createContext } from "react";
import { ISheet } from "@theatre/core";

export const theatreComponentContext = createContext<{
  sheet: ISheet;
}>(null!);
