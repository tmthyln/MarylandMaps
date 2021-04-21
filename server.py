try:
    import simplejson as json
except ImportError:
    import json

import argparse
import flask
import os
import pandas as pd
import psycopg2
import random


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


@app.route('/images')
def get_images():
    return json_response({
        'images': [
            {
                'src': f'/images/random?val={random.random()}'
            } for _ in range(50)
        ]
    })


@app.route('/images/random')
def get_test_image():
    files = list(filter(lambda f: f.endswith('.jpg'), os.listdir('data-scraper')))
    filepath = f'data-scraper/{random.choice(files)}'
    
    resp = flask.send_file(filepath, mimetype='image/jpeg')
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = 0
    
    return resp


@app.route('/filters')
def get_filter_options():
    df = pd.read_csv('data-scraper/maps.csv', dtype=str, na_filter=False)
    years = df['Year(s)'].unique()
    map_types = df['Type of Map'].unique()
    locations = df['Location'].unique()
    
    print(years)
    
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

