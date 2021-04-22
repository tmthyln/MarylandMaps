function clearNode(id) {
    document.getElementById(id).innerText = '';
}

(async function () {
    'use strict';

    const filters = {
        location: new Set(),
        year: new Set(),
        mapType: new Set()
    };

    Vue.component('filters', {
        template: `
          <sidebar class="accordion" role="tablist" v-if="filterOptions !== null">
            <b-card no-body class="mb-1">
              <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button block v-b-toggle.accordion-1 variant="primary">Location</b-button>
              </b-card-header>
              <b-collapse id="accordion-1" accordion="filter-accordion" role="tabpanel">
                <b-card-body>
                  <div v-for="option in filterOptions.locations">
                    <input type="checkbox" v-bind:id="option" v-bind:name="option" v-bind:value="option">
                    <label v-bind:for="option">{{ option }}</label><br>
                  </div>
                </b-card-body>
              </b-collapse>
            </b-card>
            
            <b-card no-body class="mb-1">
              <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button block v-b-toggle.accordion-2 variant="primary">Year(s)</b-button>
              </b-card-header>
              <b-collapse id="accordion-2" accordion="filter-accordion" role="tabpanel">
                <b-card-body>
                  <div v-for="option in filterOptions.years">
                    <input type="checkbox" v-bind:id="option" v-bind:name="option" v-bind:value="option">
                    <label v-bind:for="option">{{ option }}</label><br>
                  </div>
                </b-card-body>
              </b-collapse>
            </b-card>
            
            <b-card no-body class="mb-1">
              <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button block v-b-toggle.accordion-3 variant="primary">Type of Map</b-button>
              </b-card-header>
              <b-collapse id="accordion-3" accordion="filter-accordion" role="tabpanel">
                <b-card-body>
                  <div v-for="option in filterOptions.mapTypes">
                    <input type="checkbox" v-bind:id="option" v-bind:name="option" v-bind:value="option">
                    <label v-bind:for="option">{{ option }}</label><br>
                  </div>
                </b-card-body>
              </b-collapse>
            </b-card>
          </sidebar>`,
        asyncComputed: {
            async filterOptions() {
                const response = await fetch('/filters');
                const data = await response.json();
                return data.filters;
            }
        },
    })

    Vue.component('image-grid', {
        template: `
        <div id="image-grid">
            <img v-for="image in imageData"
                class="grid-image"
                v-bind:src="image.src"
                height="200px"
                @click="selectImage" />
        </div>`,
        asyncComputed: {
            async imageData() {
                const response = await fetch('/images');
                return (await response.json()).images;
            }
        },
        methods: {
            selectImage(event) {
                var url = "http://127.0.0.1/8080/details.html?title="+event.target.title;
                var url = "http://127.0.0.1:8080/detailpage?title="+"ba-057";
                window.open(url);
            }
        }
    })
    
    async function getImageRowFiltered() {
        
        //TODO expects args 'type' (comma sep. string) 'location' (not sure) 'min_year' and 'max_year'(ints)
        const response = await fetch('/imagesArgs');
        const data = await response.json();
        return data.images;
    }

    new Vue({
        el: '#app',
        data: function () {
            return {
                filters: filters,
                searchParameters: ''
            };
        },
    });
})();
