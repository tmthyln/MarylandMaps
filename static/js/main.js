function clearNode(id) {
    document.getElementById(id).innerText = '';
}

(async function () {
    'use strict';

    const filters = {
        location: new Set(),
        year: new Set(),
        mapType: new Set(),
        interactivity: new Set(),
    };

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
        alert(d);
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
