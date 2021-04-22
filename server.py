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
    return flask.render_template('details.html', title="ba-057")


@app.route('/detailpage')
def go_to_detail_page():
    title = flask.request.args.get('title')
    return flask.render_template('details.html', title=title)


@app.route('/homepage')
def go_to_homepage():
    print("called homepage")
    return flask.render_template('index.html')


@app.route('/imagesArgs')
def images_with_filters():
    types = flask.request.args.get('type')
    locations = flask.request.args.get('location')
    min_year = int(flask.request.args.get('min_year'))
    max_year = int(flask.request.args.get('max_year'))
    filtered_files = list(df[min_year <= df.date_filter <= max_year and
                             df.type_filter in types]['Digital_Image'])


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


@app.route('/details')
def get_details_map():
    title = flask.request.args.get("title")

    data = {"name": "A Horse Map of Maryland, Showing all Phases of Horse Activity",
            "location": "Maryland",
            "type": "Thematic Map",
            "year": "1941",
            "call": "MD 024",
            "publisher": "Maryland Horse Breeder's Association",
            "image": {"src": "images/random?val=0.6370243755573912"}
            }
    return json_response(data)


@app.route('/filters')
def get_filter_options():
    years = df['date_filter'].astype('string').unique()
    map_types = df['type_filter'].unique()
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
