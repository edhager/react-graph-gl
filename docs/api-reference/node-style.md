# Node Style

Node accessors control the way how users want to render nodes. Layers provide the flexibility that users can add several visual layers to represent a node, such as adding circles, icons, and text labels.

### Usage
Example of nodeStyle:
```js
<GraphGL
  {...shareProps}
  nodeStyle={[
    {
      type: NODE_TYPE.CIRCLE,
      radius: 10,
      color: '#f00'
    },
  ]}
/>
```

### `type` (String, required)

- `Type` can only be `CIRCLE`, `MARKER`, `RECTANGLE`, or `LABEL`.
- Different type of layer may requires different properties. See more details in the ['Node style'](/docs/api-reference/node-style-circle) chapter below.

### `offset` (null | Array, optional)
- Default: `null`
- The offset distance from the position of the object.

### `scaleWithZoom` (Boolean, optional)
- Default: `true`
- If `scaleWithZoom` is true, the size of the element will be scaled according to the zoom level.


## Source

[Storybook example](TBD/master/stories/node-types/stories.js)
