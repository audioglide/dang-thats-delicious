import axios from 'axios';
import {$} from './bling';
const mapOptions = {
    center: {lat: 43.2, lng: -79.8},
    zoom: 10
}

function loadPlaces(map, lat = 43.2, lng = -79.8) {
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
        .then(res => {
            const places = res.data;
            if(!places.length){
                alert('no places found');
                return;
            }
            
            // create bounds
            const bounds = new google.maps.LatLngBounds();
            const infoWindow = new google.maps.InfoWindow();
            
            const markers = places.map(place => {
                const [placeLng, placeLat] = place.location.coordinates;
                const position = {lat: placeLat, lng: placeLng};
                bounds.extend(position);
                const marker = new google.maps.Marker({
                    map: map,
                    position: position
                });
                marker.place = place;
                return marker;
            });
           
            // when someone clicks on a marker, show the details of that place
            markers.forEach(marker => marker.addListener('click', function(){
                infoWindow(marker);
            }));
           
            // then zoom the map to fit points
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds)
        });
}

//navigator.geolocation.getCurrentPosition

function makeMap(mapDiv) {
    if(!mapDiv) return;
    //make our map
    const map = new google.maps.Map(mapDiv, mapOptions);
    loadPlaces(map);
    const input = $('[name="geolocate"]');
    const autocomplete = new google.maps.places.Autocomplete(input);
}

export default makeMap;