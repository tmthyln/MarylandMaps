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
          <sidebar class="accordion" role="tablist">
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
        data() {
            return {
                loaded: false
            };
        },
        asyncComputed: {
            async filterOptions() {
                return fetch('/filters')
                    .then(response => response.json())
                    .then(data => {
                        this.filterOptions = data.filters;
                        this.loaded = true;
                    });
            }
        },
    })

    async function getImageRow() {
        const response = await fetch('/images');
        const data = await response.json();
        return data.images;
    }
    
    async function getImageRowFiltered() {
        
        //TODO expects args 'type' (comma sep. string) 'location' (not sure) 'min_year' and 'max_year'(ints)
        const response = await fetch('/imagesArgs');
        const data = await response.json();
        return data.images;
    }

    async function addImages(imageData) {
        d3.select('#image-grid')
            .selectAll('img')
            .data(imageData)
            .join('img')
            .classed('grid-image', true)
            .attr('src', (img) => img.src)
            .attr('height', (img) => "200px")
            .on('click', selectImage);
    }
    
    function selectImage(d) {
      window.location.href = "http://127.0.0.1:8080/details.html";
    }

    await addImages(await getImageRow());

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
