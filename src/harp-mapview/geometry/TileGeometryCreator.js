"use strict";
let exports = {}
exports.TileGeometryCreator = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as harp_geoutils_1 from "@here/harp-geoutils"
import * as harp_materials_1 from "@here/harp-materials"
import * as harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
import DecodedTileHelpers_1 from "../DecodedTileHelpers"
import DepthPrePass_1 from "../DepthPrePass"
import MapMaterialAdapter_1 from "../MapMaterialAdapter"
import PathBlockingElement_1 from "../PathBlockingElement"
import TextElementBuilder_1 from "../text/TextElementBuilder"
import AddGroundPlane_1 from "./AddGroundPlane"
import RegisterTileObject_1 from "./RegisterTileObject"
const logger = harp_utils_1.LoggerManager.instance.create("TileGeometryCreator");
const tmpVector3 = new THREE.Vector3();
const tmpVector2 = new THREE.Vector2();
class AttachmentCache {
    constructor() {
        this.bufferAttributes = new Map();
        this.interleavedAttributes = new Map();
    }
}
class MemoCallExpr extends harp_datasource_protocol_1.CallExpr {
    constructor(expr) {
        super("memo", [expr]);
        this.m_cachedProperties = [];
        this.m_deps = Array.from(expr.dependencies().properties);
        this.descriptor = this;
    }
    call(context) {
        let changed = false;
        this.m_deps.forEach((d, i) => {
            const newValue = context.env.lookup(d);
            if (!changed && newValue !== this.m_cachedProperties[i]) {
                changed = true;
            }
            if (changed) {
                this.m_cachedProperties[i] = newValue;
            }
        });
        if (changed || this.m_cachedValue === undefined) {
            this.m_cachedValue = context.evaluate(this.args[0]);
        }
        return this.m_cachedValue;
    }
}
class AttachmentInfo {
    constructor(geometry, info, cache) {
        this.geometry = geometry;
        this.info = info;
        this.cache = cache;
    }
    getBufferAttribute(description) {
        if (this.cache.bufferAttributes.has(description)) {
            return this.cache.bufferAttributes.get(description);
        }
        const attribute = DecodedTileHelpers_1.getBufferAttribute(description);
        this.cache.bufferAttributes.set(description, attribute);
        return attribute;
    }
    getInterleavedBufferAttributes(description) {
        const interleavedAttributes = this.cache.interleavedAttributes.get(description);
        if (interleavedAttributes) {
            return interleavedAttributes;
        }
        const ArrayCtor = harp_datasource_protocol_1.getArrayConstructor(description.type);
        const buffer = new ArrayCtor(description.buffer);
        const interleavedBuffer = new THREE.InterleavedBuffer(buffer, description.stride);
        const attrs = description.attributes.map(interleavedAttr => {
            const attribute = new THREE.InterleavedBufferAttribute(interleavedBuffer, interleavedAttr.itemSize, interleavedAttr.offset, false);
            const name = interleavedAttr.name;
            return { name, attribute };
        });
        this.cache.interleavedAttributes.set(description, attrs);
        return attrs;
    }
}
function addToExtrudedMaterials(material, extrudedMaterials) {
    if (Array.isArray(material)) {
        const materials = material;
        extrudedMaterials.push(...materials);
    }
    else {
        extrudedMaterials.push(material);
    }
}
/**
 * Support class to create geometry for a {@link Tile} from a {@link @here/harp-datasource-protocol#DecodedTile}.
 * @internal
 */
class TileGeometryCreator {
    /**
     *  Creates an instance of TileGeometryCreator. Access is allowed only through `instance`.
     */
    constructor() {
        //
    }
    /**
     * The `instance` of the `TileGeometryCreator`.
     *
     * @returns TileGeometryCreator
     */
    static get instance() {
        return this.m_instance || (this.m_instance = new TileGeometryCreator());
    }
    /**
     * Apply `enabledKinds` and `disabledKinds` to all techniques in the `decodedTile`. If a
     * technique is identified as disabled, its property `enabled` is set to `false`.
     *
     * @param decodedTile - The decodedTile containing the actual tile map data.
     * @param enabledKinds - Optional [[GeometryKindSet]] used to specify which object kinds should be
     *      created.
     * @param disabledKinds - Optional [[GeometryKindSet]] used to filter objects that should not be
     *      created.
     */
    initDecodedTile(decodedTile, enabledKinds, disabledKinds) {
        for (const technique of decodedTile.techniques) {
            const kind = technique.kind;
            // No info about kind, no way to filter it.
            if (kind === undefined || (kind instanceof Set && kind.size === 0)) {
                technique._kindState = true;
                continue;
            }
            // Technique is enabled only if enabledKinds is defined and technique belongs to that set or
            // if that's not the case, disabledKinds must be undefined or technique does not belong to it.
            technique._kindState =
                !(disabledKinds !== undefined && disabledKinds.hasOrIntersects(kind)) ||
                    (enabledKinds !== undefined && enabledKinds.hasOrIntersects(kind));
        }
        for (const srcGeometry of decodedTile.geometries) {
            for (const group of srcGeometry.groups) {
                group.createdOffsets = [];
            }
        }
    }
    /**
     * Called after the `Tile` has been decoded. It is required to call `initDecodedTile` before
     * calling this method.
     *
     * @see [[TileGeometryCreator#initDecodedTile]]
     *
     * @param tile - The {@link Tile} to process.
     * @param decodedTile - The decodedTile containing the actual tile map data.
     * @returns Promise resolved when all textures are ready to render.
     */
    createAllGeometries(tile, decodedTile) {
        const filter = (technique) => {
            return technique._kindState !== false;
        };
        let texturesReady = Promise.resolve();
        const onNewTexture = (texturePromise) => {
            texturesReady = Promise.all([
                texturesReady,
                texturePromise
                    .then(texture => {
                    tile.addOwnedTexture(texture);
                    if (!texture.image) {
                        return Promise.resolve();
                    }
                    return new Promise(resolve => {
                        texture.onUpdate = () => {
                            texture.onUpdate = null;
                            resolve();
                        };
                        tile.mapView.renderer.initTexture(texture);
                    });
                })
                    .catch(() => { }) // Keep waiting for the other textures even if one fails.
            ]);
        };
        this.createObjects(tile, decodedTile, onNewTexture, filter);
        this.preparePois(tile, decodedTile);
        // TextElements do not get their geometry created by Tile, but are managed on a
        // higher level.
        const textFilter = (technique) => {
            if (!harp_datasource_protocol_1.isPoiTechnique(technique) &&
                !harp_datasource_protocol_1.isLineMarkerTechnique(technique) &&
                !harp_datasource_protocol_1.isTextTechnique(technique)) {
                return false;
            }
            return filter(technique);
        };
        this.createTextElements(tile, decodedTile, textFilter);
        this.createLabelRejectionElements(tile, decodedTile);
        // HARP-7899, disable ground plane for globe
        if (tile.dataSource.addGroundPlane && tile.projection.type === harp_geoutils_1.ProjectionType.Planar) {
            // The ground plane is required for when we zoom in and we fall back to the parent
            // (whilst the new tiles are loading), in that case the ground plane ensures that the
            // parent's geometry doesn't show through.
            AddGroundPlane_1.addGroundPlane(tile, -1);
        }
        return texturesReady;
    }
    createLabelRejectionElements(tile, decodedTile) {
        if (decodedTile.pathGeometries === undefined) {
            return;
        }
        for (const path of decodedTile.pathGeometries) {
            tile.addBlockingElement(new PathBlockingElement_1.PathBlockingElement(path.path));
        }
    }
    /**
     * Processes the given tile and assign default values for geometry kinds,
     * render orders and label priorities.
     *
     * @param {Tile} tile
     * @param {(GeometryKindSet | undefined)} enabledKinds
     * @param {(GeometryKindSet | undefined)} disabledKinds
     */
    processTechniques(tile, enabledKinds, disabledKinds) {
        const decodedTile = tile.decodedTile;
        if (decodedTile === undefined) {
            return;
        }
        // Speedup and simplify following code: Test all techniques if they intersect with
        // enabledKinds and disabledKinds, in which case they are flagged. The disabledKinds can be
        // ignored hereafter.
        this.initDecodedTile(decodedTile, enabledKinds, disabledKinds);
        // compile the dynamic expressions.
        const exprPool = tile.dataSource.exprPool;
        decodedTile.techniques.forEach((technique) => {
            for (const propertyName in technique) {
                if (!technique.hasOwnProperty(propertyName)) {
                    continue;
                }
                const value = technique[propertyName];
                if (harp_datasource_protocol_1.isJsonExpr(value) && propertyName !== "kind") {
                    // "kind" is reserved.
                    try {
                        let expr = harp_datasource_protocol_1.Expr.fromJSON(value);
                        if (expr.dependencies().volatile !== true) {
                            expr = new MemoCallExpr(harp_datasource_protocol_1.Expr.fromJSON(value));
                        }
                        technique[propertyName] = expr.intern(exprPool);
                    }
                    catch (error) {
                        logger.error("Failed to compile expression:", error);
                    }
                }
            }
        });
    }
    /**
     * Splits the text paths that contain sharp corners.
     *
     * @param tile - The {@link Tile} to process paths on.
     * @param textPathGeometries - The original path geometries that may have defects.
     * @param textFilter -: Optional filter. Should return true for any text technique that is
     *      applicable.
     */
    prepareTextPaths(textPathGeometries, decodedTile, textFilter) {
        const processedPaths = new Array();
        const newPaths = textPathGeometries.slice();
        while (newPaths.length > 0) {
            const textPath = newPaths.pop();
            if (textPath === undefined) {
                break;
            }
            const technique = decodedTile.techniques[textPath.technique];
            if (!harp_datasource_protocol_1.isTextTechnique(technique) ||
                (textFilter !== undefined && !textFilter(technique))) {
                continue;
            }
            processedPaths.push(textPath);
        }
        return processedPaths;
    }
    /**
     * Creates {@link TextElement} objects from the decoded tile and list of materials specified. The
     * priorities of the {@link TextElement}s are updated to simplify label placement.
     *
     * @param tile - The {@link Tile} to create the testElements on.
     * @param decodedTile - The {@link @here/harp-datasource-protocol#DecodedTile}.
     * @param textFilter -: Optional filter. Should return true for any text technique that is
     *      applicable.
     */
    createTextElements(tile, decodedTile, textFilter) {
        var _a;
        const mapView = tile.mapView;
        const worldOffsetX = tile.computeWorldOffsetX();
        const discreteZoomLevel = Math.floor(mapView.zoomLevel);
        const discreteZoomEnv = new harp_datasource_protocol_1.MapEnv({ $zoom: discreteZoomLevel }, mapView.env);
        const textElementBuilder = new TextElementBuilder_1.TextElementBuilder(discreteZoomEnv, tile.textStyleCache, tile.dataSource.dataSourceOrder);
        if (decodedTile.textPathGeometries !== undefined) {
            const textPathGeometries = this.prepareTextPaths(decodedTile.textPathGeometries, decodedTile, textFilter);
            for (const textPath of textPathGeometries) {
                const technique = decodedTile.techniques[textPath.technique];
                if (technique._kindState === false ||
                    !harp_datasource_protocol_1.isTextTechnique(technique) ||
                    (textFilter !== undefined && !textFilter(technique))) {
                    continue;
                }
                const path = [];
                for (let i = 0; i < textPath.path.length; i += 3) {
                    path.push(new THREE.Vector3(textPath.path[i] + worldOffsetX, textPath.path[i + 1], textPath.path[i + 2]));
                }
                const textElement = textElementBuilder
                    .withTechnique(technique)
                    .build(textPath.text, path, tile.offset, tile.dataSource.name, tile.dataSource.dataSourceOrder, textPath.objInfos, textPath.pathLengthSqr);
                tile.addTextElement(textElement);
            }
        }
        if (decodedTile.textGeometries !== undefined) {
            for (const text of decodedTile.textGeometries) {
                if (text.technique === undefined || text.stringCatalog === undefined) {
                    continue;
                }
                const technique = decodedTile.techniques[text.technique];
                if (technique._kindState === false ||
                    !harp_datasource_protocol_1.isTextTechnique(technique) ||
                    (textFilter !== undefined && !textFilter(technique))) {
                    continue;
                }
                const positions = new THREE.BufferAttribute(new Float64Array(text.positions.buffer), text.positions.itemCount);
                const numPositions = positions.count;
                if (numPositions < 1) {
                    continue;
                }
                textElementBuilder.withTechnique(technique);
                for (let i = 0; i < numPositions; ++i) {
                    const x = positions.getX(i) + worldOffsetX;
                    const y = positions.getY(i);
                    const z = positions.getZ(i);
                    const label = text.stringCatalog[text.texts[i]];
                    if (label === undefined) {
                        // skip missing labels
                        continue;
                    }
                    const attributes = (_a = text.objInfos) === null || _a === void 0 ? void 0 : _a[i];
                    const point = new THREE.Vector3(x, y, z);
                    const textElement = textElementBuilder.build(label, point, tile.offset, tile.dataSource.name, tile.dataSource.dataSourceOrder, attributes);
                    tile.addTextElement(textElement);
                }
            }
        }
    }
    /**
     * Creates `Tile` objects from the decoded tile and list of materials specified.
     *
     * @param tile - The {@link Tile} to create the geometry on.
     * @param decodedTile - The {@link @here/harp-datasource-protocol#DecodedTile}.
     * @param onTextureCreated - Callback for each texture created, getting a promise that will be
     * resolved once the texture is loaded. Texture is not uploaded to GPU.
     * @param techniqueFilter -: Optional filter. Should return true for any technique that is
     *      applicable.
     */
    createObjects(tile, decodedTile, onTextureCreated, techniqueFilter) {
        var _a, _b, _c, _d, _e, _f;
        const mapView = tile.mapView;
        const materials = [];
        const extrudedMaterials = [];
        const animatedExtrusionHandler = mapView.animatedExtrusionHandler;
        const discreteZoomLevel = Math.floor(mapView.zoomLevel);
        const discreteZoomEnv = new harp_datasource_protocol_1.MapEnv({ $zoom: discreteZoomLevel }, mapView.env);
        const objects = tile.objects;
        const viewRanges = mapView.viewRanges;
        const elevationEnabled = mapView.elevationProvider !== undefined;
        for (const attachment of this.getAttachments(decodedTile)) {
            const srcGeometry = attachment.geometry;
            const groups = attachment.info.groups;
            const groupCount = groups.length;
            for (let groupIndex = 0; groupIndex < groupCount;) {
                const group = groups[groupIndex++];
                const start = group.start;
                const techniqueIndex = group.technique;
                const technique = decodedTile.techniques[techniqueIndex];
                if (group.createdOffsets === undefined) {
                    group.createdOffsets = [];
                }
                if (group.createdOffsets.includes(tile.offset) ||
                    technique._kindState === false ||
                    (techniqueFilter !== undefined && !techniqueFilter(technique))) {
                    continue;
                }
                let count = group.count;
                group.createdOffsets.push(tile.offset);
                // compress consecutive groups
                for (; groupIndex < groupCount && groups[groupIndex].technique === techniqueIndex; ++groupIndex) {
                    if (start + count !== groups[groupIndex].start) {
                        break;
                    }
                    count += groups[groupIndex].count;
                    // Mark this group as created, so it does not get processed again.
                    groups[groupIndex].createdOffsets.push(tile.offset);
                }
                if (!DecodedTileHelpers_1.usesObject3D(technique)) {
                    continue;
                }
                const extrusionAnimationEnabled = (_a = animatedExtrusionHandler === null || animatedExtrusionHandler === void 0 ? void 0 : animatedExtrusionHandler.setAnimationProperties(technique, discreteZoomEnv)) !== null && _a !== void 0 ? _a : false;
                let material = materials[techniqueIndex];
                if (material === undefined) {
                    material = DecodedTileHelpers_1.createMaterial(mapView.renderer.capabilities, {
                        technique,
                        env: mapView.env,
                        fog: mapView.scene.fog !== null,
                        shadowsEnabled: mapView.shadowsEnabled
                    }, onTextureCreated);
                    if (material === undefined) {
                        continue;
                    }
                    if (extrusionAnimationEnabled && harp_materials_1.hasExtrusionFeature(material)) {
                        addToExtrudedMaterials(material, extrudedMaterials);
                    }
                    materials[techniqueIndex] = material;
                }
                const techniqueKind = technique.kind;
                // Modify the standard textured shader to support height-based coloring.
                if (harp_datasource_protocol_1.isTerrainTechnique(technique)) {
                    this.setupTerrainMaterial(technique, material, tile.mapView.clearColor);
                }
                const bufferGeometry = new THREE.BufferGeometry();
                (_b = srcGeometry.vertexAttributes) === null || _b === void 0 ? void 0 : _b.forEach(vertexAttribute => {
                    const buffer = attachment.getBufferAttribute(vertexAttribute);
                    bufferGeometry.setAttribute(vertexAttribute.name, buffer);
                });
                (_c = srcGeometry.interleavedVertexAttributes) === null || _c === void 0 ? void 0 : _c.forEach(attr => {
                    attachment
                        .getInterleavedBufferAttributes(attr)
                        .forEach(({ name, attribute }) => bufferGeometry.setAttribute(name, attribute));
                });
                const index = (_d = attachment.info.index) !== null && _d !== void 0 ? _d : srcGeometry.index;
                if (index) {
                    bufferGeometry.setIndex(attachment.getBufferAttribute(index));
                }
                if (!bufferGeometry.getAttribute("normal") && harp_datasource_protocol_1.needsVertexNormals(technique)) {
                    bufferGeometry.computeVertexNormals();
                }
                bufferGeometry.addGroup(start, count);
                if (harp_datasource_protocol_1.isSolidLineTechnique(technique)) {
                    // TODO: Unify access to shader defines via SolidLineMaterial setters
                    harp_utils_1.assert(!harp_materials_1.isHighPrecisionLineMaterial(material));
                    const lineMaterial = material;
                    if (technique.clipping === true &&
                        tile.projection.type === harp_geoutils_1.ProjectionType.Planar) {
                        tile.boundingBox.getSize(tmpVector3);
                        tmpVector2.set(tmpVector3.x, tmpVector3.y);
                        lineMaterial.clipTileSize = tmpVector2;
                    }
                    if (bufferGeometry.getAttribute("color")) {
                        harp_materials_1.setShaderMaterialDefine(lineMaterial, "USE_COLOR", true);
                    }
                }
                // Add the solid line outlines as a separate object.
                const hasSolidLinesOutlines = harp_datasource_protocol_1.isSolidLineTechnique(technique) && technique.secondaryWidth !== undefined;
                // When the source geometry is split in groups, we
                // should create objects with an array of materials.
                const hasFeatureGroups = harp_datasource_protocol_1.Expr.isExpr(technique.enabled) &&
                    srcGeometry.featureStarts &&
                    srcGeometry.featureStarts.length > 0;
                const object = DecodedTileHelpers_1.buildObject(technique, bufferGeometry, hasFeatureGroups ? [material] : material, tile, elevationEnabled);
                object.renderOrder = harp_datasource_protocol_1.getPropertyValue(technique.renderOrder, mapView.env);
                if (attachment.info.uuid !== undefined) {
                    object.uuid = attachment.info.uuid;
                    object.userData.geometryId = attachment.info.uuid;
                }
                if ((harp_datasource_protocol_1.isCirclesTechnique(technique) || harp_datasource_protocol_1.isSquaresTechnique(technique)) &&
                    technique.enablePicking !== undefined) {
                    object.enableRayTesting = technique.enablePicking;
                }
                if (harp_datasource_protocol_1.isLineTechnique(technique) || harp_datasource_protocol_1.isSegmentsTechnique(technique)) {
                    const fadingParams = this.getFadingParams(discreteZoomEnv, technique);
                    harp_materials_1.FadingFeature.addRenderHelper(object, viewRanges, fadingParams.fadeNear, fadingParams.fadeFar, false);
                }
                if (harp_datasource_protocol_1.isSolidLineTechnique(technique)) {
                    const fadingParams = this.getFadingParams(discreteZoomEnv, technique);
                    harp_materials_1.FadingFeature.addRenderHelper(object, viewRanges, fadingParams.fadeNear, fadingParams.fadeFar, false);
                }
                if (harp_datasource_protocol_1.isExtrudedLineTechnique(technique)) {
                    // extruded lines are normal meshes, and need transparency only when fading or
                    // dynamic properties is defined.
                    if (technique.fadeFar !== undefined) {
                        const fadingParams = this.getFadingParams(mapView.env, technique);
                        harp_materials_1.FadingFeature.addRenderHelper(object, viewRanges, fadingParams.fadeNear, fadingParams.fadeFar, true);
                    }
                }
                this.addUserData(tile, srcGeometry, technique, object);
                if (harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique)) {
                    object.castShadow = mapView.shadowsEnabled;
                    object.receiveShadow = mapView.shadowsEnabled;
                }
                else if (harp_datasource_protocol_1.isStandardTechnique(technique) || harp_datasource_protocol_1.isFillTechnique(technique)) {
                    object.receiveShadow = mapView.shadowsEnabled;
                }
                if (harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique) ||
                    harp_datasource_protocol_1.isStandardTechnique(technique) ||
                    harp_datasource_protocol_1.isFillTechnique(technique)) {
                    // filled polygons are normal meshes, and need transparency only when fading or
                    // dynamic properties is defined.
                    if (technique.fadeFar !== undefined) {
                        const fadingParams = this.getFadingParams(discreteZoomEnv, technique);
                        harp_materials_1.FadingFeature.addRenderHelper(object, viewRanges, fadingParams.fadeNear, fadingParams.fadeFar, true);
                    }
                }
                const renderDepthPrePass = harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique) &&
                    DepthPrePass_1.isRenderDepthPrePassEnabled(technique, discreteZoomEnv);
                if (renderDepthPrePass) {
                    const depthPassMesh = DepthPrePass_1.createDepthPrePassMesh(object);
                    this.addUserData(tile, srcGeometry, technique, depthPassMesh);
                    // Set geometry kind for depth pass mesh so that it gets the displacement map
                    // for elevation overlay.
                    RegisterTileObject_1.registerTileObject(tile, depthPassMesh, techniqueKind, {
                        technique,
                        pickability: harp_datasource_protocol_1.Pickability.transient
                    });
                    objects.push(depthPassMesh);
                    if (extrusionAnimationEnabled) {
                        addToExtrudedMaterials(depthPassMesh.material, extrudedMaterials);
                    }
                    DepthPrePass_1.setDepthPrePassStencil(depthPassMesh, object);
                }
                const techniquePickability = harp_datasource_protocol_1.transientToPickability(harp_datasource_protocol_1.getPropertyValue(technique.transient, mapView.env));
                // register all objects as pickable except solid lines with outlines, in that case
                // it's enough to make outlines pickable.
                RegisterTileObject_1.registerTileObject(tile, object, techniqueKind, {
                    technique,
                    pickability: hasSolidLinesOutlines
                        ? harp_datasource_protocol_1.Pickability.transient
                        : techniquePickability
                });
                objects.push(object);
                // Add the extruded polygon edges as a separate geometry.
                if (harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique) &&
                    attachment.info.edgeIndex !== undefined) {
                    // When the source geometry is split in groups, we
                    // should create objects with an array of materials.
                    const hasEdgeFeatureGroups = harp_datasource_protocol_1.Expr.isExpr(technique.enabled) &&
                        srcGeometry.edgeFeatureStarts &&
                        srcGeometry.edgeFeatureStarts.length > 0;
                    const buildingTechnique = technique;
                    const edgeGeometry = new THREE.BufferGeometry();
                    edgeGeometry.setAttribute("position", bufferGeometry.getAttribute("position"));
                    const colorAttribute = bufferGeometry.getAttribute("color");
                    if (colorAttribute !== undefined) {
                        edgeGeometry.setAttribute("color", colorAttribute);
                    }
                    const extrusionAttribute = bufferGeometry.getAttribute("extrusionAxis");
                    if (extrusionAttribute !== undefined) {
                        edgeGeometry.setAttribute("extrusionAxis", extrusionAttribute);
                    }
                    const normalAttribute = bufferGeometry.getAttribute("normal");
                    if (normalAttribute !== undefined) {
                        edgeGeometry.setAttribute("normal", normalAttribute);
                    }
                    const uvAttribute = bufferGeometry.getAttribute("uv");
                    if (uvAttribute !== undefined) {
                        edgeGeometry.setAttribute("uv", uvAttribute);
                    }
                    edgeGeometry.setIndex(attachment.getBufferAttribute(attachment.info.edgeIndex));
                    // Read the uniforms from the technique values (and apply the default values).
                    const extrudedPolygonTechnique = technique;
                    const fadingParams = this.getPolygonFadingParams(discreteZoomEnv, extrudedPolygonTechnique);
                    // Configure the edge material based on the theme values.
                    const materialParams = {
                        color: fadingParams.color,
                        colorMix: fadingParams.colorMix,
                        fadeNear: fadingParams.lineFadeNear,
                        fadeFar: fadingParams.lineFadeFar,
                        extrusionRatio: extrusionAnimationEnabled ? 0 : undefined,
                        vertexColors: bufferGeometry.getAttribute("color") ? true : false,
                        rendererCapabilities: mapView.renderer.capabilities
                    };
                    const edgeMaterial = new harp_materials_1.EdgeMaterial(materialParams);
                    const edgeObj = new THREE.LineSegments(edgeGeometry, hasEdgeFeatureGroups ? [edgeMaterial] : edgeMaterial);
                    this.addUserData(tile, srcGeometry, technique, edgeObj);
                    // Set the correct render order.
                    edgeObj.renderOrder = object.renderOrder + 0.1;
                    harp_materials_1.FadingFeature.addRenderHelper(edgeObj, viewRanges, fadingParams.lineFadeNear, fadingParams.lineFadeFar, false);
                    if (extrusionAnimationEnabled) {
                        addToExtrudedMaterials(edgeObj.material, extrudedMaterials);
                    }
                    RegisterTileObject_1.registerTileObject(tile, edgeObj, techniqueKind, {
                        technique,
                        pickability: harp_datasource_protocol_1.Pickability.transient
                    });
                    MapMaterialAdapter_1.MapMaterialAdapter.create(edgeMaterial, {
                        color: buildingTechnique.lineColor,
                        objectColor: buildingTechnique.color,
                        opacity: buildingTechnique.opacity,
                        lineWidth: (frameMapView) => {
                            // lineWidth for ExtrudedPolygonEdges only supports 0 or 1
                            const value = harp_datasource_protocol_1.getPropertyValue(buildingTechnique.lineWidth, frameMapView.env);
                            if (typeof value === "number") {
                                return THREE.MathUtils.clamp(value, 0, 1);
                            }
                            else {
                                return 0;
                            }
                        }
                    });
                    objects.push(edgeObj);
                }
                // animate the extrusion of buildings
                if (harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique) && extrusionAnimationEnabled) {
                    object.customDepthMaterial = new harp_materials_1.MapMeshDepthMaterial({
                        depthPacking: THREE.RGBADepthPacking
                    });
                    addToExtrudedMaterials(object.customDepthMaterial, extrudedMaterials);
                }
                // Add the fill area edges as a separate geometry.
                if (harp_datasource_protocol_1.isFillTechnique(technique) && attachment.info.edgeIndex) {
                    const hasEdgeFeatureGroups = harp_datasource_protocol_1.Expr.isExpr(technique.enabled) &&
                        srcGeometry.edgeFeatureStarts &&
                        srcGeometry.edgeFeatureStarts.length > 0;
                    const outlineGeometry = new THREE.BufferGeometry();
                    outlineGeometry.setAttribute("position", bufferGeometry.getAttribute("position"));
                    outlineGeometry.setIndex(attachment.getBufferAttribute(attachment.info.edgeIndex));
                    const fillTechnique = technique;
                    const fadingParams = this.getPolygonFadingParams(mapView.env, fillTechnique);
                    // Configure the edge material based on the theme values.
                    const materialParams = {
                        color: fadingParams.color,
                        colorMix: fadingParams.colorMix,
                        fadeNear: fadingParams.lineFadeNear,
                        fadeFar: fadingParams.lineFadeFar,
                        vertexColors: bufferGeometry.getAttribute("color") ? true : false,
                        rendererCapabilities: mapView.renderer.capabilities
                    };
                    const outlineMaterial = new harp_materials_1.EdgeMaterial(materialParams);
                    const outlineObj = new THREE.LineSegments(outlineGeometry, hasEdgeFeatureGroups ? [outlineMaterial] : outlineMaterial);
                    outlineObj.renderOrder = object.renderOrder + 0.1;
                    harp_materials_1.FadingFeature.addRenderHelper(outlineObj, viewRanges, fadingParams.lineFadeNear, fadingParams.lineFadeFar, false);
                    this.addUserData(tile, srcGeometry, technique, outlineObj);
                    RegisterTileObject_1.registerTileObject(tile, outlineObj, techniqueKind, {
                        technique,
                        pickability: techniquePickability
                    });
                    MapMaterialAdapter_1.MapMaterialAdapter.create(outlineMaterial, {
                        color: fillTechnique.lineColor,
                        objectColor: fillTechnique.color,
                        opacity: fillTechnique.opacity
                    });
                    objects.push(outlineObj);
                }
                // Add the fill area edges as a separate geometry.
                if (hasSolidLinesOutlines) {
                    const outlineTechnique = technique;
                    const outlineMaterial = material.clone();
                    DecodedTileHelpers_1.applyBaseColorToMaterial(outlineMaterial, outlineMaterial.color, outlineTechnique, (_e = outlineTechnique.secondaryColor) !== null && _e !== void 0 ? _e : 0x000000, discreteZoomEnv);
                    if (outlineTechnique.secondaryCaps !== undefined) {
                        outlineMaterial.caps = harp_datasource_protocol_1.getPropertyValue(outlineTechnique.secondaryCaps, mapView.env);
                    }
                    const outlineObj = DecodedTileHelpers_1.buildObject(technique, bufferGeometry, outlineMaterial, tile, elevationEnabled);
                    outlineObj.renderOrder =
                        ((_f = harp_datasource_protocol_1.getPropertyValue(outlineTechnique.secondaryRenderOrder, mapView.env)) !== null && _f !== void 0 ? _f : 0) - 0.0000001;
                    this.addUserData(tile, srcGeometry, technique, outlineObj);
                    const fadingParams = this.getFadingParams(discreteZoomEnv, technique);
                    harp_materials_1.FadingFeature.addRenderHelper(outlineObj, viewRanges, fadingParams.fadeNear, fadingParams.fadeFar, false);
                    const secondaryWidth = DecodedTileHelpers_1.buildMetricValueEvaluator(outlineTechnique.secondaryWidth, outlineTechnique.metricUnit);
                    RegisterTileObject_1.registerTileObject(tile, outlineObj, techniqueKind, { technique });
                    const mainMaterialAdapter = MapMaterialAdapter_1.MapMaterialAdapter.get(material);
                    const outlineMaterialAdapter = MapMaterialAdapter_1.MapMaterialAdapter.create(outlineMaterial, {
                        color: outlineTechnique.secondaryColor,
                        opacity: outlineTechnique.opacity,
                        caps: outlineTechnique.secondaryCaps,
                        // Still handled above
                        lineWidth: (frameMapView) => {
                            if (!mainMaterialAdapter) {
                                return;
                            }
                            mainMaterialAdapter.ensureUpdated(frameMapView);
                            const mainLineWidth = mainMaterialAdapter.currentStyledProperties.lineWidth;
                            const secondaryLineWidth = harp_datasource_protocol_1.getPropertyValue(secondaryWidth, mapView.env);
                            const opacity = outlineMaterialAdapter.currentStyledProperties
                                .opacity;
                            if (typeof mainLineWidth === "number" &&
                                typeof secondaryLineWidth === "number") {
                                if (secondaryLineWidth <= mainLineWidth &&
                                    (opacity === null || opacity === undefined || opacity === 1)) {
                                    // We could mark object as invisible somehow, not sure how
                                    // objectAdapter.markInvisible();
                                    return 0;
                                }
                                else {
                                    return secondaryLineWidth;
                                }
                            }
                            else {
                                return 0;
                            }
                        }
                    });
                    objects.push(outlineObj);
                }
            }
        }
        if (extrudedMaterials.length > 0) {
            mapView.animatedExtrusionHandler.add(tile, extrudedMaterials);
        }
    }
    /**
     * Prepare the {@link Tile}s pois. Uses the {@link PoiManager} in {@link MapView}.
     */
    preparePois(tile, decodedTile) {
        if (decodedTile.poiGeometries !== undefined) {
            tile.mapView.poiManager.addPois(tile, decodedTile);
        }
    }
    /**
     * Gets the attachments of the given {@link @here/harp-datasource-protocol#DecodedTile}.
     *
     * @param decodedTile - The {@link @here/harp-datasource-protocol#DecodedTile}.
     */
    *getAttachments(decodedTile) {
        const cache = new AttachmentCache();
        for (const geometry of decodedTile.geometries) {
            // the main attachment
            const mainAttachment = {
                index: geometry.index,
                edgeIndex: geometry.edgeIndex,
                uuid: geometry.uuid,
                groups: geometry.groups
            };
            yield new AttachmentInfo(geometry, mainAttachment, cache);
            if (geometry.attachments) {
                // the additional attachments
                for (const info of geometry.attachments) {
                    yield new AttachmentInfo(geometry, info, cache);
                }
            }
        }
    }
    setupTerrainMaterial(technique, material, terrainColor) {
        if (!technique.map || !technique.displacementMap) {
            // Render terrain using the given color.
            const stdMaterial = material;
            stdMaterial.color.set(terrainColor);
            // Remove displacement map, otherwise it would elevate terrain geometry and make it
            // twice as high as it should be.
            harp_materials_1.setDisplacementMapToMaterial(null, stdMaterial);
            return;
        }
        // Render terrain using height-based colors.
        material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace("#include <map_pars_fragment>", `#include <map_pars_fragment>
    uniform sampler2D displacementMap;
    uniform float displacementScale;
    uniform float displacementBias;`);
            shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#ifdef USE_MAP
    float minElevation = ${harp_geoutils_1.EarthConstants.MIN_ELEVATION.toFixed(1)};
    float maxElevation = ${harp_geoutils_1.EarthConstants.MAX_ELEVATION.toFixed(1)};
    float elevationRange = maxElevation - minElevation;

    float disp = texture2D( displacementMap, vUv ).x * displacementScale + displacementBias;
    vec4 texelColor = texture2D( map, vec2((disp - minElevation) / elevationRange, 0.0) );
    texelColor = mapTexelToLinear( texelColor );
    diffuseColor *= texelColor;
#endif`);
            // We remove the displacement map from manipulating the vertices, it is
            // however still required for the pixel shader, so it can't be directly
            // removed.
            shader.vertexShader = shader.vertexShader.replace("#include <displacementmap_vertex>", "");
        };
        material.displacementMap.needsUpdate = true;
    }
    addUserData(tile, srcGeometry, technique, object) {
        if (harp_datasource_protocol_1.isTerrainTechnique(technique)) {
            harp_utils_1.assert(Object.keys(object.userData).length === 0, "Unexpected user data in terrain object");
            harp_utils_1.assert(typeof srcGeometry.objInfos[0] === "object", "Wrong attribute map type for terrain geometry");
            const displacementMap = srcGeometry.objInfos[0];
            const tileDisplacementMap = {
                tileKey: tile.tileKey,
                texture: new THREE.DataTexture(displacementMap.buffer, displacementMap.xCountVertices, displacementMap.yCountVertices, THREE.LuminanceFormat, THREE.FloatType),
                displacementMap,
                geoBox: tile.geoBox
            };
            object.userData = tileDisplacementMap;
        }
        else {
            // Set the feature data for picking with `MapView.intersectMapObjects()` except for
            // solid-line which uses tile-based picking.
            const isOutline = object.type === "LineSegments" &&
                (harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique) || harp_datasource_protocol_1.isFillTechnique(technique));
            const featureData = {
                geometryType: srcGeometry.type,
                starts: isOutline ? srcGeometry.edgeFeatureStarts : srcGeometry.featureStarts,
                objInfos: srcGeometry.objInfos
            };
            object.userData.feature = featureData;
            object.userData.technique = technique;
        }
    }
    /**
     * Gets the fading parameters for several kinds of objects.
     */
    getFadingParams(env, technique) {
        const fadeNear = technique.fadeNear !== undefined
            ? harp_datasource_protocol_1.getPropertyValue(technique.fadeNear, env)
            : harp_materials_1.FadingFeature.DEFAULT_FADE_NEAR;
        const fadeFar = technique.fadeFar !== undefined
            ? harp_datasource_protocol_1.getPropertyValue(technique.fadeFar, env)
            : harp_materials_1.FadingFeature.DEFAULT_FADE_FAR;
        return {
            fadeNear,
            fadeFar
        };
    }
    /**
     * Gets the fading parameters for several kinds of objects.
     */
    getPolygonFadingParams(env, technique) {
        let color;
        let colorMix = harp_materials_1.EdgeMaterial.DEFAULT_COLOR_MIX;
        if (technique.lineColor !== undefined) {
            color = harp_datasource_protocol_1.getPropertyValue(technique.lineColor, env);
            if (harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique)) {
                const extrudedPolygonTechnique = technique;
                colorMix =
                    extrudedPolygonTechnique.lineColorMix !== undefined
                        ? extrudedPolygonTechnique.lineColorMix
                        : harp_materials_1.EdgeMaterial.DEFAULT_COLOR_MIX;
            }
        }
        const fadeNear = technique.fadeNear !== undefined
            ? harp_datasource_protocol_1.getPropertyValue(technique.fadeNear, env)
            : harp_materials_1.FadingFeature.DEFAULT_FADE_NEAR;
        const fadeFar = technique.fadeFar !== undefined
            ? harp_datasource_protocol_1.getPropertyValue(technique.fadeFar, env)
            : harp_materials_1.FadingFeature.DEFAULT_FADE_FAR;
        const lineFadeNear = technique.lineFadeNear !== undefined
            ? harp_datasource_protocol_1.getPropertyValue(technique.lineFadeNear, env)
            : fadeNear;
        const lineFadeFar = technique.lineFadeFar !== undefined
            ? harp_datasource_protocol_1.getPropertyValue(technique.lineFadeFar, env)
            : fadeFar;
        if (color === undefined) {
            color = harp_materials_1.EdgeMaterial.DEFAULT_COLOR;
        }
        return {
            color,
            colorMix,
            fadeNear,
            fadeFar,
            lineFadeNear,
            lineFadeFar
        };
    }
}
exports.TileGeometryCreator = TileGeometryCreator;
export default exports
//# sourceMappingURL=TileGeometryCreator.js.map