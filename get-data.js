class UsersManager {

    constructor() {
        this.users_api_url = "https://randomUser.me/api/?nat=fr";     // api to get random users
        this.weather_api_url_base = "https://api.open-meteo.com/v1/forecast?"
        this.geocoding_api_url = "https://geocoding-api.open-meteo.com/v1/search?name="
        this.weather_conditions = []
    }

    /** Fetches 'number' users from the api */
    getRandomUsers(number){
        let users = [];
        for (let i=0; i<number; i++) {
            fetch(this.users_api_url)
            .then(result => {return result.json();})
            .then(data => {
                let fisrtname = data["results"][0]["name"]["first"];
                let lastname = data["results"][0]["name"]["last"];
                let city = data["results"][0]["location"]["city"];
                fetch(this.geocoding_api_url+`${city}`)
                .then(result => {return result.json();})
                .then(geo_data => {
                    let latitude = geo_data["results"][0]["longitude"];
                    let longitude = geo_data["results"][0]["latitude"];
                    console.log(longitude, "and", latitude);
                    users.push([fisrtname+" "+lastname, [city, longitude, latitude]]);
                });
            });
        }
        return users;
    }

    getWeatherConditions([longitude, latitude]){
        api_url = this.weather_api_url_base.slice(0);
        api_url = api_url + `latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m`
        fetch(api_url)
            .then(result => {return result.json();})
            .then(data => {
                console.log(data);
            });

    }

    showMap(users){
        console.log("Users : ", users);
        var map = L.map('map').setView([46.00, 2.00], 6);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        for(user of users) {
            let longitude = parseInt(user[1][1]);
            let latitude = parseInt(user[1][2]);
            var marker = L.marker([46.00, 2.00]).addTo(map);
            marker.bindPopup(`<b>${user[0]}</b><br>${user[1][0]}`).openPopup();
        }
    }
    
}

window.onload = function() {
    usersManager = new UsersManager();
    let users = usersManager.getRandomUsers(1);
    console.log(users);
    usersManager.showMap(users);
}
