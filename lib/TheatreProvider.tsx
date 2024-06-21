import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IProject, ISheetObject } from "@theatre/core";
import {
  cancelFrame,
  frame,
  useAnimationFrame,
  useMotionValue,
} from "framer-motion";
import { IStudio } from "@theatre/studio";
import { theatreContext } from "./theatreContext";
import { GizmoTheme } from "./types";
import { framerMotionRafDriver } from "./framerMotionRafDriver";
import { motion } from "framer-motion";

type GizmoTarget = { sheetObject: ISheetObject; target: HTMLElement };

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
    fillOpacity: 0,
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
    (sheetObject: ISheetObject, target: HTMLElement) => () => void
  >((sheetObject, target) => {
    setGizmoTargets((gizmoTargets) => [
      ...gizmoTargets,
      { sheetObject, target },
    ]);

    return () => {
      setGizmoTargets((gizmoTargets) =>
        gizmoTargets.filter((e) => e.sheetObject !== sheetObject)
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
            zIndex: 1000,
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

function Gizmo({ gizmoTarget }: { gizmoTarget: GizmoTarget }) {
  const {
    gizmoTheme: theme,
    studio,
    selectedObject,
  } = useContext(theatreContext);

  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedObject === gizmoTarget.sheetObject;

  const target = gizmoTarget.target;

  const color =
    isSelected || isHovered ? theme.selectedColor : theme.normalColor;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);

  useAnimationFrame(() => {
    const bounds = target.getBoundingClientRect();

    x.set(bounds.x);
    y.set(bounds.y);
    width.set(bounds.width);
    height.set(bounds.height);
  });

  return (
    <motion.div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        borderWidth: theme.width,
        borderStyle: isSelected ? "solid" : "dashed",
        borderColor: color,
        backgroundColor: `rgb(from ${color} r g b / ${theme.fillOpacity})`,
        boxSizing: "border-box",
        contain: "strict",
        x,
        y,
        width,
        height,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        if (studio) {
          studio.setSelection([gizmoTarget.sheetObject]);
        }
      }}
    />
  );
}
