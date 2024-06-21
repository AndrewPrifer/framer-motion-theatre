import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IProject, ISheetObject } from "@theatre/core";
import { cancelFrame, frame } from "framer-motion";
import { IStudio } from "@theatre/studio";
import { theatreContext } from "./theatreContext";
import { GizmoTarget, GizmoTheme } from "./types";
import { framerMotionRafDriver } from "./framerMotionRafDriver";
import { Gizmo } from "./Gizmo";

function keyFromAddress(object: ISheetObject): string {
  let key = "";

  for (const part of Object.values(object.address)) {
    key += part;
  }

  return key;
}

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
  const defaultGizmoTheme = {
    normalColor: "rgb(60, 140, 219)",
    selectedColor: "rgb(31, 121, 210)",
    fillOpacity: 0.2,
    width: 3,
  };

  useEffect(() => {
    const update: Parameters<typeof frame.update>[0] = ({ timestamp }) => {
      framerMotionRafDriver.tick(timestamp);
    };

    frame.update(update, true);

    return () => cancelFrame(update);
  }, []);

  const actualStudio = useMemo(() => {
    if (userStudio !== "auto" && userStudio) {
      return userStudio;
    }

    // Vite/Rollup is smart enough to tree-shake this, but not `if (userStudio === "auto" && process.env.NODE_ENV === "development") { ... }`
    // @ts-ignore
    if (process.env.NODE_ENV === "development") {
      if (userStudio === "auto") {
        // studio.initialize();
        // return studio;
      }
    }
  }, [userStudio]);

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
    if (!actualStudio) {
      setSelectedObject(null);
    } else {
      setSelectedObject(
        (actualStudio.selection.filter(
          (e) => e.type === "Theatre_SheetObject_PublicAPI"
        )[0] as ISheetObject | undefined) ?? null
      );
      actualStudio.onSelectionChange((selection) => {
        const object = selection.filter(
          (e) => e.type === "Theatre_SheetObject_PublicAPI"
        )[0] as ISheetObject | undefined;
        setSelectedObject(object ?? null);
      });
    }
  }, [actualStudio]);

  useEffect(() => {
    if (!actualStudio) {
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
  }, [actualStudio]);

  return (
    <theatreContext.Provider
      value={{
        project,
        studio: actualStudio,
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
