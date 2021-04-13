function clearNode(id) {
    document.getElementById(id).innerText = '';
}

(async function () {
    'use strict';

    let svg = await createVisualization();

    const testImages = [
        {
            href: 'https://digital.lib.umd.edu/binaries/content/gallery/public/maryland-maps/maps/2008/12/md024d.jpg',
            width: 2178,
            height: 3086
        }
    ];

    async function createVisualization() {
        return d3.select('#viz')
            .append('svg');
    }

    async function addImages(imageData) {
        svg.selectAll('image')
            .enter()
            .data(imageData)
            .join('image')
            .attr('href', (img) => img.href)
            .attr('width', (img) => img.width)
            .attr('height', (img) => img.height);
    }

    addImages(testImages);
})();