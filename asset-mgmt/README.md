# asset mgmt tools

## setup

```bash
yarn
```

## converter script

`assetConverter.js` is a handy "everything" to "everything" converter.

It currently handles:

- STL
- PLY
- OBJ
- GLTF, GLB (with optional draco compression)

```bash
node assetConverter.js  -i cacti.ply -o test.glb -c 8
node assetConverter.js  -i test.glb -o test.obj
node assetConverter.js  -i test.obj -o test.stl
node assetConverter.js  -i cacti.ply -o test.gltf
```

## draco encode gltf

```bash
gltf-pipeline -i cacti.gltf -o cacti.glb -d --draco.compressionLevel 7
```

## Further reading

Checkout @donmccurdy very helpful gists on this topic:

- https://gist.github.com/donmccurdy/9f094575c1f1a48a2ddda513898f6496
- https://gist.github.com/donmccurdy/323c6363ac7ca8a7de6a3362d7fdddb4
