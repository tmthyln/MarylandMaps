const app = Vue.createApp({
    data() {
        return {
            filterSelections: {
                locations: [],
                minYear: 0,
                maxYear: 10000,
                mapTypes: [],
                searchParameter: '',
            },
            displaySelections: {
                singleImage: ''
            },
        };
    },
});

app.component('filters-section', {
    props: ['title'],
    template: `
    <div>
      <button class="accordion" @click="toggleVisibility">{{ title }}</button>
      <div ref="collapsible" class="panel">
        <slot></slot>
      </div>
    </div>`,
    methods: {
        toggleVisibility(event) {
            event.target.classList.toggle('active');
            if (this.$refs.collapsible.style.display === 'block') {
                this.$refs.collapsible.style.display = 'none';
            } else {
                this.$refs.collapsible.style.display = 'block';
            }
        }
    }
})

app.component('filters', {
    props: ['filterSelections'],
    emits: ['update:filterSelections'],
    template: `
      <div class="sidebar" v-if="fetched">
        <filters-section title="Location">
          <div v-for="option in filterOptions.locations">
            <input type="checkbox" :id="option" :name="option" :value="option" @change="toggleLocationSelected(option)">
            <label :for="option">{{ option }}</label><br>
          </div>
        </filters-section>
        <filters-section title="Year">
          <div class="range-slider" ref="sliderRange" id="slider-range"></div>
        </filters-section>
        <filters-section title="Type of Map">
          <div v-for="option in filterOptions.mapTypes">
            <input type="checkbox" :id="option" :name="option" :value="option" @change="toggleMapTypeSelected(option)">
            <label :for="option">{{ option }}</label><br>
          </div>
        </filters-section>
      </div>`,
    data() {
        return {
            filterOptions: {},
            fetched: false,
        }
    },
    mounted() {
        fetch('/filters')
            .then(response => response.json())
            .then(data => {
                this.filterOptions = data.filters;
                this.fetched = true;
            });
    },
    updated() {
        this.$refs.sliderRange.textContent = '';
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
                    this.filterSelections.minYear = parseInt(val[0]);
                    this.filterSelections.maxYear = parseInt(val[1]);
                    this.$emit('update:filterSelections', this.filterSelections);
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
            if (this.filterSelections.locations.includes(location)) {
                this.filterSelections.locations.splice(this.filterSelections.locations.indexOf(location), 1);
            } else {
                this.filterSelections.locations.push(location);
            }
            this.$emit('update:filterSelections', this.filterSelections);
        },
        toggleMapTypeSelected(mapType) {
            if (this.filterSelections.mapTypes.includes(mapType)) {
                this.filterSelections.mapTypes.splice(this.filterSelections.mapTypes.indexOf(mapType), 1);
            } else {
                this.filterSelections.mapTypes.push(mapType);
            }
            this.$emit('update:filterSelections', this.filterSelections);
        }
    }
})

app.component('image-grid', {
    props: ['image-selection', 'filters'],
    emits: ['update:image-selection'],
    template: `
    <div id="image-grid">
        <img v-for="image in images"
            class="grid-image"
            :src="image.src"
            height="200"
            @click="selectImage(image)" />
    </div>`,
    data() {
        return {
            images: [],
        }
    },
    watch: {
        filters: {
            handler() {
                this.getImageData();
            },
            deep: true,
            immediate: true,
        },
    },
    methods: {
        getImageData() {
            fetch('/images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filters: {
                        location: this.filters.locations,
                        minYear: this.filters.minYear,
                        maxYear: this.filters.maxYear,
                        mapType: this.filters.mapTypes,
                    },
                    searchParameter: this.filters.searchParameter
                })
            })
                .then(response => response.json())
                .then(data => {
                    this.images = data.images;
                })
        },
        selectImage(image) {
            this.$emit('update:image-selection', image.title);
            //window.open(`/details-page/${image.title}`);

        }
    }
})

app.component('image-view', {
    props: ['image'],
    emits: ['update:image'],
    template: `
    <div v-if="show" ref="modal" class="modal" @click.self="closeModal" :style="style">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Image Details</h2>
                <span class="close" @click="closeModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="detailcontent">
                    <div class="sidecolumn">
                        <div v-for="(value, name) in infoAttributes" class="attribute">
                            <div class="parametername">{{ name }}</div>
                            <div class="specifics">{{ value }}</div>
                        </div>
                    </div>
                    <img :src="imageSource" width="520">
                </div>
            </div>
        </div>
    </div>`,
    data() {
        return {
            show: false,
            dataAttributes: {},
        };
    },
    watch: {
        image: {
            handler() {
                this.fetchDetails();
            },
            deep: true,
        }
    },
    computed: {
        infoAttributes() {
            return Object.fromEntries(Object.entries(this.dataAttributes)
                .filter(([key, _]) => key !== 'image'));
        },
        imageSource() {
            return this.dataAttributes.image.src;
        },
        style() {
            if (this.show) {
                return 'display:block';
            } else {
                return 'display:none';
            }
        }
    },
    methods: {
        fetchDetails() {
            fetch(`/details/${this.image}`)
                .then(response => response.json())
                .then(data => {
                    this.dataAttributes = data;
                    this.show = true;
                })
        },
        closeModal() {
            this.show = false;
            this.$nextTick(function() {
                this.$emit('update:image', '');
            });

        },
    }
})

const vm = app.mount('#app');
