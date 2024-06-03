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
} from "@theatre/core";
import { MotionValue, motionValue } from "framer-motion";
import type { IStudio } from "@theatre/studio";
import { createRoot } from "react-dom/client";

type GizmoTheme = {
  normalColor: string;
  selectedColor: string;
  width: number;
};

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
    width: 3,
  };

  return (
    <theatreContext.Provider
      value={{ project, studio, gizmoTheme: theme ?? defaultGizmoTheme }}
    >
      {children}
    </theatreContext.Provider>
  );
};

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
      setSelectionTarget: (HTMLElement) => void;
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
    // TODO: use frame-motion's frame loop as rafDriver
    const unsubscribe = object.onValuesChange((values) => {
      for (const key in values) {
        if (motionValues[key]) {
          motionValues[key].set(values[key]);
        }
      }
    });

    return unsubscribe;
  }, [object, motionValues]);

  useEffect(() => {
    setObject(sheet.object(objectId, initial, { reconfigure: true }));
  }, [initial, objectId, sheet]);

  useEffect(() => {
    if (!selectionTarget) {
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
  }, [selectionTarget]);

  useEffect(() => {
    if (!gizmoRoot || !selectionTarget) {
      return;
    }

    if (isGizmoActive) {
      // ensure gizmoe root is appended to the selection target
      selectionTarget.appendChild(gizmoRoot.domElement);
    }

    gizmoRoot.root.render(
      <Gizmo
        selectionTarget={selectionTarget}
        selectFn={selectFn}
        isSelected={isSelected}
        isHovered={isHovered}
        theme={gizmoTheme}
      />
    );
  }, [
    gizmoRoot,
    gizmoTheme,
    isGizmoActive,
    isHovered,
    isSelected,
    selectFn,
    selectionTarget,
  ]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!isGizmoActive || !gizmoRoot || !selectionTarget) {
      return;
    }

    selectionTarget.appendChild(gizmoRoot.domElement);

    const oldPosition = selectionTarget.style.position;
    selectionTarget.style.position = "relative";

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
    if (!selectionTarget) {
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
  }, [selectionTarget]);

  useEffect(() => {
    if (!selectionTarget) {
      return;
    }

    const onClick = (e: MouseEvent) => {
      if (isGizmoActive) {
        e.stopPropagation();
        selectFn();
      }
    };

    selectionTarget.addEventListener("click", onClick);

    return () => {
      selectionTarget.removeEventListener("click", onClick);
    };
  });

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
  selectionTarget: HTMLElement;
  selectFn: () => void;
  isSelected: boolean;
  isHovered: boolean;
  theme: GizmoTheme;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderWidth: theme.width,
        borderStyle: isSelected ? "solid" : "dashed",
        borderColor:
          isSelected || isHovered ? theme.selectedColor : theme.normalColor,
        boxSizing: "border-box",
        zIndex: 1000,
      }}
      onClick={selectFn}
    />
  );
}
