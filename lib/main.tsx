import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ISheetObject,
  IProject,
  ISheet,
  UnknownShorthandCompoundProps,
  onChange,
  createRafDriver,
} from "@theatre/core";
import { MotionValue, cancelFrame, frame, motionValue } from "framer-motion";
import type { IStudio } from "@theatre/studio";
import { createRoot } from "react-dom/client";

type GizmoTheme = {
  normalColor: string;
  selectedColor: string;
  width: number;
  fillOpacity: number;
};

// Theatre provides a way to start and stop the driver on-demand through the start/stop parameters,
// however it makes it impossible to dispose of the rafDriver because the update loop is now managed by Theatre and we have no way of telling it to stop.
// It'll also retain the rafDriver object itself forever, causing a memory leak.
// So we are not using it for now.
const framerMotionRafDriver = createRafDriver({
  name: "framer-motion-theatre",
});

const theatreContext = createContext<{
  project: IProject;
  studio?: IStudio;
  gizmoTheme: GizmoTheme;
}>(null!);

export const TheatreProvider = ({
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
    normalColor: "rgb(173, 173, 173)",
    selectedColor: "rgb(79, 167, 255)",
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

  return (
    <theatreContext.Provider
      value={{ project, studio, gizmoTheme: theme ?? defaultGizmoTheme }}
    >
      {children}
    </theatreContext.Provider>
  );
};

export function useTheatre() {
  const { project, studio } = useContext(theatreContext);

  return { project, studio };
}

const theatreComponentContext = createContext<{
  sheet: ISheet;
}>(null!);

export function withTheatre<P>(componentId: string, Component: React.FC<P>) {
  return (props: P & { animationId: string }) => {
    const { project } = useContext(theatreContext);

    const [sheet] = useState(() =>
      project.sheet(componentId, props.animationId)
    );

    return (
      <theatreComponentContext.Provider value={{ sheet }}>
        <Component {...props} />
      </theatreComponentContext.Provider>
    );
  };
}

type MotionValueObject<Props extends UnknownShorthandCompoundProps> = {
  [K in keyof ISheetObject<Props>["value"]]: MotionValue<
    ISheetObject<Props>["value"][K]
  >;
};

type MotionValueObjectWithStudio<Props extends UnknownShorthandCompoundProps> =
  MotionValueObject<Props> & {
    $studio: {
      isSelected: boolean;
      select: () => void;
      setSelectionTarget: (element: HTMLElement | null) => void;
    };
  };

const noop = () => {};

function createSelectFn(object: ISheetObject<any>, studio: IStudio) {
  return () => {
    studio.setSelection([object]);
  };
}

export function useSheetObject<
  Props extends UnknownShorthandCompoundProps = UnknownShorthandCompoundProps
>(objectId: string, initial: Props): MotionValueObjectWithStudio<Props> {
  const { sheet } = useContext(theatreComponentContext);
  const { studio, gizmoTheme } = useContext(theatreContext);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [selectionTarget, setSelectionTarget] = useState<HTMLElement | null>(
    null
  );
  const [gizmoRoot, setGizmoRoot] = useState<{
    root: ReturnType<typeof createRoot>;
    domElement: HTMLElement;
  } | null>();
  const [isGizmoActive, setIsGizmoActive] = useState(false);

  const [object, setObject] = useState(() =>
    sheet.object(objectId, initial, { reconfigure: true })
  );

  const [motionValues, setMotionValues] = useState<MotionValueObject<Props>>(
    () => {
      const values = {} as MotionValueObject<Props>;

      for (const key in object.value) {
        values[key] = motionValue(object.value[key]);
      }

      return values;
    }
  );

  const [selectFn, setSelectFn] = useState(() => {
    if (!studio) {
      return noop;
    } else {
      return createSelectFn(object, studio);
    }
  });

  useEffect(() => {
    if (!studio) {
      setSelectFn(noop);
      setIsSelected(false);
    } else {
      setSelectFn(() => createSelectFn(object, studio));
      setIsSelected(studio.selection.includes(object));
      studio.onSelectionChange((selection) => {
        setIsSelected(selection.includes(object));
      });
    }
  }, [object, studio]);

  const motionValuesWithStudio = useMemo(
    () => ({
      ...motionValues,
      $studio: {
        isSelected,
        select: selectFn,
        setSelectionTarget,
      },
    }),
    [motionValues, selectFn, isSelected]
  );

  useEffect(() => {
    setMotionValues((prev) => {
      // ensure motion values object matches sheet object
      const newMotionValues = {} as MotionValueObject<Props>;
      for (const key in object.value) {
        if (!prev[key]) {
          newMotionValues[key] = motionValue(object.value[key]);
        } else {
          newMotionValues[key] = prev[key];
        }
      }

      return newMotionValues;
    });
  }, [object]);

  useEffect(() => {
    const unsubscribe = onChange(
      object.props,
      (values: any) => {
        for (const key in values) {
          if (motionValues[key]) {
            motionValues[key].set(values[key]);
          }
        }
      },
      framerMotionRafDriver
    );

    return unsubscribe;
  }, [object, motionValues]);

  useEffect(() => {
    setObject(sheet.object(objectId, initial, { reconfigure: true }));
  }, [initial, objectId, sheet]);

  useEffect(() => {
    if (!selectionTarget || !studio) {
      return;
    }

    const gizmoDiv = document.createElement("div");
    const gizmoRoot = createRoot(gizmoDiv);
    setGizmoRoot({ root: gizmoRoot, domElement: gizmoDiv });

    return () => {
      gizmoRoot.unmount();
      gizmoDiv.remove();
      setGizmoRoot(null);
    };
  }, [selectionTarget, studio]);

  useEffect(() => {
    if (!gizmoRoot || !selectionTarget) {
      return;
    }

    gizmoRoot.root.render(
      <Gizmo
        selectFn={selectFn}
        isSelected={isSelected}
        isHovered={isHovered}
        theme={gizmoTheme}
      />
    );
  }, [gizmoRoot, gizmoTheme, isHovered, isSelected, selectFn, selectionTarget]);

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

  useEffect(() => {
    if (!isGizmoActive || !gizmoRoot || !selectionTarget) {
      return;
    }

    selectionTarget.appendChild(gizmoRoot.domElement);

    const oldPosition = selectionTarget.style.position;

    if (/static/.test(getComputedStyle(selectionTarget).position)) {
      selectionTarget.style.position = "relative";
    }

    return () => {
      try {
        selectionTarget.removeChild(gizmoRoot.domElement);
      } catch (e) {
        // the gizmo root may have already been removed
      }

      selectionTarget.style.position = oldPosition;
    };
  }, [isGizmoActive, gizmoRoot, selectionTarget]);

  useEffect(() => {
    if (!selectionTarget || !studio) {
      return;
    }
    const onMouseEnter = () => setIsHovered(true);
    const onMouseLeave = () => setIsHovered(false);

    selectionTarget.addEventListener("mouseenter", onMouseEnter);
    selectionTarget.addEventListener("mouseleave", onMouseLeave);

    return () => {
      setIsHovered(false);
      selectionTarget.removeEventListener("mouseenter", onMouseEnter);
      selectionTarget.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [selectionTarget, studio]);

  useEffect(() => {
    if (!selectionTarget || !studio) {
      return;
    }

    const onClick = (e: MouseEvent) => {
      if (isGizmoActive) {
        e.stopPropagation();
        selectFn();
        studio?.ui.restore();
      }
    };

    selectionTarget.addEventListener("click", onClick);

    return () => {
      selectionTarget.removeEventListener("click", onClick);
    };
  }, [isGizmoActive, selectFn, selectionTarget, studio]);

  return motionValuesWithStudio;
}

export function useControls() {
  const { sheet } = useContext(theatreComponentContext);

  return sheet.sequence;
}

function Gizmo({
  selectFn,
  isSelected,
  isHovered,
  theme,
}: {
  selectFn: () => void;
  isSelected: boolean;
  isHovered: boolean;
  theme: GizmoTheme;
}) {
  const color =
    isSelected || isHovered ? theme.selectedColor : theme.normalColor;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderWidth: theme.width,
        borderStyle: isSelected ? "solid" : "dashed",
        borderColor: color,
        backgroundColor: `rgb(from ${color} r g b / ${theme.fillOpacity})`,
        boxSizing: "border-box",
        zIndex: 1000,
      }}
      onClick={selectFn}
    />
  );
}
