# Framer Motion 🤝 Theatre

Seamlessly integrate Theatre.js with Framer Motion and React and get the best of Theatre.js' editing tools and Framer Motion's declarative API.
Animate Framer Motion's motion values using Theatre.js, with all the complex stuff like sheets, objects, animation instancing and wiring taken care of.
Automatically get visual selection and editing tools with 1 line of code.

https://github.com/AndrewPrifer/framer-motion-theatre/assets/2991360/92b71b1d-0877-4c43-89db-f8761b9f689e

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
- Add visual editing with 1 line of code.

## Installation

```bash
yarn add framer-motion-theatre framer-motion @theatre/core @theatre/studio
```

## Usage

The following example demonstrates how to use Framer Motion Theatre. A working version can be found in the `src` directory.

```tsx
const project = getProject("framer-motion-theatre", { state: theatreState });

function App() {
  return (
    // Wrap your components in TheatreProvider, passing the project.
    // Optionally, pass in studio, or 'auto' if you want it set up automatically in development
    // Caveat: 'auto' relies on your bundler being smart enough to tree-shake,
    // check the console when running the production bundle.
    <TheatreProvider project={project} studio="auto">
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
      ref={div.$studio.createGizmo()}
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
      <motion.span ref={text.$studio.createGizmo()} style={{ ...text }}>
        {/* You can also keyframe text by directly passing it as children. */}
        {text.content}
      </motion.span>
    </motion.div>
  );
});
```

## Editor

- Learn more about Theatre.js' powerful sequencer [here](https://www.theatrejs.com/docs/latest/manual/Studio).
- Hold down the `Alt` key to display selectable objects.

## API

### **`<TheatreProvider>`**

Wrap your app in `TheatreProvider`, passing it your Theatre.js project.
Optionally, pass in studio, or `'auto'` if you want it set up automatically in development.
Caveat: `'auto'` relies on your bundler being smart enough to tree-shake, check the console when running the production bundle.

```tsx
<TheatreProvider project={project} studio="auto">
  <App />
</TheatreProvider>
```

### **`withTheatre()`**

Wrap your components in `withTheatre` to gain access to Framer Motion Theatre hooks and automatically set up sheets and objects for that component.

```tsx
const MyComponent = withTheatre("MyComponent", () => {
  // Your component here
});
```

### **`useSheetObject()`**

Animate motion values using Theatre.js. Returns an object of motion values you can plug into `motion.*` elements. Accepts an object of Theatre.js' [prop types](https://www.theatrejs.com/docs/latest/api/core#prop-types). Additionally, it returns an object with a `$studio` property that allows you to enable selection tools for this element.

```tsx
const div = useSheetObject("div", {
  width: 100,
  height: 100,
  scale: types.number(1, { nudgeMultiplier: 0.01 }),
});

return (
  <motion.div
    ref={div.$studio.createGizmo()}
    style={{
      ...div,
    }}
  >
    {/* ... */}
  </motion.div>
);
```

### **`$studio`**

The `$studio` object returned by `useSheetObject` allows you to enable selection end editing tools for this element. And has the following properties:

#### **`$studio.createGizmo()`**

Creates a gizmo for this element. Hold down the `Alt` key to display selectable objects.

`createGizmo()` accepts an object of options:

- **`zIndex`**: The z-index of the gizmo. Defaults to `0`. Gizmos are displayed on top of the page independently of your elements. The `zIndex` option lets you define the stacking order of gizmos. Higher values will be on top of lower values.
- **`ignoreComputedZIndex`**: By default, the z-index assigned to gizmos will take into account the computed z-index of their corresponding element, which is what you want most of the time. In that case, the final z-index of the gizmo will be the value of the `zIndex` option + the computed z-index of the element. If you want to ignore the computed z-index and only use the `zIndex` option, set this to `true`.
- **`translate.x`**: Accepts a `MotionValue` returned by `useSheetObject`. It will set the corresponding value when the gizmo is moved on the x axis.
- **`translate.y`**: Accepts a `MotionValue` returned by `useSheetObject`. It will set the corresponding value when the gizmo is moved on the y axis.
- **`translate.strength`**: A factor to multiply the translation by. Defaults to `1`.

```tsx
const div = useSheetObject("div", {
  width: 100,
  height: 100,
});

return (
  <motion.div
    ref={div.$studio.createGizmo({
      translate: {
        x: div.width,
        y: div.height,
      },
    })}
    style={{
      ...div,
    }}
  >
    {/* ... */}
  </motion.div>
);
```

#### **`$studio.isSelected`**

A boolean that indicates whether the object is currently selected.

```tsx
const div = useSheetObject("div", {
  width: 100,
  height: 100,
});

if (div.$studio.isSelected) {
  // ...
}
```

#### **`$studio.select()`**

Allows you to select the object programmatically.

```tsx
const div = useSheetObject("div", {
  width: 100,
  height: 100,
});

div.$studio.select();
```

### **`useControls()`**

Returns the controls associated with this animation instance. Learn more about Theatre.js' animation controls [here](https://www.theatrejs.com/docs/latest/api/core#sequence).

```tsx
const controls = useControls();

controls.play();
```

### **`useTheatre()`**

Returns the project and the studio instance associated with the component.

```tsx
const { project, studio } = useTheatre();

useEffect(() => {
  project.ready.then(() => {
    // ...
  });
}, [project]);
```
