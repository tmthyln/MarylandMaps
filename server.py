try:
    import simplejson as json
except ImportError:
    import json

import argparse
import flask
import os
import pandas as pd
import random
import re
df = pd.read_csv('data-scraper/maps_augmented1.1.csv')


def get_argument_parser():
    parser = argparse.ArgumentParser(description='Visualize the Maryland Maps dataset.')

    parser.add_argument('--ip', default='127.0.0.1',
                        help='ip address to run the visualization server on')
    parser.add_argument('--port', '-p', type=int, default=8080,
                        help='port to run the visualization server on')

    return parser


def json_response(contents):
    payload = json.dumps(contents)

    resp = flask.Response(response=payload, status=200, mimetype='application/json')
    resp.headers['Access-Control-Allow-Origin'] = "*"

    return resp


app = flask.Flask(__name__)


@app.route('/')
def main_page():
    return flask.render_template('index.html')


@app.route('/detailpage')
def go_to_detail_page():
    title = flask.request.args.get('title')
    title = re.search('/images/(.*)', title)[1]
    print(title)
    return flask.render_template('details.html', title=title)


@app.route('/homepage')
def go_to_homepage():
    print("called homepage")
    return flask.render_template('details.html', title="ba-057")


@app.route('/imagesfiltered')
def images_with_filters():
    
    #locations = flask.request.args.get('location')
    #min_year = int(flask.request.args.get('min_year'))
    #max_year = int(flask.request.args.get('max_year'))
    filtered_files = list(df[min_year <= df.date_filter <= max_year and
                             df.type_filter in types]['Digital_Image'])


@app.route('/images', methods=['GET', 'POST'])
def get_images():
    data = flask.request.json if flask.request.method == 'POST' else {}
    print(data)
    filters = data['filters']
    types = filters['mapType']
    locations =filters['location']
    min_year = int(filters['minYear'])
    max_year = int(filters['maxYear'])
    filtered_files = list(df[(min_year <= df.date_filter) & (df.date_filter <= max_year) &
                            df.Location.isin(locations) & df.type_filter.isin(types)].copy()['Digital Image'])
    return json_response({
        'images': [
            {
                
                'src' : f'/images/%s'%filtered_files[i]
            } for i in range(0, len(filtered_files))
        ]
    })


@app.route('/images/<title>')
def get_test_image(title):
    files = list(filter(lambda f: f.endswith('.jpg'), os.listdir('data-scraper')))
    
    if title in files:
        filepath = f'data-scraper/{title}'
    elif title == 'random':
        filepath = f'data-scraper/{random.choice(files)}'
        
    resp = flask.send_file(filepath, mimetype='image/jpeg')
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = 0
    return resp


@app.route('/details')
def get_details_map():
    title = flask.request.args.get("title")[1:-1]
    obj = df[df['Digital Image'] == title]
    print(title)
    data = {"name": str(obj['Title'].values[0]),
            "location": str(obj['Location'].values[0]),
            "type": str(obj['Type of Map'].values[0]),
            "year": str(obj['Year(s)'].values[0]),
            "call": str(obj['Call Number'].values[0]),
            "publisher": str(obj['Publisher / Printer'].values[0]),
            "image": {"src": "images/"+ title}
            }
    return json_response(data)


@app.route('/filters')
def get_filter_options():
    years = df['date_filter'].astype('string').unique()
    map_types = df['type_filter'].unique()
    locations = df['Location'].unique()
    
    return json_response({
        'filters': {
            'years': list(years),
            'mapTypes': list(map_types),
            'locations': list(locations)
        }
    })


if __name__ == "__main__":
    args = get_argument_parser().parse_args()

    app.run(debug=True, host=args.ip, port=args.port)
