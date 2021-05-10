try:
    import simplejson as json
except ImportError:
    import json

import argparse
import flask
import os
import pandas as pd
import random

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


@app.route('/images', methods=['GET', 'POST'])
def get_images():
    data = flask.request.json if flask.request.method == 'POST' else {}
    
    locations = data['filters']['location']
    min_year = data['filters']['minYear']
    max_year = data['filters']['maxYear']
    map_types = data['filters']['mapType']
    string_query = data['searchParameter']
    
    filtered_files = list(df[(min_year <= df.date_filter) & (df.date_filter <= max_year) &
                             df.Location.isin(locations) & df.type_filter.isin(map_types)]
                          .copy()['Digital Image'])
    
    # TODO use string search parameter
    
    return json_response({
        'images': [
            {
                'title': filename,
                'src': f'/images/small/{filename}'
            } for filename in filtered_files
        ]
    })

# I don't want to touch the frontend so I am doing a semi-dumb redirection in here
@app.route('/images/full/<title>')
def get_full_image(title):
    return get_test_image("full/" + title)


@app.route('/images/small/<title>')
def get_small_image(title):
    return get_test_image("small/" + title)

def get_test_image(title):
    max_height = flask.request.args.get('maxHeight', None)
    
    files = list(filter(lambda f: f.endswith('.jpg'), os.listdir('data-scraper/small/')))
    
    if title[title.index('/')+1:] in files:
        filepath = f'data-scraper/{title}'
    elif title == 'random':
        filepath = f'data-scraper/full/{random.choice(files)}'
        
    resp = flask.send_file(filepath, mimetype='image/jpeg')
    
    if title == 'random':
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        resp.headers['Pragma'] = 'no-cache'
        resp.headers['Expires'] = 0
    
    return resp


@app.route('/details/<title>')
def get_details_map(title):
    obj = df[df['Digital Image'] == title]

    return json_response({
        "name": str(obj['Title'].values[0]),
        "location": str(obj['Location'].values[0]),
        "type": str(obj['Type of Map'].values[0]),
        "year": str(obj['Year(s)'].values[0]),
        "call": str(obj['Call Number'].values[0]),
        "publisher": str(obj['Publisher / Printer'].values[0]),
        "image": {"src": "/images/full/" + title}
    })


@app.route('/filters')
def get_filter_options():
    years = df['date_filter'].astype('string').unique()
    map_types = df['type_filter'].unique()
    locations = df['Location'].unique()
    
    return json_response({
        'filters': {
            'years': list(years),
            'minYear': min(years),
            'maxYear': max(years),
            'mapTypes': list(map_types),
            'locations': list(locations)
        }
    })


if __name__ == "__main__":
    args = get_argument_parser().parse_args()

    app.run(debug=True, host=args.ip, port=args.port)
