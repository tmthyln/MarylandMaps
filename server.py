try:
    import simplejson as json
except ImportError:
    import json

import argparse
import flask
import psycopg2


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


if __name__ == "__main__":
    args = get_argument_parser().parse_args()
    
    app.run(debug=True, host=args.ip, port=args.port)

