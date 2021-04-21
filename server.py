try:
    import simplejson as json
except ImportError:
    import json

import argparse
import flask
import os
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
    return flask.render_template('details.html')


@app.route('/images')
def get_images():
    return json_response({
        'images': [
            {
                'src': f'/random-image?val={random.random()}'
            } for _ in range(40)
        ]
    })


@app.route('/random-image')
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
    title = request.args.get("title")
    # data = dataset.get_details_from_title(title)
    data="0"
    resp = Response(response=json.dumps(data), status=200, mimetype='application/json')
    h = resp.headers
    h['Access-Control-Allow-Origin'] = "*"
    return resp


if __name__ == "__main__":
    args = get_argument_parser().parse_args()
    
    app.run(debug=True, host=args.ip, port=args.port)

