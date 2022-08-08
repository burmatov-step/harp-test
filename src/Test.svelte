<script lang="ts">
    import MapView  from "./harp-mapview/MapView";
    import GeoCoordinates from "./harp-geoutils/GeoCoordinates";
    import VectorTileDataSource from "./harp-vectortile-datasource/VectorTileDataSource";
    import { sphereProjection } from "@here/harp-geoutils";
    import { MapControls, MapControlsUI } from "@here/harp-map-controls";

    export let canvas;
    const mapView = new MapView.MapView({
        canvas,
        theme: "https://unpkg.com/@here/harp-map-theme@latest/resources/berlin_tilezen_night_reduced.json"
    });

    mapView.lookAt({
        target: new GeoCoordinates.GeoCoordinates(55.16444, 61.436844),
        zoomLevel: 16,
    });

    mapView.resize(window.innerWidth, window.innerHeight);
    mapView.resize(window.innerWidth, window.innerHeight);
    window.onresize = () =>
        mapView.resize(window.innerWidth, window.innerHeight);

    const vectorTileDataSource = new VectorTileDataSource.VectorTileDataSource({
        authenticationCode: "MrjsmGR9zzsvQL95XpcWuuIuubDGwY7ypkPO_DVBj0U",
    });

    mapView.addDataSource(vectorTileDataSource);
</script>
