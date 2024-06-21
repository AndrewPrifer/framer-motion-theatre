import React from "react";
import { motion } from "framer-motion";
import { getProject, types } from "@theatre/core";
import {
  TheatreProvider,
  useControls,
  useSheetObject,
  withTheatre,
} from "../lib/main";
import theatreState from "./framer-motion-theatre.theatre-project-state.json";
import studio from "@theatre/studio";

const project = getProject("framer-motion-theatre", { state: theatreState });
studio.initialize();

function App() {
  return (
    // Wrap your components in TheatreProvider, passing the project and optionally, studio if you want automatic visual selection tools.
    <TheatreProvider project={project} studio={studio}>
      <div className="container">
        {/* Pass your components a unique animation ID besides the regular props. */}
        <Box animationId="Box 1" color="#E493B3" />
        <Box animationId="Box 2" color="#EEA5A6" />
      </div>
    </TheatreProvider>
  );
}

// All components using framer-motion-theatre hooks must be directly wrapped in withTheatre. Other than that, they are regular React components.
const Box = withTheatre("Box", ({ color }: { color: string }) => {
  // useSheetObject returns an object of motion values you can plug into motion.* elements.
  const div = useSheetObject("div", {
    width: 100,
    height: 100,
    scale: types.number(1, { nudgeMultiplier: 0.01 }),
    borderRadius: types.number(0, {
      nudgeMultiplier: 0.1,
      range: [0, Infinity],
    }),
    skewX: 0,
  });

  const text = useSheetObject("text", {
    content: "Click me!",
    y: 0,
  });

  // useControls returns the controls associated with this animation instance.
  const controls = useControls();

  return (
    <motion.div
      // Besides the motion values, useSheetObject also returns a function to enable selection tools for this element.
      ref={div.$studio.createGizmo({
        translate: {
          x: div.width,
          y: div.height,
          strength: 2,
        },
      })}
      onClick={() => {
        controls.position = 0;
        controls.play({ rate: 0.8 });
      }}
      style={{
        // Being an object of motion values, you can even directly destructure it onto the style prop.
        ...div,
        backgroundColor: color,
        color: "white",
        fontWeight: "bold",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <motion.span
        ref={text.$studio.createGizmo({
          translate: {
            y: text.y,
          },
        })}
        style={{ ...text }}
      >
        {/* You can also keyframe text by directly passing it as children. */}
        {text.content}
      </motion.span>
    </motion.div>
  );
});

export default App;
