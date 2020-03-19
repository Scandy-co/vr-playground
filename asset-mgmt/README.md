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
node assetConverter.js  -i cacti.ply -o test.stl
node assetConverter.js  -i cacti.ply -o test.obj
node assetConverter.js  -i cacti.ply -o test.ply
node assetConverter.js  -i cacti.ply -o test.glb -c 8
node assetConverter.js  -i cacti.ply -o test.gltf
```

## draco encode gltf

```bash
gltf-pipeline -i cacti.gltf -o cacti.glb -d --draco.compressionLevel 7
```
