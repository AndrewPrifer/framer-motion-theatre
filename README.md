# Framer Motion 🤝 Theatre

Seamlessly integrate Theatre.js with Framer Motion and React and get the best of Theatre.js' editing tools and Framer Motion's declarative API.
Animate Framer Motion's motion values using Theatre.js, with all the complex stuff like sheets, objects, animation instancing and wiring taken care of.
Plus you automatically get visual selection tools when in dev mode.

## Why?

While Theatre.js' concepts can be a bit hard to wrap your head around, its terminology maps surprisingly well to React and Framer Motion concepts.

- Sheets -> React components
- Sheet instances -> React component instances
- Objects -> Framer Motion motion values

By enforcing this interpretation, we can wrap Theatre.js' complexity in a simple declarative API that is very easy to read and write.

## Features

- Use Theatre.js with a simple declarative API.
- Animate Framer Motion's motion values using Theatre.js.
- Automatically creates and manages sheet objects and sheet instances.
- Hold down the `Alt` key to display selectable objects in dev mode.

## Installation

```bash
yarn add framer-motion-theatre framer-motion @theatre/core @theatre/studio
```

## Usage

The following example demonstrates how to use Framer Motion Theatre. A working version can be found in the `src` directory.

```tsx
let maybeStudio: IStudio | undefined = undefined;

// Comment out these lines to remove studio from the bundle
maybeStudio = studio;
studio.initialize();

const project = getProject("framer-motion-theatre", { state: theatreState });

function App() {
  return (
    // Wrap your components in TheatreProvider, passing the project and optionally, studio if you want automatic visual selection tools.
    <TheatreProvider project={project} studio={maybeStudio}>
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
      ref={div.$studio.setSelectionTarget}
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
      <motion.span ref={text.$studio.setSelectionTarget} style={{ ...text }}>
        {/* You can also keyframe text by directly passing it as children. */}
        {text.content}
      </motion.span>
    </motion.div>
  );
});
```

## API

### **`TheatreProvider`**

Wrap your app in `TheatreProvider`, passing it your Theatre.js project and optionally, studio if you want automatic visual selection tools.

```tsx
<TheatreProvider project={project} studio={studio}>
  <App />
</TheatreProvider>
```

### **`withTheatre`**

Wrap your components in `withTheatre` to gain access to Framer Motion Theatre hooks and automatically set up sheets and objects for that component.

```tsx
const MyComponent = withTheatre("MyComponent", () => {
  // Your component here
});
```

### **`useSheetObject`**

Animate motion values using Theatre.js. Returns an object of motion values you can plug into `motion.*` elements. Accepts an object of Theatre.js' [prop types](https://www.theatrejs.com/docs/latest/api/core#prop-types).

```tsx
const div = useSheetObject("div", {
  width: 100,
  height: 100,
  scale: types.number(1, { nudgeMultiplier: 0.01 }),
});
```

### **`useControls`**

Returns the controls associated with this animation instance. Learn more about Theatre.js' animation controls [here](https://www.theatrejs.com/docs/latest/api/core#sequence).

```tsx
const controls = useControls();

controls.play();
```
