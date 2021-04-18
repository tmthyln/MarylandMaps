function clearNode(id) {
    document.getElementById(id).innerText = '';
}

(async function () {
    'use strict';

    async function getImageRow() {
        const response = await fetch('/images');
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
            .attr('height', (img) => "200px");
    }

    addImages(await getImageRow());
})();