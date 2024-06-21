import { createRafDriver } from "@theatre/core";

// Theatre provides a way to start and stop the driver on-demand through the start/stop parameters,
// however it makes it impossible to dispose of the rafDriver because the update loop is now managed by Theatre and we have no way of telling it to stop.
// It'll also retain the rafDriver object itself forever, causing a memory leak.
// So we are not using it for now.
export const framerMotionRafDriver = createRafDriver({
  name: "framer-motion-theatre",
});
