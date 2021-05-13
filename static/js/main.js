/* Utilities */
function titleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

/* Frontend Vue components & app */
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
                singleImage: '',
                compareImages: [],
            },
        };
    },
});

app.component('navbar', {
    props: ['query'],
    emits: ['update:query'],
    template: `
    <ul class="navbar">
        <li><h1>Maryland Maps</h1></li>
        <li><input type="search" placeholder="Search" @change="updateQuery"></li>
    </ul>`,
    methods: {
        updateQuery(event) {
            this.$emit('update:query', event.target.value);
        }
    }
})

app.component('filters-section', {
    props: {
        title: String,
        name: String,
        resetable: Boolean,
        clearable: Boolean
    },
    emits: ['reset', 'clear'],
    template: `
    <div>
      <button class="accordion" @click="toggleVisibility">{{ title }}</button>
      <div ref="collapsible" class="panel">
        <slot></slot>
        <div>
            <a class="section-link" v-show="resetable" @click="$emit('reset', name)">Reset</a>
            <a class="section-link" v-show="clearable" @click="$emit('clear', name)">Clear</a>
        </div>
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

app.component('checkbox', {
    props: {
        checked: Boolean,
    },
    emits: ['change'],
    template: `
    <label class="checkbox-container">
      <slot></slot>
      <input type="checkbox" @change="toggleCheckbox" :checked="checked">
      <span class="checkmark"></span>
    </label>`,
    methods: {
        toggleCheckbox(event) {
            this.$emit('change', event.target.checked);
        }
    }
})

app.component('filters', {
    props: ['filterSelections'],
    emits: ['update:filterSelections'],
    template: `
      <div class="sidebar" v-if="fetched">
        <filters-section title="Location" resetable clearable
                @reset="setLocations($event, true)" @clear="setLocations($event, false)">
          <checkbox v-for="option in filterOptions.locations"
                @change="toggleLocationSelected(option)"
                :checked="filterSelections.locations.includes(option)">
            {{ option }}
          </checkbox>
        </filters-section>
        <filters-section title="Year"
                @reset="$nextTick(createRangeSlider)">
          <div class="range-slider" ref="sliderRange" id="slider-range"></div>
        </filters-section>
        <filters-section title="Type of Map" resetable clearable
                @reset="setMapTypes(true)" @clear="setMapTypes(false)">
          <checkbox v-for="option in filterOptions.mapTypes" 
                  @change="toggleMapTypeSelected(option)"
                  :checked="filterSelections.mapTypes.includes(option)">
            {{ option }}
          </checkbox>
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

                this.filterSelections.locations.splice(0, this.filterSelections.locations.length);
                this.filterOptions.locations.forEach(location => {
                    this.filterSelections.locations.push(location);
                });

                this.filterSelections.mapTypes.splice(0, this.filterSelections.mapTypes.length);
                this.filterOptions.mapTypes.forEach(type => {
                    this.filterSelections.mapTypes.push(type);
                })

                this.$emit('update:filterSelections', this.filterSelections);
                this.fetched = true;
            });
    },
    updated() {
        this.createRangeSlider();
    },
    methods: {
        createRangeSlider() {
            this.$refs.sliderRange.textContent = '';

            const sliderRange = d3
                .sliderBottom()
                .width(250)
                .min(this.filterOptions.minYear)
                .max(this.filterOptions.maxYear)
                .tickFormat(String)
                .ticks(this.filterOptions.years)
                .step(1)
                .default([
                    Math.max(this.filterOptions.minYear, this.filterSelections.minYear),
                    Math.min(this.filterOptions.maxYear, this.filterSelections.maxYear)])
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

            this.$emit('update:filterSelections', this.filterSelections);
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
        },
        setLocations(event, addAll) {
            this.filterSelections.locations.splice(0, this.filterSelections.locations.length);
            if (addAll) {
                this.filterOptions.locations.forEach(location => {
                    this.filterSelections.locations.push(location);
                })
            }

            this.$emit('update:filterSelections', this.filterSelections);
        },
        setMapTypes(addAll) {
            this.filterSelections.mapTypes.splice(0, this.filterSelections.mapTypes.length);
            if (addAll) {
                this.filterOptions.mapTypes.forEach(type => {
                    this.filterSelections.mapTypes.push(type);
                })
            }

            this.$emit('update:filterSelections', this.filterSelections);
        }
    }
})

app.component('image-grid', {
    props: ['image-selection', 'comparison-images', 'filters'],
    emits: ['update:image-selection', 'update:comparison-images'],
    template: `
    <div id="image-grid">
        <figure v-for="image in images"
                :key="image.filename"
                class="grid-item"
                @click.exact="selectImage(image)"
                @click.ctrl.exact="selectComparisonImage(image)">
            <img class="grid-image" :src="image.src" height="200" />
            <figcaption class="image-description">{{ image.title }}</figcaption>
        </figure>
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
        selectComparisonImage(image) {
            this.comparisonImages.push(image.filename);
            this.$emit('update:comparison-images', this.comparisonImages);
        },
        selectImage(image) {
            this.$emit('update:image-selection', image.filename);
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
                <h2>{{ dataAttributes.name }}</h2>
                <span class="close" @click="closeModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="detailcontent">
                    <div class="sidecolumn">
                        <div v-for="(value, name) in infoAttributes" class="attribute">
                            <div class="parametername">{{ titleCase(name) }}</div>
                            <div class="specifics">{{ value }}</div>
                        </div>
                    </div>
                    <img :src="imageSource">
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
            handler(newImage) {
                if (newImage !== '')
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
                });
        },
        closeModal() {
            this.show = false;
            this.$nextTick(function () {
                this.$emit('update:image', '');
            });

        },
        titleCase(str) {
            return str.replace(
                /\w\S*/g,
                function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        },
    }
})

app.component('overlay-view', {
    props: ['images'],
    emits: ['update:images'],
    template: `
    <div v-if="show" ref="modal" class="modal" @click.self="closeModal" :style="style">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Image Comparison Overlay View</h2>
                <span class="close" @click="closeModal">&times;</span>
            </div>
            <div class="modal-body">
                <p v-for="image in images">{{ image }}</p>
            </div>
        </div>
    </div>`,
    data() {
        return {
            show: false,
        };
    },
    watch: {
        images: {
            handler(newImages) {
                console.log(newImages)
                if (newImages.length === 2) {
                    this.show = true;
                }
            },
            deep: true,
        },
    },
    computed: {
        style() {
            if (this.show) {
                return 'display:block';
            } else {
                return 'display:none';
            }
        }
    },
    methods: {
        closeModal() {
            this.show = false;
            this.$nextTick(function () {
                this.$emit('update:images', []);
            });

        },
    },
})

const vm = app.mount('#app');
