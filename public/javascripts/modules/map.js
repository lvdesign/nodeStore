import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
    center: {lat:43.2, lng: -79.8},
    zoom: 10
}
// Places 
function loadPlaces(map, lat= 43.2, lng=-79.8) {
    //console.log();
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
        const places = res.data;
        //console.log(places);
        if(!places.length){
            alert('no places found!');
            return;
        }
        // create a bonds
        const bounds = new google.maps.LatLngBounds();
        const infoWindow = new google.maps.InfoWindow();

        const markers = places.map(place =>{
            const [placeLng, placeLat] = place.location.coordinates;
            //console.log(placeLng, placeLat);
            const position= {lat:placeLat, lng:placeLng};
            bounds.extend(position);
            const marker = new google.maps.Marker({ map:map, position:position  })
            marker.place = place;
            return marker;
        });
        // clicks on Markers
        markers.forEach(marker => marker.addListener('click', function(){
            //console.log(this.place);
            const html= ` 
            <div class="popup>
            <a href="/stores/${this.place.slug}">
            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" style="height:50px;"/>
            </a>
            <p>${this.place.name}- ${this.place.location.address}</p>
            </div>`;
            infoWindow.setContent(html);
            infoWindow.open(map, this);

        }))
        //console.log(markers)
        // then zoom Map to fit Markers
        map.setCenter(bounds.getCenter());
        map.fitBounds(bounds);
    });
}

// Map
function makeMap(mapDiv){
//console.log(mapDiv);
if(!mapDiv) return;
// makeMap
const map = new google.maps.Map(mapDiv, mapOptions);
loadPlaces(map);

const input = $('[name="geolocate"]');
// console.log(input);
const autocomplete = new google.maps.places.Autocomplete(input);
autocomplete.addListener('place_changed', ( )=> {
    const place = autocomplete.getPlace();
   //console.log(place)
   loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
})
}

//navigator.geolocation.getCurrentPosition


export default makeMap;