/**************************************************************************************
 * Project : A website that picks a random french person every two seconds and shows  *
 *           their location and the weather on a leaflet map without exceeding        *
 *           a specified number. When this number is reached, the oldest person is    *
 *           removed from the map so a new one can be displayed.                      *
 * Author  : Axel N'cho                                                               *
***************************************************************************************/


/** Contains informations about a city: (name, coordinates and weather)
 */
class UserLocation {

    constructor(city) {
        this.city = city;
    }
}

/** Contains informations about a person: (name and location) */
class User{

    constructor(firstname, lastname, city) {
        this.name = `${firstname} ${lastname}`;
        this.location = new UserLocation(city);
    }
}

/** Retrieves data from the web and displays them on a map */
class DisplayManager {

    constructor(max_displayed_users) {
        this.users_api_url = "https://randomUser.me/api/?nat=fr";     // api to get random users
        this.geocoding_api_url = "https://geocoding-api.open-meteo.com/v1/search?name=";     // api to get the coordinates of a city
        this.weather_api_url = "https://api.open-meteo.com/v1/forecast?";       // api to get weather conditions in a city
        this.MAX_DISPLAYED_USERS = max_displayed_users;     // max number of users displayed on the map
        this.nb_displayed_users = 0;    // number of users currently displayed on the map
        this.markers = [];      // ordered list of all added markers. each marker corrsponds to a user. so, the first marker is the oldest.
        this.map = L.map('map').setView([46.00, 2.00], 6);      // the map
        this.configMap();
        this.setDateTimeFormat();
    }


    configMap() {
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(this.map);
    }

    /** Sets the date and time format as the one used in the JSON file provided by the weather api. */
    setDateTimeFormat() {
        // For todays date;
        Date.prototype.today = function () { 
            return this.getFullYear() + "-" + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) + "-" + ((this.getDate() < 10)?"0":"") + this.getDate();
        };

        // For the time now
        Date.prototype.timeNow = function () {
            return ((this.getHours() < 10)?"0":"") + this.getHours() +":00";
        };
    }

    /** Adds one new random user to the map then removes the oldest
     *  if the number of displayed users exceeds the maximum specified.
     */
    displayNewUser() {
        this.getRandomUser();
        this.nb_displayed_users += 1;
        if (this.nb_displayed_users > this.MAX_DISPLAYED_USERS) {
            this.map.removeLayer(this.markers[0]);      // remove the oldest marker from the map
            this.nb_displayed_users -= 1;
            this.markers = this.markers.slice(1);       // forget the oldest marker
        }
        console.log("Displayed :", this.nb_displayed_users);
    }

    /** Fetches one random user's name, city coordinates and city weather 
     *  then adds this user to the map
    */
    getRandomUser(){
        // fetch name and city and create a new User instance
        fetch(this.users_api_url)
        .then(result => {return result.json();})
        .then(data => {
            let firstname = data["results"][0]["name"]["first"];
            let lastname = data["results"][0]["name"]["last"];
            let city = data["results"][0]["location"]["city"];
            return new User(firstname, lastname, city);
        })
        // fetch the correct coordinates of the city
        .then(user => {
            fetch(this.geocoding_api_url+`${user.location.city}`)
            .then(result => {return result.json();})
            .then(data => {
                user.location.latitude = data["results"][0]["latitude"];
                user.location.longitude = data["results"][0]["longitude"];
                return user
            })
            // fetch the current temperature in the city
            .then(user => {
                fetch(this.weather_api_url + `latitude=${user.location.latitude}&longitude=${user.location.longitude}&hourly=temperature_2m`)
                .then(result => {return result.json();})
                .then(data => {
                    let current_datetime = new Date().today()+"T"+new Date().timeNow();
                    let current_datetime_index = data["hourly"]["time"].indexOf(current_datetime);
                    user.location.current_temp = data["hourly"]["temperature_2m"][current_datetime_index];
                    user.location.temp_unit =  data["hourly_units"]["temperature_2m"];
                    return user;
                })
                // add a new marker with the collected informations
                .then(user => { this.addNewMarker(user);});
            });
        });
    }

    /** Adds a new marker to the map with a pop-up that contains one user's name, 
     *  city name and city weather
     */
    addNewMarker(user){
        let marker = L.marker([user.location.latitude, user.location.longitude]).addTo(this.map);
        marker.bindPopup(`<b>${user.name}</b><br>${user.location.city}<br>${user.location.current_temp}&nbsp;${user.location.temp_unit}`).openPopup();
        this.markers.push(marker);
    }
}

window.onload = function() {
    var displayManager = new DisplayManager(max_displayed_users=10);
    update_map = function() {displayManager.displayNewUser();}
    setInterval(update_map, 2000);      // display a new user every two seconds
}
