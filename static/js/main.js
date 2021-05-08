(async function () {
    'use strict';

    const filterSelections = {
        locations: [],
        minYear: 0,
        maxYear: 10000,
        mapTypes: [],
        searchParameter: '',
    };

    Vue.component('filters', {
        template: `
          <sidebar class="accordion" role="tablist" v-show="filterOptions !== null">
            <b-card no-body class="mb-1">
              <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button block v-b-toggle.accordion-1 variant="primary">Location</b-button>
              </b-card-header>
              <b-collapse id="accordion-1" accordion="filter-accordion" role="tabpanel">
                <b-card-body>
                  <div v-for="option in filterOptions.locations">
                    <input type="checkbox" :id="option" :name="option" :value="option" @change="toggleLocationSelected(option)">
                    <label :for="option">{{ option }}</label><br>
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
                  <div class="range-slider" id="slider-range"></div>
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
                    <input type="checkbox" :id="option" :name="option" :value="option" @change="toggleMapTypeSelected(option)">
                    <label :for="option">{{ option }}</label><br>
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
        updated() {
            this.createRangeSlider();
        },
        methods: {
            createRangeSlider() {
                const sliderRange = d3
                    .sliderBottom()
                    .min(this.filterOptions.minYear)
                    .max(this.filterOptions.maxYear)
                    .tickFormat(String)
                    .ticks(this.filterOptions.years)
                    .step(1)
                    .default([this.filterOptions.minYear, this.filterOptions.maxYear])
                    .fill('#2196f3')
                    .on('onchange', val => {
                        filterSelections.minYear = val[0];
                        filterSelections.maxYear = val[1];
                    });

                const gRange = d3
                    .select('#slider-range')
                    .append('svg')
                    .attr('width', 500)
                    .attr('height', 100)
                    .append('g')
                    .attr('transform', 'translate(30,30)');

                gRange.call(sliderRange);
            },
            toggleLocationSelected(location) {
                if (filterSelections.locations.includes(location)) {
                    filterSelections.locations.splice(filterSelections.locations.indexOf(location), 1);
                } else {
                    filterSelections.locations.push(location);
                }
            },
            toggleMapTypeSelected(mapType) {
                if (filterSelections.mapTypes.includes(mapType)) {
                    filterSelections.mapTypes.splice(filterSelections.mapTypes.indexOf(mapType), 1);
                } else {
                    filterSelections.mapTypes.push(mapType);
                }
            }
        }
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
                console.log(filterSelections);
                const response = await fetch('/images', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        filters: {
                            location: filterSelections.locations,
                            minYear: filterSelections.minYear,
                            maxYear: filterSelections.maxYear,
                            mapType: filterSelections.mapTypes,
                        },
                        searchParameter: filterSelections.searchParameter
                    })
                });
                return (await response.json()).images;
            }
        },
        methods: {
            selectImage(event) {
                window.open(`/details-page/ba-057`);
            }
        }
    })

    new Vue({
        el: '#app',
        data: function () {
            return {
                filterSelections: filterSelections,
            };
        },
    });
})();
