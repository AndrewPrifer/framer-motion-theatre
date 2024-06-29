import { createRafDriver } from "@theatre/core";
import { cancelFrame, frame } from "framer-motion";

const update: Parameters<typeof frame.update>[0] = ({ timestamp }) => {
  framerMotionRafDriver.tick(timestamp);
};

const start = (): void => {
  frame.update(update, true);
};

const stop = (): void => {
  cancelFrame(update);
};

export const framerMotionRafDriver = createRafDriver({
  name: "framer-motion-theatre",
  start,
  stop,
});
