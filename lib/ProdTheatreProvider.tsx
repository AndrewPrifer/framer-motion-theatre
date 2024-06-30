import React, { ReactNode, useMemo } from "react";
import { IProject, ISheetObject } from "@theatre/core";
import { IStudio } from "@theatre/studio";
import { InnerTheatreProvider } from "./InnerTheatreProvider";
import { GizmoTheme } from "./types";

export const TheatreProvider = ({
  project,
  studio: userStudio,
  children,
  theme,
}: {
  project: IProject;
  studio?: IStudio | "auto" | false;
  children: ReactNode;
  theme?: GizmoTheme;
}) => {
  const actualStudio = useMemo(() => {
    if (userStudio !== "auto" && userStudio) {
      return userStudio;
    }
  }, [userStudio]);

  return (
    <InnerTheatreProvider project={project} studio={actualStudio} theme={theme}>
      {children}
    </InnerTheatreProvider>
  );
};
