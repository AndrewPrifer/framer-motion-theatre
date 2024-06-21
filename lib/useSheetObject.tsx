import { useContext, useEffect, useMemo, useState } from "react";
import {
  ISheetObject,
  UnknownShorthandCompoundProps,
  onChange,
} from "@theatre/core";
import { MotionValue, motionValue } from "framer-motion";
import { theatreContext } from "./theatreContext";
import { framerMotionRafDriver } from "./framerMotionRafDriver";
import { theatreComponentContext } from "./theatreComponentContext";

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
      createGizmo: () => (element: HTMLElement | null) => void;
    };
  };

export function useSheetObject<
  Props extends UnknownShorthandCompoundProps = UnknownShorthandCompoundProps
>(objectId: string, initial: Props): MotionValueObjectWithStudio<Props> {
  const { sheet } = useContext(theatreComponentContext);
  const { studio, selectedObject, registerGizmoTarget } =
    useContext(theatreContext);
  const [selectionTarget, setSelectionTarget] = useState<HTMLElement | null>(
    null
  );

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

  const motionValuesWithStudio = useMemo(
    () => ({
      ...motionValues,
      $studio: {
        isSelected: selectedObject === object,
        select: () => {
          if (!studio) {
            return;
          }
          studio.setSelection([object]);
        },
        createGizmo: () => setSelectionTarget,
      },
    }),
    [motionValues, object, selectedObject, studio]
  );

  useEffect(() => {
    if (selectionTarget) {
      registerGizmoTarget(object, selectionTarget);
    }
  }, [object, registerGizmoTarget, selectionTarget]);

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

      // destroy any motion value in prev that is not in new
      for (const key in prev) {
        if (!newMotionValues[key]) {
          prev[key].destroy();
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

  return motionValuesWithStudio;
}