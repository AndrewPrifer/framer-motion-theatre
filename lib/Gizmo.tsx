import React, { useContext, useEffect, useRef, useState } from "react";
import { useAnimationFrame, useMotionValue } from "framer-motion";
import { IScrub } from "@theatre/studio";
import { theatreContext } from "./theatreContext";
import { GizmoTarget } from "./types";
import { motion } from "framer-motion";

export function Gizmo({ gizmoTarget }: { gizmoTarget: GizmoTarget }) {
  const {
    gizmoTheme: theme,
    studio,
    selectedObject,
  } = useContext(theatreContext);

  const { target, options, axesMap, sheetObject } = gizmoTarget;

  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedObject === sheetObject;

  const color = isSelected ? theme.selectedColor : theme.normalColor;
  const zIndex = useMotionValue(options.zIndex ?? 0);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);

  useAnimationFrame(() => {
    const bounds = target.getBoundingClientRect();

    if (!options.ignoreComputedZIndex) {
      zIndex.set(
        (options.zIndex ?? 0) + Number(getComputedStyle(target).zIndex)
      );
    }

    x.set(bounds.x);
    y.set(bounds.y);
    width.set(bounds.width);
    height.set(bounds.height);
  });

  const scrubRef = useRef<IScrub | null>(null);
  const initialRef = useRef(sheetObject.value);
  const initialStylesRef = useRef({
    userSelect: document.body.style.userSelect,
    cursor: document.body.style.cursor,
  });

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrubRef.current) {
        scrubRef.current.discard();
      }

      document.body.style.userSelect = initialStylesRef.current.userSelect;
      document.body.style.webkitUserSelect =
        initialStylesRef.current.userSelect;
      document.body.style.cursor = initialStylesRef.current.cursor;
    };
  }, []);

  return (
    <motion.div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        borderWidth: theme.width,
        borderStyle: isSelected ? "solid" : "dashed",
        borderColor: color,
        backgroundColor: `rgb(from ${color} r g b / ${
          isHovered && !isSelected ? theme.fillOpacity : 0
        })`,
        boxSizing: "border-box",
        contain: "strict",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        x,
        y,
        width,
        height,
        zIndex,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTap={() => {
        if (studio && !scrubRef.current) {
          studio.setSelection([gizmoTarget.sheetObject]);
          studio.ui.restore();
        }
      }}
      onPanStart={() => {
        if (!studio) {
          return;
        }

        studio.setSelection([gizmoTarget.sheetObject]);

        if (scrubRef.current) {
          scrubRef.current.discard();
        }

        scrubRef.current = studio.scrub();
        initialRef.current = sheetObject.value;

        initialStylesRef.current = {
          userSelect: document.body.style.userSelect,
          cursor: document.body.style.cursor,
        };

        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
        document.body.style.cursor = "move";
      }}
      onPan={(event, info) => {
        if (!scrubRef.current) {
          return;
        }

        const xKey = axesMap.translate.x;
        const yKey = axesMap.translate.y;

        scrubRef.current.capture(({ set }) => {
          if (xKey) {
            set(
              sheetObject.props[xKey],
              initialRef.current[xKey] +
                info.offset.x * (options.translate?.strength ?? 1)
            );
          }

          if (yKey) {
            set(
              sheetObject.props[yKey],
              initialRef.current[yKey] +
                info.offset.y * (options.translate?.strength ?? 1)
            );
          }
        });
      }}
      onPanEnd={() => {
        if (scrubRef.current) {
          scrubRef.current.commit();
          scrubRef.current = null;
        }

        document.body.style.userSelect = initialStylesRef.current.userSelect;
        document.body.style.webkitUserSelect =
          initialStylesRef.current.userSelect;
        document.body.style.cursor = initialStylesRef.current.cursor;
      }}
    />
  );
}
