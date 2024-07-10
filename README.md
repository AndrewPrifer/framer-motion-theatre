# Framer Motion 🤝 Theatre

Seamlessly integrate Theatre.js with Framer Motion and React and get the best of Theatre.js' animation sequencer and React's declarative API.
Animate Framer Motion's motion values using Theatre.js, and have all the complexity like sheets, objects, animation instancing and wiring taken care of.
Automatically get WYSIWYG editing tools with 1 line of code.

https://github.com/AndrewPrifer/framer-motion-theatre/assets/2991360/08f9c8e9-c86b-417b-b205-16d9292b63d2

## How does it work?

While Theatre.js provides a framework-agnostic toolset, its concepts map directly to React and Framer Motion.

- [Sheets](https://www.theatrejs.com/docs/latest/manual/sheets) -> React components
- [Sheet instances](https://www.theatrejs.com/docs/latest/manual/sheets#instancing-sheets) -> React component instances
- [Objects](https://www.theatrejs.com/docs/latest/manual/objects) -> Framer Motion motion values

By codifying this interpretation, we can wrap Theatre.js' complexity in a simple declarative API that is very easy to read and write, integrates with Framer Motion's `motion` components, and allows us to easily add powerful WYSIWYG editing tools to our components.

## Features

- Use Theatre.js with a simple declarative API.
- Animate Framer Motion's motion values using Theatre.js.
- Automatically create and manage sheet objects and sheet instances.
- Hold down the `Alt` key to display editable objects in dev mode.
- Get WYSIWYG editing tools with 1 line of code.

https://github.com/AndrewPrifer/framer-motion-theatre/assets/2991360/44c77be8-c6de-4545-bcf7-75fe49164715

## Installation

```bash
yarn add framer-motion-theatre framer-motion @theatre/core @theatre/studio
```

## Usage

The following example demonstrates how to use Framer Motion Theatre. A working version can be found in the `src` directory and run by cloning this repository and running `yarn dev`.

```tsx
// Wrap your component in FMT's withTheatre
const Box = withTheatre("Box", ({ color }: { color: string }) => {
  // Returns an object of motion values you can plug into <motion.*> elements
  const div = useSheetObject("div", {
    width: 100,
    height: 100,
    // You can use Theatre's prop config finer control
    scale: types.number(1, { nudgeMultiplier: 0.01 }),
  });

  const text = useSheetObject("text", {
    content: "Click me!",
    x: 0,
    y: 0,
  });

  // Returns the controls associated with this component instance
  const controls = useControls();

  return (
    <motion.div
      // Use $studio.createGizmo to enable WYSIWYG tools for this element
      ref={div.$studio.createGizmo()}
      // Play the animation on click
      onClick={() => {
        controls.position = 0;
        controls.play();
      }}
      // Just plug the returned values in here, zero fuss
      style={{
        ...div,
      }}
    >
      <motion.span ref={text.$studio.createGizmo()} style={{ ...text }}>
        {/* You can also keyframe text by passing it as children */}
        {text.content}
      </motion.span>
    </motion.div>
  );
});

// Give it an instance ID and use it, FMT takes care of the rest
<Box instanceId="Box 1" color="#E493B3" />
<Box instanceId="Box 2" color="#EEA5A6" />
```

## Editor

- Learn more about Theatre.js' powerful sequencer [here](https://www.theatrejs.com/docs/latest/manual/Studio).
- Hold down the `Alt` key to display editing tools.

## API

### **`<TheatreProvider>`**

Wrap your app in `TheatreProvider`, passing it your Theatre.js project.
Optionally, pass in studio, or `'auto'` if you want it set up automatically in development.

```tsx
<TheatreProvider project={project} studio="auto">
  <App />
</TheatreProvider>
```

### **`withTheatre()`**

Wrap your components in `withTheatre` to gain access to Framer Motion Theatre hooks and automatically set up sheets and objects for that component. The returned component has an extra mandatory prop `instanceId` that must be unique for each instance of the component.

```tsx
const MyComponent = withTheatre("MyComponent", () => {
  // Your component here
});

<MyComponent instanceId="MyComponent 1" />;
<MyComponent instanceId="MyComponent 2" />;
```

### **`useSheetObject()`**

Animate motion values using Theatre.js. Returns an object of motion values you can plug into `motion.*` elements. Accepts an object of Theatre.js' [prop types](https://www.theatrejs.com/docs/latest/api/core#prop-types). Additionally, it returns an object with a `$studio` property that allows you to enable WYSIWYG editing tools for this element.

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

The `$studio` object returned by `useSheetObject` allows you to enable WYSIWYG editing tools for the object and has the following properties:

#### **`$studio.createGizmo()`**

Creates a gizmo for this element. Hold down the `Alt` key to display selectable objects.

`createGizmo()` accepts an object of options:

- **`translate.x`**: Accepts a `MotionValue` returned by `useSheetObject`. It will edit the value when the gizmo is moved on the x axis.
- **`translate.y`**: Accepts a `MotionValue` returned by `useSheetObject`. It will edit the value when the gizmo is moved on the y axis.
- **`translate.strength`**: A factor to multiply the translation by. Defaults to `1`.
- **`zIndex`**: The z-index of the gizmo. Defaults to `0`. Gizmos are displayed on top of the page independently of your elements. The `zIndex` option lets you define the stacking order of gizmos. Higher values will be on top of lower values.
- **`ignoreComputedZIndex`**: By default, the z-index assigned to gizmos will take into account the computed z-index of their corresponding element, which is what you want most of the time. In that case, the final z-index of the gizmo will be the value of the `zIndex` option + the computed z-index of the element. If you want to ignore the computed z-index and only use the `zIndex` option, set this to `true`.

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
