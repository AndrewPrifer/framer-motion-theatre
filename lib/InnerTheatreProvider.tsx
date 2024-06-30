import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { IProject, ISheetObject } from "@theatre/core";
import { IStudio } from "@theatre/studio";
import { theatreContext } from "./theatreContext";
import { GizmoTarget, GizmoTheme } from "./types";
import { Gizmo } from "./Gizmo";

function keyFromAddress(object: ISheetObject): string {
  let key = "";

  for (const part of Object.values(object.address)) {
    key += part;
  }

  return key;
}

export const InnerTheatreProvider = ({
  project,
  studio,
  children,
  theme,
}: {
  project: IProject;
  studio?: IStudio;
  children: ReactNode;
  theme?: GizmoTheme;
}) => {
  const defaultGizmoTheme = {
    normalColor: "rgb(60, 140, 219)",
    selectedColor: "rgb(31, 121, 210)",
    fillOpacity: 0.2,
    width: 3,
  };

  const [gizmoTargets, setGizmoTargets] = useState<GizmoTarget[]>([]);
  const [isGizmoActive, setIsGizmoActive] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ISheetObject | null>(
    null
  );

  const registerGizmoTarget = useCallback<
    (gizmoTarget: GizmoTarget) => () => void
  >((gizmoTarget) => {
    setGizmoTargets((gizmoTargets) => [...gizmoTargets, gizmoTarget]);

    return () => {
      setGizmoTargets((gizmoTargets) =>
        gizmoTargets.filter((e) => e !== gizmoTarget)
      );
    };
  }, []);

  useEffect(() => {
    if (!studio) {
      setSelectedObject(null);
    } else {
      setSelectedObject(
        (studio.selection.filter(
          (e) => e.type === "Theatre_SheetObject_PublicAPI"
        )[0] as ISheetObject | undefined) ?? null
      );
      studio.onSelectionChange((selection) => {
        const object = selection.filter(
          (e) => e.type === "Theatre_SheetObject_PublicAPI"
        )[0] as ISheetObject | undefined;
        setSelectedObject(object ?? null);
      });
    }
  }, [studio]);

  useEffect(() => {
    if (!studio) {
      return;
    }

    const keyDown = (e: KeyboardEvent) => {
      if (e.altKey === true) {
        setIsGizmoActive(true);
      }
    };

    const keyUp = (e: KeyboardEvent) => {
      if (e.altKey === false) {
        setIsGizmoActive(false);
      }
    };

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    return () => {
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
    };
  }, [studio]);

  return (
    <theatreContext.Provider
      value={{
        project,
        studio: studio,
        gizmoTheme: theme ?? defaultGizmoTheme,
        registerGizmoTarget,
        selectedObject,
      }}
    >
      {isGizmoActive && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 999999999,
          }}
        >
          {gizmoTargets.map((gizmoTarget) => (
            <Gizmo
              key={keyFromAddress(gizmoTarget.sheetObject)}
              gizmoTarget={gizmoTarget}
            />
          ))}
        </div>
      )}
      {children}
    </theatreContext.Provider>
  );
};
